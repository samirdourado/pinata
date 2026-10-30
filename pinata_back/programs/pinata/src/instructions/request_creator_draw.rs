use anchor_lang::prelude::*;

use crate::{constants::*, error::PinataError, instructions::vrf::*, state::*};

/// Bursts a creator Piñata:
/// - at 100% of the target, anyone can call it (the backend automation does);
/// - from the creator's chosen minimum, only the owner (signing with their wallet).
#[derive(Accounts)]
pub struct RequestCreatorDraw<'info> {
    #[account(mut)]
    pub caller: Signer<'info>,

    #[account(
        mut,
        seeds = [PINATA_SEED, pinata.owner.as_ref(), &pinata.round.to_le_bytes()],
        bump = pinata.bump,
        constraint = pinata.kind == PinataKind::Creator @ PinataError::WrongPinataKind
    )]
    pub pinata: Account<'info, Pinata>,

    pub vrf: VrfAccounts<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<RequestCreatorDraw>) -> Result<()> {
    let pinata = &ctx.accounts.pinata;
    require!(pinata.status == PinataStatus::Open, PinataError::PinataNotOpen);

    let prize = current_prize(&pinata.to_account_info())?;
    if prize < pinata.target_lamports {
        require!(
            prize >= pinata.threshold_lamports()?,
            PinataError::BurstThresholdNotReached
        );
        require_keys_eq!(
            ctx.accounts.caller.key(),
            pinata.owner,
            PinataError::OnlyOwnerCanBurstEarly
        );
    }

    let pinata = &mut ctx.accounts.pinata;
    if freeze_for_draw(pinata, prize)? {
        ctx.accounts.vrf.request_randomness(
            &ctx.accounts.caller,
            &ctx.accounts.system_program,
            ctx.bumps.vrf.program_identity,
            ctx.accounts.pinata.key(),
        )?;
    }
    Ok(())
}
