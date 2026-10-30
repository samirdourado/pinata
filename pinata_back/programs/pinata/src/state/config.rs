use anchor_lang::prelude::*;

use crate::{constants::*, error::PinataError};

/// How each paid comment is split, in basis points. Must add up to 10_000.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq, InitSpace)]
pub struct FeeSplit {
    /// Paid straight to the post author's wallet
    pub creator_bps: u16,
    /// Goes into the post author's Piñata
    pub creator_pinata_bps: u16,
    /// Goes into the platform Piñata (pool)
    pub platform_pool_bps: u16,
    /// Platform revenue (also funds the ticket storage deposit)
    pub platform_bps: u16,
}

/// Every value the admin can change. Changes apply to Piñatas opened afterwards;
/// an open Piñata keeps the target and minimum it was created with.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, Eq, InitSpace)]
pub struct ConfigParams {
    pub platform_wallet: Pubkey,
    pub split: FeeSplit,
    pub min_comment_lamports: u64,
    /// Range the creator can pick the target from
    pub creator_target_min_lamports: u64,
    pub creator_target_max_lamports: u64,
    /// Range the creator can pick the early-burst minimum from (basis points of the target)
    pub creator_threshold_min_bps: u16,
    pub creator_threshold_max_bps: u16,
    pub platform_target_lamports: u64,
    /// Minimum the platform Piñata needs on the 1st of the month (basis points of the target)
    pub platform_threshold_bps: u16,
    /// Distinct winners per platform draw
    pub platform_winners: u8,
    /// Offset from UTC used to find "the 1st of the month" (Brasília: -10800)
    pub timezone_offset_seconds: i32,
}

impl ConfigParams {
    pub fn validate(&self, rent: &Rent) -> Result<()> {
        let s = self.split;
        let total = s.creator_bps as u64
            + s.creator_pinata_bps as u64
            + s.platform_pool_bps as u64
            + s.platform_bps as u64;
        require!(total == BPS_DENOMINATOR, PinataError::InvalidFeeSplit);

        require!(self.min_comment_lamports > 0, PinataError::InvalidConfig);
        require!(
            self.creator_target_min_lamports > 0
                && self.creator_target_min_lamports <= self.creator_target_max_lamports,
            PinataError::InvalidConfig
        );
        require!(
            is_valid_bps(self.creator_threshold_min_bps)
                && is_valid_bps(self.creator_threshold_max_bps)
                && self.creator_threshold_min_bps <= self.creator_threshold_max_bps,
            PinataError::InvalidConfig
        );
        require!(self.platform_target_lamports > 0, PinataError::InvalidConfig);
        require!(is_valid_bps(self.platform_threshold_bps), PinataError::InvalidConfig);
        require!(
            self.platform_winners >= 1 && self.platform_winners as usize <= MAX_WINNERS,
            PinataError::InvalidConfig
        );
        require!(
            self.timezone_offset_seconds.unsigned_abs() <= 14 * 3600,
            PinataError::InvalidConfig
        );

        // A comment can add up to two tickets (creator and platform Piñata). Their
        // storage deposit comes out of the platform share, so the smallest comment
        // must cover it.
        let platform_share = bps_of(self.min_comment_lamports, s.platform_bps)?;
        require!(
            platform_share >= ticket_deposit(rent, 2),
            PinataError::MinimumCommentTooLow
        );
        Ok(())
    }
}

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub admin: Pubkey,
    pub params: ConfigParams,
    /// Round of the platform Piñata currently accepting comments
    pub platform_round: u64,
    pub bump: u8,
}

fn is_valid_bps(value: u16) -> bool {
    value > 0 && value as u64 <= BPS_DENOMINATOR
}

/// `amount * bps / 10_000`, rounded down.
pub fn bps_of(amount: u64, bps: u16) -> Result<u64> {
    let value = (amount as u128)
        .checked_mul(bps as u128)
        .ok_or(PinataError::MathOverflow)?
        / BPS_DENOMINATOR as u128;
    u64::try_from(value).map_err(|_| error!(PinataError::MathOverflow))
}

/// Rent deposit needed to store `tickets` more tickets in an account.
pub fn ticket_deposit(rent: &Rent, tickets: usize) -> u64 {
    rent.minimum_balance(tickets * TICKET_SIZE) - rent.minimum_balance(0)
}
