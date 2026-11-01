//! Events are written to the transaction logs. The API reads them to confirm
//! payments and mirror the on-chain state in PostgreSQL.

use anchor_lang::prelude::*;

use crate::state::PinataKind;

#[event]
pub struct PinataOpened {
    pub pinata: Pubkey,
    pub kind: PinataKind,
    pub owner: Pubkey,
    pub round: u64,
    pub target_lamports: u64,
    pub threshold_bps: u16,
}

#[event]
pub struct CommentPaid {
    /// Comment id created by the API (UUID bytes); links the payment to the comment row
    pub comment_id: [u8; 16],
    pub commenter: Pubkey,
    pub creator: Pubkey,
    pub amount_lamports: u64,
    pub creator_pinata: Pubkey,
    pub platform_pinata: Pubkey,
    /// False when the creator comments on their own post
    pub creator_ticket: bool,
}

#[event]
pub struct DrawRequested {
    pub pinata: Pubkey,
    pub kind: PinataKind,
    pub round: u64,
    pub prize_lamports: u64,
    pub ticket_count: u32,
}

#[event]
pub struct WinnersDrawn {
    pub pinata: Pubkey,
    pub randomness: [u8; 32],
    pub winners: Vec<Pubkey>,
}

#[event]
pub struct PinataSettled {
    pub pinata: Pubkey,
    pub kind: PinataKind,
    pub owner: Pubkey,
    pub round: u64,
    pub prize_lamports: u64,
    pub winners: Vec<Pubkey>,
    /// 0 when nobody was eligible (prize split between platform and pool)
    pub lamports_per_winner: u64,
}
