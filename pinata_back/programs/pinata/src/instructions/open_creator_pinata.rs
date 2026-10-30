use anchor_lang::prelude::*;

use crate::{constants::*, error::PinataError, events::PinataOpened, state::*};

/// The creator opens their Piñata, choosing the target and the early-burst
/// minimum within the Config ranges. It cannot be changed afterwards, and a new
/// one can only be opened after the previous one is settled.
#[derive(Accounts)]
#[instruction(round: u64)]
pub struct OpenCreatorPinata<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,

    #[account(
        init_if_needed,
        payer = creator,
        space = 8 + CreatorProfile::INIT_SPACE,
        seeds = [CREATOR_SEED, creator.key().as_ref()],
        bump
    )]
    pub creator_profile: Account<'info, CreatorProfile>,

    #[account(
        init,
        payer = creator,
        space = Pinata::space(0),
        seeds = [PINATA_SEED, creator.key().as_ref(), &round.to_le_bytes()],
        bump
    )]
    pub pinata: Account<'info, Pinata>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<OpenCreatorPinata>,
    round: u64,
    target_lamports: u64,
    threshold_bps: u16,
) -> Result<()> {
    let params = &ctx.accounts.config.params;
    let profile = &mut ctx.accounts.creator_profile;

    require!(!profile.has_active_pinata, PinataError::CreatorPinataAlreadyActive);
    require!(round == profile.round + 1, PinataError::InvalidRound);
    require!(
        (params.creator_target_min_lamports..=params.creator_target_max_lamports)
            .contains(&target_lamports),
        PinataError::TargetOutOfRange
    );
    require!(
        (params.creator_threshold_min_bps..=params.creator_threshold_max_bps)
            .contains(&threshold_bps),
        PinataError::ThresholdOutOfRange
    );

    let creator = ctx.accounts.creator.key();
    profile.creator = creator;
    profile.round = round;
    profile.has_active_pinata = true;
    profile.bump = ctx.bumps.creator_profile;

    ctx.accounts.pinata.set_inner(Pinata {
        kind: PinataKind::Creator,
        owner: creator,
        round,
        target_lamports,
        threshold_bps,
        max_winners: CREATOR_PINATA_WINNERS,
        status: PinataStatus::Open,
        rent_payer: creator,
        opened_at: Clock::get()?.unix_timestamp,
        draw_requested_at: 0,
        prize_lamports: 0,
        ticket_count: 0,
        winner_count: 0,
        winners: [Pubkey::default(); MAX_WINNERS],
        bump: ctx.bumps.pinata,
    });

    emit!(PinataOpened {
        pinata: ctx.accounts.pinata.key(),
        kind: PinataKind::Creator,
        owner: creator,
        round,
        target_lamports,
        threshold_bps,
    });
    Ok(())
}
