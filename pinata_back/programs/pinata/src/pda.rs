//! Program account addresses (PDAs), for clients: the CLI, the API and the tests.

use anchor_lang::prelude::Pubkey;

use crate::{CONFIG_SEED, CREATOR_SEED, IDENTITY_SEED, PINATA_SEED};

pub fn config() -> Pubkey {
    Pubkey::find_program_address(&[CONFIG_SEED], &crate::ID).0
}

pub fn creator_profile(creator: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(&[CREATOR_SEED, creator.as_ref()], &crate::ID).0
}

/// A Piñata round: `owner` is the creator wallet, or the Config for the platform Piñata.
pub fn pinata(owner: &Pubkey, round: u64) -> Pubkey {
    Pubkey::find_program_address(&[PINATA_SEED, owner.as_ref(), &round.to_le_bytes()], &crate::ID).0
}

pub fn platform_pinata(round: u64) -> Pubkey {
    pinata(&config(), round)
}

/// Signs the VRF requests on behalf of the program.
pub fn program_identity() -> Pubkey {
    Pubkey::find_program_address(&[IDENTITY_SEED], &crate::ID).0
}
