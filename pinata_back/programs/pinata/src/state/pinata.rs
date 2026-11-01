use anchor_lang::prelude::*;

use crate::{constants::*, error::PinataError, state::bps_of};

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq, InitSpace)]
pub enum PinataKind {
    Creator,
    Platform,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq, InitSpace)]
pub enum PinataStatus {
    /// Accepting comments
    Open,
    /// Prize frozen, waiting for the VRF oracle
    Drawing,
    /// Winners chosen, waiting for `settle` to pay them
    Drawn,
}

/// A prize pool round. The account itself holds the prize, so its balance is
/// always `rent(account size) + prize`.
///
/// Layout: 8-byte discriminator, this header, then `ticket_count` tickets of
/// 32 bytes each (the commenter's wallet), appended by `pay_comment`.
#[account]
#[derive(InitSpace)]
pub struct Pinata {
    pub kind: PinataKind,
    /// Creator wallet, or the Config address for the platform Piñata
    pub owner: Pubkey,
    pub round: u64,
    pub target_lamports: u64,
    /// Early-burst minimum, in basis points of the target
    pub threshold_bps: u16,
    pub max_winners: u8,
    pub status: PinataStatus,
    /// Who paid the account's base rent; gets it back on settle
    pub rent_payer: Pubkey,
    pub opened_at: i64,
    pub draw_requested_at: i64,
    /// Prize frozen when the draw is requested
    pub prize_lamports: u64,
    pub ticket_count: u32,
    pub winner_count: u8,
    pub winners: [Pubkey; MAX_WINNERS],
    pub bump: u8,
}

impl Pinata {
    pub const TICKETS_OFFSET: usize = 8 + Pinata::INIT_SPACE;

    /// Account size (discriminator included) holding `tickets` tickets.
    pub const fn space(tickets: usize) -> usize {
        Self::TICKETS_OFFSET + tickets * TICKET_SIZE
    }

    pub fn threshold_lamports(&self) -> Result<u64> {
        bps_of(self.target_lamports, self.threshold_bps)
    }

    pub fn winners(&self) -> &[Pubkey] {
        &self.winners[..self.winner_count as usize]
    }
}

/// Prize currently held: everything above the rent-exempt minimum.
pub fn current_prize(pinata: &AccountInfo) -> Result<u64> {
    let rent = Rent::get()?.minimum_balance(pinata.data_len());
    Ok(pinata.lamports().saturating_sub(rent))
}

/// Grows the account by one ticket and stores `wallet` in it.
/// The caller must have already sent the extra rent to the account.
pub fn append_ticket(pinata: &AccountInfo, index: u32, wallet: &Pubkey) -> Result<()> {
    let offset = Pinata::space(index as usize);
    pinata.resize(offset + TICKET_SIZE)?;
    let mut data = pinata.try_borrow_mut_data()?;
    data[offset..offset + TICKET_SIZE].copy_from_slice(wallet.as_ref());
    Ok(())
}

/// The ticket area of a Pinata account's data.
pub fn tickets(data: &[u8], ticket_count: u32) -> Result<&[u8]> {
    let end = Pinata::space(ticket_count as usize);
    data.get(Pinata::TICKETS_OFFSET..end)
        .ok_or_else(|| error!(PinataError::MathOverflow))
}
