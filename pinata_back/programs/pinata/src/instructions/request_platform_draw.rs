use anchor_lang::prelude::*;

use crate::{
    calendar::is_first_day_of_month,
    constants::*,
    error::PinataError,
    instructions::{initialize::open_platform_pinata, vrf::*},
    state::*,
};

/// Bursts the platform Piñata. Anyone can call it (the backend automation does);
/// the rules are checked here:
/// - at 100% of the target, on any day;
/// - on the 1st of the month (Config timezone), from the Config minimum.
/// The next platform round opens in the same transaction, so comments never stop.
#[derive(Accounts)]
pub struct RequestPlatformDraw<'info> {
    #[account(mut)]
    pub caller: Signer<'info>,

    #[account(mut, seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        seeds = [PINATA_SEED, config.key().as_ref(), &config.platform_round.to_le_bytes()],
        bump = pinata.bump
    )]
    pub pinata: Account<'info, Pinata>,

    #[account(
        init,
        payer = caller,
        space = Pinata::space(0),
        seeds = [PINATA_SEED, config.key().as_ref(), &(config.platform_round + 1).to_le_bytes()],
        bump
    )]
    pub next_pinata: Account<'info, Pinata>,

    pub vrf: VrfAccounts<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<RequestPlatformDraw>) -> Result<()> {
    let pinata = &ctx.accounts.pinata;
    require!(pinata.status == PinataStatus::Open, PinataError::PinataNotOpen);

    let prize = current_prize(&pinata.to_account_info())?;
    if prize < pinata.target_lamports {
        let now = Clock::get()?.unix_timestamp;
        let offset = ctx.accounts.config.params.timezone_offset_seconds;
        require!(
            is_first_day_of_month(now, offset) && prize >= pinata.threshold_lamports()?,
            PinataError::BurstThresholdNotReached
        );
    }

    let pinata = &mut ctx.accounts.pinata;
    let needs_randomness = freeze_for_draw(pinata, prize)?;

    let config = &mut ctx.accounts.config;
    config.platform_round += 1;
    open_platform_pinata(
        &mut ctx.accounts.next_pinata,
        config,
        config.key(),
        ctx.accounts.caller.key(),
        ctx.bumps.next_pinata,
    )?;

    if needs_randomness {
        ctx.accounts.vrf.request_randomness(
            &ctx.accounts.caller,
            &ctx.accounts.system_program,
            ctx.bumps.vrf.program_identity,
            ctx.accounts.pinata.key(),
        )?;
    }
    Ok(())
}
