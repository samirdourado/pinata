//! Pinata on-chain program: paid comments split between the post author, the
//! author's Piñata, the platform Piñata and the platform; Piñatas burst through
//! verifiable random draws (MagicBlock VRF). See pinata_back/docs/DESIGN.md.

pub mod calendar;
pub mod constants;
pub mod draw;
pub mod error;
pub mod events;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("CThrD6V4TBegostJqwo9PvGVRZnEUkDba5mNDxv5toN8");

#[program]
pub mod pinata {
    use super::*;

    /// Admin: create the Config and open the first platform Piñata.
    pub fn initialize(ctx: Context<Initialize>, params: ConfigParams) -> Result<()> {
        initialize::handler(ctx, params)
    }

    /// Admin: change the Config (applies to Piñatas opened afterwards).
    pub fn update_config(ctx: Context<UpdateConfig>, params: ConfigParams) -> Result<()> {
        update_config::handler(ctx, params)
    }

    /// Creator: open their Piñata for `round` (their previous round + 1).
    pub fn open_creator_pinata(
        ctx: Context<OpenCreatorPinata>,
        round: u64,
        target_lamports: u64,
        threshold_bps: u16,
    ) -> Result<()> {
        open_creator_pinata::handler(ctx, round, target_lamports, threshold_bps)
    }

    /// Commenter: pay for a comment.
    pub fn pay_comment(
        ctx: Context<PayComment>,
        comment_id: [u8; 16],
        amount_lamports: u64,
    ) -> Result<()> {
        pay_comment::handler(ctx, comment_id, amount_lamports)
    }

    /// Burst a creator Piñata (anyone at 100%, the owner from their minimum).
    pub fn request_creator_draw(ctx: Context<RequestCreatorDraw>) -> Result<()> {
        request_creator_draw::handler(ctx)
    }

    /// Burst the platform Piñata (100%, or the minimum on the 1st of the month).
    pub fn request_platform_draw(ctx: Context<RequestPlatformDraw>) -> Result<()> {
        request_platform_draw::handler(ctx)
    }

    /// VRF oracle only: receive the randomness and pick the winners.
    pub fn consume_randomness(ctx: Context<ConsumeRandomness>, randomness: [u8; 32]) -> Result<()> {
        consume_randomness::handler(ctx, randomness)
    }

    /// Pay the winners and close the Piñata. Winner wallets go in remaining accounts.
    pub fn settle<'info>(ctx: Context<'info, Settle<'info>>) -> Result<()> {
        settle::handler(ctx)
    }
}
