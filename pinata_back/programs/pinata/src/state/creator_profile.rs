use anchor_lang::prelude::*;

/// One per creator wallet. Guarantees a creator has at most one open Piñata.
#[account]
#[derive(InitSpace)]
pub struct CreatorProfile {
    pub creator: Pubkey,
    /// Round of the latest Piñata the creator opened (0 = never opened one)
    pub round: u64,
    /// True from opening a Piñata until its prize is settled
    pub has_active_pinata: bool,
    pub bump: u8,
}
