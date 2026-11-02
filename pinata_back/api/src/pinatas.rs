//! Piñatas: live state read from Solana, past winners from the database.

use axum::{
    extract::{Path, Query, State},
    Json,
};
use chrono::{DateTime, Utc};
use pinata::pda;
use serde::{Deserialize, Serialize};

use crate::{
    chain::PinataView,
    error::ApiResult,
    users::{self, Author},
    AppState,
};

/// The rules the web app needs for its forms, straight from the on-chain Config.
#[derive(Serialize)]
pub struct RulesView {
    pub program_id: String,
    pub platform_wallet: String,
    pub creator_bps: u16,
    pub creator_pinata_bps: u16,
    pub platform_pool_bps: u16,
    pub platform_bps: u16,
    pub min_comment_lamports: u64,
    pub creator_target_min_lamports: u64,
    pub creator_target_max_lamports: u64,
    pub creator_threshold_min_bps: u16,
    pub creator_threshold_max_bps: u16,
    pub platform_target_lamports: u64,
    pub platform_threshold_bps: u16,
    pub platform_winners: u8,
}

pub async fn rules(State(state): State<AppState>) -> ApiResult<Json<RulesView>> {
    let params = state.chain.config().await?.params;
    Ok(Json(RulesView {
        program_id: pinata::ID.to_string(),
        platform_wallet: params.platform_wallet.to_string(),
        creator_bps: params.split.creator_bps,
        creator_pinata_bps: params.split.creator_pinata_bps,
        platform_pool_bps: params.split.platform_pool_bps,
        platform_bps: params.split.platform_bps,
        min_comment_lamports: params.min_comment_lamports,
        creator_target_min_lamports: params.creator_target_min_lamports,
        creator_target_max_lamports: params.creator_target_max_lamports,
        creator_threshold_min_bps: params.creator_threshold_min_bps,
        creator_threshold_max_bps: params.creator_threshold_max_bps,
        platform_target_lamports: params.platform_target_lamports,
        platform_threshold_bps: params.platform_threshold_bps,
        platform_winners: params.platform_winners,
    }))
}

#[derive(Serialize)]
pub struct WinnerView {
    pub kind: String,
    pub round: Option<i64>,
    pub prize_lamports: i64,
    pub tx_signature: Option<String>,
    pub won_at: DateTime<Utc>,
    pub winner: Author,
}

#[derive(sqlx::FromRow)]
struct WinnerRow {
    kind: String,
    round: Option<i64>,
    prize_lamports: i64,
    tx_signature: Option<String>,
    won_at: DateTime<Utc>,
    winner_wallet: String,
    username: Option<String>,
    display_name: Option<String>,
    avatar_url: Option<String>,
}

/// Winners, newest first, optionally only one Piñata owner's.
async fn winners(state: &AppState, owner_wallet: Option<String>, limit: i64) -> ApiResult<Vec<WinnerView>> {
    let rows = sqlx::query_as::<_, WinnerRow>(
        "SELECT w.kind, w.round, w.prize_lamports, w.tx_signature, w.won_at, w.winner_wallet,
                u.username, u.display_name, u.avatar_url
         FROM pinata_winners w LEFT JOIN users u ON u.wallet = w.winner_wallet
         WHERE ($1::text IS NULL OR w.owner_wallet = $1)
         ORDER BY w.won_at DESC LIMIT $2",
    )
    .bind(owner_wallet)
    .bind(limit)
    .fetch_all(&state.db)
    .await?;
    Ok(rows
        .into_iter()
        .map(|row| WinnerView {
            kind: row.kind,
            round: row.round,
            prize_lamports: row.prize_lamports,
            tx_signature: row.tx_signature,
            won_at: row.won_at,
            winner: Author::new(row.winner_wallet, row.username, row.display_name, row.avatar_url),
        })
        .collect())
}

#[derive(Serialize)]
pub struct PinataPage {
    /// The open (or drawing) round, if any
    pub active: Option<PinataView>,
    /// Latest winners of this Piñata
    pub winners: Vec<WinnerView>,
}

pub async fn creator(State(state): State<AppState>, Path(username): Path<String>) -> ApiResult<Json<PinataPage>> {
    let user = users::find_by_username(&state, &username).await?;
    let creator = crate::auth::parse_wallet(&user.wallet)?;
    Ok(Json(PinataPage {
        active: state.chain.creator_pinata(&creator).await?,
        winners: winners(&state, Some(user.wallet), 5).await?,
    }))
}

pub async fn platform(State(state): State<AppState>) -> ApiResult<Json<PinataPage>> {
    Ok(Json(PinataPage {
        active: state.chain.platform_pinata().await?,
        winners: winners(&state, Some(pda::config().to_string()), 5).await?,
    }))
}

#[derive(Deserialize)]
pub struct RecentQuery {
    pub limit: Option<i64>,
}

/// Latest winners across every Piñata, for the home page.
pub async fn recent_winners(
    State(state): State<AppState>,
    Query(query): Query<RecentQuery>,
) -> ApiResult<Json<Vec<WinnerView>>> {
    Ok(Json(winners(&state, None, query.limit.unwrap_or(10).clamp(1, 50)).await?))
}
