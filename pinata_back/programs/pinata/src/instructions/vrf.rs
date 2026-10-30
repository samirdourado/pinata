//! Shared pieces of a draw request: the MagicBlock VRF accounts and the request
//! itself. The VRF program later calls `consume_randomness` with 32 random bytes
//! and a proof it has already verified on-chain.

use anchor_lang::{prelude::*, solana_program::program::invoke_signed};
use ephemeral_vrf_sdk::{
    compat::slot_hashes,
    consts as vrf_consts,
    instructions::{create_request_randomness_ix, RequestRandomnessParams},
    types::SerializableAccountMeta,
};

use crate::{constants::*, error::PinataError, events::DrawRequested, state::*};

#[derive(Accounts)]
pub struct VrfAccounts<'info> {
    /// CHECK: MagicBlock oracle queue that receives the request
    #[account(mut, address = vrf_consts::DEFAULT_QUEUE @ PinataError::InvalidVrfAccount)]
    pub oracle_queue: UncheckedAccount<'info>,

    /// CHECK: this program's identity PDA; it signs the request so the VRF
    /// program knows which program asked and must be called back
    #[account(seeds = [IDENTITY_SEED], bump)]
    pub program_identity: UncheckedAccount<'info>,

    /// CHECK: MagicBlock VRF program
    #[account(address = vrf_consts::VRF_PROGRAM_ID @ PinataError::InvalidVrfAccount)]
    pub vrf_program: UncheckedAccount<'info>,

    /// CHECK: SlotHashes sysvar, read by the VRF program
    #[account(address = slot_hashes::ID @ PinataError::InvalidVrfAccount)]
    pub slot_hashes: UncheckedAccount<'info>,
}

impl<'info> VrfAccounts<'info> {
    /// Asks the oracle for randomness; the answer arrives in `consume_randomness`
    /// with `pinata` as its only account.
    pub fn request_randomness(
        &self,
        payer: &Signer<'info>,
        system_program: &Program<'info, System>,
        identity_bump: u8,
        pinata: Pubkey,
    ) -> Result<()> {
        let ix = create_request_randomness_ix(RequestRandomnessParams {
            payer: payer.key(),
            oracle_queue: self.oracle_queue.key(),
            callback_program_id: crate::ID,
            callback_discriminator: crate::instruction::ConsumeRandomness::DISCRIMINATOR.to_vec(),
            // Unique per Piñata round, so two requests never share a seed
            caller_seed: pinata.to_bytes(),
            accounts_metas: Some(vec![SerializableAccountMeta {
                pubkey: pinata,
                is_signer: false,
                is_writable: true,
            }]),
            ..Default::default()
        });
        invoke_signed(
            &ix,
            &[
                payer.to_account_info(),
                self.program_identity.to_account_info(),
                self.oracle_queue.to_account_info(),
                system_program.to_account_info(),
                self.slot_hashes.to_account_info(),
                self.vrf_program.to_account_info(),
            ],
            &[&[IDENTITY_SEED, &[identity_bump]]],
        )?;
        Ok(())
    }
}

/// Freezes the prize and moves the Piñata out of `Open`.
/// Returns true when there are tickets and randomness must be requested;
/// with no tickets it goes straight to `Drawn` with no winners.
pub fn freeze_for_draw(pinata: &mut Account<Pinata>, prize_lamports: u64) -> Result<bool> {
    pinata.prize_lamports = prize_lamports;
    pinata.draw_requested_at = Clock::get()?.unix_timestamp;
    let needs_randomness = pinata.ticket_count > 0;
    pinata.status = if needs_randomness {
        PinataStatus::Drawing
    } else {
        PinataStatus::Drawn
    };

    emit!(DrawRequested {
        pinata: pinata.key(),
        kind: pinata.kind,
        round: pinata.round,
        prize_lamports,
        ticket_count: pinata.ticket_count,
    });
    Ok(needs_randomness)
}
