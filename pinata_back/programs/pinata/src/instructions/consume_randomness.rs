use anchor_lang::prelude::*;
use ephemeral_vrf_sdk::consts::scoped_vrf_identity;

use crate::{draw::pick_winners, error::PinataError, events::WinnersDrawn, state::*};

/// Called back by the MagicBlock VRF program with verified randomness.
/// Only the VRF program can sign as `vrf_program_identity`, so nobody else
/// can choose the winners.
#[derive(Accounts)]
pub struct ConsumeRandomness<'info> {
    #[account(address = scoped_vrf_identity(&crate::ID) @ PinataError::InvalidVrfAccount)]
    pub vrf_program_identity: Signer<'info>,

    #[account(mut)]
    pub pinata: Account<'info, Pinata>,
}

pub fn handler(ctx: Context<ConsumeRandomness>, randomness: [u8; 32]) -> Result<()> {
    let pinata = &mut ctx.accounts.pinata;
    require!(pinata.status == PinataStatus::Drawing, PinataError::PinataNotOpen);

    let winners = {
        let info = pinata.to_account_info();
        let data = info.try_borrow_data()?;
        pick_winners(
            tickets(&data, pinata.ticket_count)?,
            pinata.max_winners as usize,
            &randomness,
        )
    };

    for (slot, winner) in pinata.winners.iter_mut().zip(&winners) {
        *slot = *winner;
    }
    pinata.winner_count = winners.len() as u8;
    pinata.status = PinataStatus::Drawn;

    emit!(WinnersDrawn {
        pinata: pinata.key(),
        randomness,
        winners,
    });
    Ok(())
}
