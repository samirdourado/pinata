//! Sign in with a Solana wallet.
//!
//! 1. `POST /auth/nonce` with the wallet address returns a message to sign.
//! 2. The wallet signs it (free: it is not a transaction and moves no SOL).
//! 3. `POST /auth/verify` checks the ed25519 signature against the wallet
//!    address, creates the account on first sign-in and sets a session cookie.

use std::str::FromStr;

use anchor_lang::prelude::Pubkey;
use axum::{
    extract::{FromRequestParts, State},
    http::{
        header::{COOKIE, SET_COOKIE},
        request::Parts,
        HeaderMap,
    },
    response::{AppendHeaders, IntoResponse},
    Json,
};
use chrono::{DateTime, Duration, Utc};
use ed25519_dalek::{Signature, VerifyingKey};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use uuid::Uuid;

use crate::{
    error::{ApiResult, AppError},
    users::{Me, UserRow},
    AppState,
};

const SESSION_COOKIE: &str = "pinata_session";
const SESSION_DAYS: i64 = 30;
const NONCE_MINUTES: i64 = 10;

#[derive(Deserialize)]
pub struct NonceRequest {
    pub wallet: String,
}

#[derive(Serialize)]
pub struct NonceResponse {
    pub nonce: String,
    /// Exact text the wallet must sign
    pub message: String,
    pub expires_at: DateTime<Utc>,
}

pub async fn nonce(State(state): State<AppState>, Json(input): Json<NonceRequest>) -> ApiResult<Json<NonceResponse>> {
    let wallet = parse_wallet(&input.wallet)?;
    let nonce = bs58::encode(random_bytes::<16>()).into_string();
    let issued_at = Utc::now();
    let expires_at = issued_at + Duration::minutes(NONCE_MINUTES);
    // Sign In With Solana message format (CAIP-122), which wallets display nicely
    let message = format!(
        "{domain} wants you to sign in with your Solana account:\n{wallet}\n\n\
         Sign in to Pinata. This is free and does not move any SOL.\n\n\
         URI: {uri}\nVersion: 1\nChain ID: devnet\nNonce: {nonce}\n\
         Issued At: {issued}\nExpiration Time: {expires}",
        domain = state.settings.app_domain(),
        uri = state.settings.frontend_origin,
        issued = issued_at.to_rfc3339(),
        expires = expires_at.to_rfc3339(),
    );

    sqlx::query("DELETE FROM auth_nonces WHERE expires_at < now()")
        .execute(&state.db)
        .await?;
    sqlx::query("INSERT INTO auth_nonces (nonce, wallet, message, expires_at) VALUES ($1, $2, $3, $4)")
        .bind(&nonce)
        .bind(wallet.to_string())
        .bind(&message)
        .bind(expires_at)
        .execute(&state.db)
        .await?;
    Ok(Json(NonceResponse { nonce, message, expires_at }))
}

#[derive(Deserialize)]
pub struct VerifyRequest {
    pub wallet: String,
    pub nonce: String,
    /// ed25519 signature of the message, base58 (what wallets return, encoded)
    pub signature: String,
}

pub async fn verify(
    State(state): State<AppState>,
    Json(input): Json<VerifyRequest>,
) -> ApiResult<impl IntoResponse> {
    let wallet = parse_wallet(&input.wallet)?;
    // DELETE … RETURNING makes each nonce single use, even with concurrent requests
    let message: Option<String> = sqlx::query_scalar(
        "DELETE FROM auth_nonces WHERE nonce = $1 AND wallet = $2 AND expires_at > now() RETURNING message",
    )
    .bind(&input.nonce)
    .bind(wallet.to_string())
    .fetch_optional(&state.db)
    .await?;
    let message = message.ok_or_else(|| AppError::bad_request("Sign-in request expired. Start again."))?;

    let signature: [u8; 64] = bs58::decode(&input.signature)
        .into_vec()
        .ok()
        .and_then(|bytes| bytes.try_into().ok())
        .ok_or_else(|| AppError::bad_request("Invalid signature."))?;
    let key = VerifyingKey::from_bytes(&wallet.to_bytes()).map_err(|_| AppError::bad_request("Invalid wallet."))?;
    key.verify_strict(message.as_bytes(), &Signature::from_bytes(&signature))
        .map_err(|_| AppError::bad_request("The signature does not match this wallet."))?;

    // First sign-in creates the account. Comments this wallet paid for before
    // already point at it, so they show the profile from now on.
    let user = sqlx::query_as::<_, UserRow>(
        "INSERT INTO users (id, wallet) VALUES ($1, $2)
         ON CONFLICT (wallet) DO UPDATE SET updated_at = users.updated_at
         RETURNING id, wallet, username, display_name, bio, avatar_url, created_at",
    )
    .bind(Uuid::new_v4())
    .bind(wallet.to_string())
    .fetch_one(&state.db)
    .await?;

    let token = bs58::encode(random_bytes::<32>()).into_string();
    sqlx::query("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)")
        .bind(hash_token(&token))
        .bind(user.id)
        .bind(Utc::now() + Duration::days(SESSION_DAYS))
        .execute(&state.db)
        .await?;

    let cookie = session_cookie(&token, SESSION_DAYS * 24 * 3600, state.settings.cookie_secure);
    Ok((AppendHeaders([(SET_COOKIE, cookie)]), Json(Me::from(user))))
}

pub async fn logout(State(state): State<AppState>, headers: HeaderMap) -> ApiResult<impl IntoResponse> {
    if let Some(token) = session_token(&headers) {
        sqlx::query("DELETE FROM sessions WHERE token_hash = $1")
            .bind(hash_token(&token))
            .execute(&state.db)
            .await?;
    }
    let cookie = session_cookie("", 0, state.settings.cookie_secure);
    Ok((AppendHeaders([(SET_COOKIE, cookie)]), Json(serde_json::json!({ "ok": true }))))
}

/// Extractor for routes that require a signed-in account.
pub struct CurrentUser(pub UserRow);

/// Extractor for routes that work for everyone but personalize for accounts.
pub struct MaybeUser(pub Option<UserRow>);

impl FromRequestParts<AppState> for CurrentUser {
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &AppState) -> Result<Self, Self::Rejection> {
        let MaybeUser(user) = MaybeUser::from_request_parts(parts, state).await?;
        user.map(CurrentUser).ok_or(AppError::Unauthorized)
    }
}

impl FromRequestParts<AppState> for MaybeUser {
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &AppState) -> Result<Self, Self::Rejection> {
        let Some(token) = session_token(&parts.headers) else {
            return Ok(Self(None));
        };
        let user = sqlx::query_as::<_, UserRow>(
            "SELECT u.id, u.wallet, u.username, u.display_name, u.bio, u.avatar_url, u.created_at
             FROM sessions s JOIN users u ON u.id = s.user_id
             WHERE s.token_hash = $1 AND s.expires_at > now()",
        )
        .bind(hash_token(&token))
        .fetch_optional(&state.db)
        .await?;
        Ok(Self(user))
    }
}

pub fn parse_wallet(value: &str) -> ApiResult<Pubkey> {
    Pubkey::from_str(value.trim()).map_err(|_| AppError::bad_request("Invalid wallet address."))
}

fn session_token(headers: &HeaderMap) -> Option<String> {
    headers
        .get_all(COOKIE)
        .iter()
        .filter_map(|value| value.to_str().ok())
        .flat_map(|value| value.split(';'))
        .find_map(|pair| pair.trim().strip_prefix(&format!("{SESSION_COOKIE}=")).map(str::to_string))
        .filter(|token| !token.is_empty())
}

/// HttpOnly: page scripts cannot read it. SameSite=Lax: other sites cannot
/// make the browser send it with their requests.
fn session_cookie(token: &str, max_age_seconds: i64, secure: bool) -> String {
    let secure = if secure { "; Secure" } else { "" };
    format!("{SESSION_COOKIE}={token}; HttpOnly; Path=/; SameSite=Lax; Max-Age={max_age_seconds}{secure}")
}

fn hash_token(token: &str) -> Vec<u8> {
    Sha256::digest(token.as_bytes()).to_vec()
}

fn random_bytes<const N: usize>() -> [u8; N] {
    let mut bytes = [0u8; N];
    rand::rngs::OsRng.fill_bytes(&mut bytes);
    bytes
}
