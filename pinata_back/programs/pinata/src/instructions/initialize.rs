use anchor_lang::prelude::*;

use crate::{constants::*, events::PinataOpened, state::*};

/// Creates the Config and opens round 1 of the platform Piñata.
/// Run once, right after deploying the program.
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + Config::INIT_SPACE,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, Config>,

    #[account(
        init,
        payer = admin,
        space = Pinata::space(0),
        seeds = [PINATA_SEED, config.key().as_ref(), &1u64.to_le_bytes()],
        bump
    )]
    pub platform_pinata: Account<'info, Pinata>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Initialize>, params: ConfigParams) -> Result<()> {
    params.validate(&Rent::get()?)?;

    let config_key = ctx.accounts.config.key();
    ctx.accounts.config.set_inner(Config {
        admin: ctx.accounts.admin.key(),
        params,
        platform_round: 1,
        bump: ctx.bumps.config,
    });

    open_platform_pinata(
        &mut ctx.accounts.platform_pinata,
        &ctx.accounts.config,
        config_key,
        ctx.accounts.admin.key(),
        ctx.bumps.platform_pinata,
    )
}

/// Fills a freshly created platform Piñata for `config.platform_round`.
pub fn open_platform_pinata(
    pinata: &mut Account<Pinata>,
    config: &Config,
    config_key: Pubkey,
    rent_payer: Pubkey,
    bump: u8,
) -> Result<()> {
    pinata.set_inner(Pinata {
        kind: PinataKind::Platform,
        owner: config_key,
        round: config.platform_round,
        target_lamports: config.params.platform_target_lamports,
        threshold_bps: config.params.platform_threshold_bps,
        max_winners: config.params.platform_winners,
        status: PinataStatus::Open,
        rent_payer,
        opened_at: Clock::get()?.unix_timestamp,
        draw_requested_at: 0,
        prize_lamports: 0,
        ticket_count: 0,
        winner_count: 0,
        winners: [Pubkey::default(); MAX_WINNERS],
        bump,
    });
    emit!(PinataOpened {
        pinata: pinata.key(),
        kind: PinataKind::Platform,
        owner: config_key,
        round: config.platform_round,
        target_lamports: pinata.target_lamports,
        threshold_bps: pinata.threshold_bps,
    });
    Ok(())
}
