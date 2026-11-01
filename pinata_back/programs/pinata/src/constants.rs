use anchor_lang::prelude::*;

/// PDA seeds. A PDA (Program Derived Address) is an address owned by this
/// program and derived from these seeds: it has no private key, so only the
/// program can move the SOL it holds.
#[constant]
pub const CONFIG_SEED: &[u8] = b"config";
#[constant]
pub const CREATOR_SEED: &[u8] = b"creator";
#[constant]
pub const PINATA_SEED: &[u8] = b"pinata";
/// Seed of this program's identity PDA, which signs randomness requests.
pub const IDENTITY_SEED: &[u8] = b"identity";

/// Percentages are stored in basis points: 10_000 = 100%, 100 = 1%.
pub const BPS_DENOMINATOR: u64 = 10_000;

/// Each ticket stores the commenter's wallet (32 bytes) after the Pinata header.
pub const TICKET_SIZE: usize = 32;

/// Upper bound for winners per draw (fixed-size array in the Pinata account).
pub const MAX_WINNERS: usize = 5;
/// A creator Piñata always has a single winner.
pub const CREATOR_PINATA_WINNERS: u8 = 1;

/// Random picks per winner before falling back to a linear scan (see draw.rs).
pub const DRAW_ATTEMPTS_PER_WINNER: u32 = 32;

pub const SECONDS_PER_DAY: i64 = 86_400;
