//! Paid comments. Anyone comments, with or without an account:
//!
//! 1. `POST /posts/{id}/comments` saves the comment as `pending` and returns
//!    everything the wallet needs to build the `pay_comment` transaction.
//! 2. The wallet signs and sends it; the comment id travels on-chain.
//! 3. `POST /comments/{id}/confirm` with the transaction signature: the API
//!    reads the transaction from Solana and publishes the comment only if it
//!    really paid for it.

use std::str::FromStr;

use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use chrono::{DateTime, Utc};
use pinata::pda;
use serde::{Deserialize, Serialize};
use solana_signature::Signature;
use uuid::Uuid;

use crate::{
    auth::parse_wallet,
    chain::{ExpectedPayment, PaymentCheck},
    error::{ApiResult, AppError},
    users::Author,
    AppState,
};

#[derive(Serialize)]
pub struct CommentView {
    pub id: Uuid,
    pub post_id: Uuid,
    pub content: String,
    pub amount_lamports: i64,
    pub status: String,
    pub tx_signature: Option<String>,
    pub created_at: DateTime<Utc>,
    /// Wallet that paid, with its profile when that wallet has an account
    pub author: Author,
}

#[derive(sqlx::FromRow)]
struct CommentRow {
    id: Uuid,
    post_id: Uuid,
    content: String,
    amount_lamports: i64,
    status: String,
    tx_signature: Option<String>,
    created_at: DateTime<Utc>,
    commenter_wallet: String,
    username: Option<String>,
    display_name: Option<String>,
    avatar_url: Option<String>,
}

impl From<CommentRow> for CommentView {
    fn from(row: CommentRow) -> Self {
        Self {
            id: row.id,
            post_id: row.post_id,
            content: row.content,
            amount_lamports: row.amount_lamports,
            status: row.status,
            tx_signature: row.tx_signature,
            created_at: row.created_at,
            author: Author::new(row.commenter_wallet, row.username, row.display_name, row.avatar_url),
        }
    }
}

// The LEFT JOIN on the wallet links comments to accounts: a wallet that
// commented anonymously and signs in later gets its profile on every comment.
const SELECT_COMMENTS: &str = "
    SELECT c.id, c.post_id, c.content, c.amount_lamports, c.status, c.tx_signature, c.created_at,
           c.commenter_wallet, u.username, u.display_name, u.avatar_url
    FROM comments c
    LEFT JOIN users u ON u.wallet = c.commenter_wallet";

pub async fn confirmed_for_post(state: &AppState, post_id: Uuid) -> ApiResult<Vec<CommentView>> {
    let rows = sqlx::query_as::<_, CommentRow>(&format!(
        "{SELECT_COMMENTS} WHERE c.post_id = $1 AND c.status = 'confirmed' ORDER BY c.created_at"
    ))
    .bind(post_id)
    .fetch_all(&state.db)
    .await?;
    Ok(rows.into_iter().map(Into::into).collect())
}

async fn find(state: &AppState, id: Uuid) -> ApiResult<CommentView> {
    sqlx::query_as::<_, CommentRow>(&format!("{SELECT_COMMENTS} WHERE c.id = $1"))
        .bind(id)
        .fetch_optional(&state.db)
        .await?
        .map(Into::into)
        .ok_or(AppError::NotFound("Comment"))
}

#[derive(Deserialize)]
pub struct NewComment {
    /// Wallet that will pay (and be the commenter)
    pub wallet: String,
    pub content: String,
    pub amount_lamports: u64,
}

/// Accounts and arguments of the `pay_comment` instruction.
#[derive(Serialize)]
pub struct PaymentInstruction {
    pub program_id: String,
    /// The comment id as 32 hex characters: its 16 bytes are the `comment_id` argument
    pub comment_id_hex: String,
    pub amount_lamports: u64,
    pub commenter: String,
    pub config: String,
    pub creator: String,
    pub creator_pinata: String,
    pub platform_pinata: String,
    pub platform_wallet: String,
}

#[derive(Serialize)]
pub struct CommentIntent {
    pub comment: CommentView,
    pub payment: PaymentInstruction,
}

pub async fn create(
    State(state): State<AppState>,
    Path(post_id): Path<Uuid>,
    Json(input): Json<NewComment>,
) -> ApiResult<(StatusCode, Json<CommentIntent>)> {
    let commenter = parse_wallet(&input.wallet)?;
    let content = input.content.trim();
    if !(1..=500).contains(&content.chars().count()) {
        return Err(AppError::bad_request("A comment must have 1 to 500 characters."));
    }
    let author_wallet: String = sqlx::query_scalar(
        "SELECT u.wallet FROM posts p JOIN users u ON u.id = p.author_id WHERE p.id = $1",
    )
    .bind(post_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound("Post"))?;
    let creator = parse_wallet(&author_wallet)?;

    // Same rules the program enforces, checked early for a clear message
    let config = state.chain.config().await?;
    if input.amount_lamports < config.params.min_comment_lamports {
        return Err(AppError::bad_request(format!(
            "The minimum comment is {} lamports.",
            config.params.min_comment_lamports
        )));
    }
    let pinata = state
        .chain
        .creator_pinata(&creator)
        .await?
        .filter(|pinata| pinata.status == "open")
        .ok_or_else(|| AppError::conflict("This creator has no open Piñata, so the post cannot receive comments yet."))?;

    // Unpaid comments expire after an hour
    sqlx::query("DELETE FROM comments WHERE status = 'pending' AND created_at < now() - interval '1 hour'")
        .execute(&state.db)
        .await?;
    let id = Uuid::new_v4();
    sqlx::query(
        "INSERT INTO comments (id, post_id, commenter_wallet, content, amount_lamports, creator_pinata_round)
         VALUES ($1, $2, $3, $4, $5, $6)",
    )
    .bind(id)
    .bind(post_id)
    .bind(commenter.to_string())
    .bind(content)
    .bind(i64::try_from(input.amount_lamports).map_err(|_| AppError::bad_request("Amount too large."))?)
    .bind(pinata.round as i64)
    .execute(&state.db)
    .await?;

    let payment = PaymentInstruction {
        program_id: pinata::ID.to_string(),
        comment_id_hex: id.simple().to_string(),
        amount_lamports: input.amount_lamports,
        commenter: commenter.to_string(),
        config: pda::config().to_string(),
        creator: creator.to_string(),
        creator_pinata: pinata.address,
        platform_pinata: pda::platform_pinata(config.platform_round).to_string(),
        platform_wallet: config.params.platform_wallet.to_string(),
    };
    Ok((StatusCode::CREATED, Json(CommentIntent { comment: find(&state, id).await?, payment })))
}

#[derive(Deserialize)]
pub struct Confirmation {
    pub signature: String,
}

#[derive(sqlx::FromRow)]
struct PendingComment {
    commenter_wallet: String,
    amount_lamports: i64,
    status: String,
    tx_signature: Option<String>,
    creator_pinata_round: Option<i64>,
    author_wallet: String,
}

pub async fn confirm(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(input): Json<Confirmation>,
) -> ApiResult<Json<CommentView>> {
    let signature =
        Signature::from_str(input.signature.trim()).map_err(|_| AppError::bad_request("Invalid transaction signature."))?;
    let comment = sqlx::query_as::<_, PendingComment>(
        "SELECT c.commenter_wallet, c.amount_lamports, c.status, c.tx_signature, c.creator_pinata_round,
                u.wallet AS author_wallet
         FROM comments c JOIN posts p ON p.id = c.post_id JOIN users u ON u.id = p.author_id
         WHERE c.id = $1",
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound("Comment"))?;

    match comment.status.as_str() {
        // Confirming twice with the same transaction is harmless
        "confirmed" if comment.tx_signature.as_deref() == Some(input.signature.trim()) => {
            return find(&state, id).await.map(Json)
        }
        "confirmed" => return Err(AppError::conflict("This comment is already paid.")),
        _ => {}
    }

    let creator = parse_wallet(&comment.author_wallet)?;
    let round = comment
        .creator_pinata_round
        .ok_or_else(|| AppError::conflict("This comment cannot be paid."))?;
    let expected = ExpectedPayment {
        comment_id: *id.as_bytes(),
        commenter: parse_wallet(&comment.commenter_wallet)?,
        creator,
        creator_pinata: pda::pinata(&creator, round as u64),
        amount_lamports: comment.amount_lamports as u64,
    };

    let status = match state.chain.check_comment_payment(&signature, &expected).await? {
        PaymentCheck::Paid => "confirmed",
        PaymentCheck::Failed => "failed",
    };
    // tx_signature is UNIQUE: one payment can never publish two comments
    sqlx::query(
        "UPDATE comments SET status = $2, tx_signature = $3,
                confirmed_at = CASE WHEN $2 = 'confirmed' THEN now() END
         WHERE id = $1",
    )
    .bind(id)
    .bind(status)
    .bind(input.signature.trim())
    .execute(&state.db)
    .await?;
    if status == "failed" {
        return Err(AppError::conflict("The payment transaction failed on-chain, so the comment was not published."));
    }
    find(&state, id).await.map(Json)
}
