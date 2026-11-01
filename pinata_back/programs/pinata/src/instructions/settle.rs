use anchor_lang::prelude::*;

use crate::{constants::*, error::PinataError, events::PinataSettled, state::*};

/// Pays a drawn Piñata and closes it. Anyone can call it; the winner wallets go
/// in `remaining_accounts`, in the order they were drawn.
///
/// - Winners split the prize equally (rounding dust goes to the first one).
/// - No winners: half to the platform, half to the open platform Piñata.
/// - Ticket deposits go back to the platform, the base rent to whoever paid it.
/// - A creator can open a new Piñata afterwards.
#[derive(Accounts)]
pub struct Settle<'info> {
    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        seeds = [PINATA_SEED, pinata.owner.as_ref(), &pinata.round.to_le_bytes()],
        bump = pinata.bump,
        close = rent_payer
    )]
    pub pinata: Account<'info, Pinata>,

    /// CHECK: receives the base rent back; must be who paid it
    #[account(mut, dup, address = pinata.rent_payer @ PinataError::InvalidConfig)]
    pub rent_payer: UncheckedAccount<'info>,

    /// CHECK: platform revenue wallet from the Config
    #[account(mut, dup, address = config.params.platform_wallet @ PinataError::InvalidConfig)]
    pub platform_wallet: UncheckedAccount<'info>,

    /// The platform Piñata currently open (receives half when nobody was eligible)
    #[account(
        mut,
        seeds = [PINATA_SEED, config.key().as_ref(), &config.platform_round.to_le_bytes()],
        bump = platform_pinata.bump
    )]
    pub platform_pinata: Account<'info, Pinata>,

    /// Required for creator Piñatas: frees the creator to open the next one
    #[account(
        mut,
        seeds = [CREATOR_SEED, pinata.owner.as_ref()],
        bump = creator_profile.bump
    )]
    pub creator_profile: Option<Account<'info, CreatorProfile>>,
}

pub fn handler<'info>(ctx: Context<'info, Settle<'info>>) -> Result<()> {
    let pinata = &ctx.accounts.pinata;
    require!(pinata.status == PinataStatus::Drawn, PinataError::PinataNotDrawn);

    let pinata_info = pinata.to_account_info();
    let platform_wallet = ctx.accounts.platform_wallet.to_account_info();
    let prize = pinata.prize_lamports;
    let winners = pinata.winners().to_vec();

    let lamports_per_winner = if winners.is_empty() {
        let half = prize / 2;
        pinata_info.sub_lamports(prize)?;
        platform_wallet.add_lamports(half)?;
        ctx.accounts.platform_pinata.add_lamports(prize - half)?;
        0
    } else {
        require!(
            ctx.remaining_accounts.len() == winners.len(),
            PinataError::WinnerMismatch
        );
        let share = prize / winners.len() as u64;
        let dust = prize - share * winners.len() as u64;
        for (i, (account, winner)) in ctx.remaining_accounts.iter().zip(&winners).enumerate() {
            require!(
                account.key == winner && account.is_writable,
                PinataError::WinnerMismatch
            );
            let amount = if i == 0 { share + dust } else { share };
            pinata_info.sub_lamports(amount)?;
            account.add_lamports(amount)?;
        }
        share
    };

    // What is left above the base rent is the ticket deposits (plus anything
    // sent to the account directly): it goes to the platform, which funded them.
    let base_rent = Rent::get()?.minimum_balance(Pinata::space(0));
    let deposits = pinata_info.lamports().saturating_sub(base_rent);
    pinata_info.sub_lamports(deposits)?;
    platform_wallet.add_lamports(deposits)?;

    if pinata.kind == PinataKind::Creator {
        let profile = ctx
            .accounts
            .creator_profile
            .as_mut()
            .ok_or(PinataError::MissingCreatorProfile)?;
        profile.has_active_pinata = false;
    }

    emit!(PinataSettled {
        pinata: ctx.accounts.pinata.key(),
        kind: ctx.accounts.pinata.kind,
        owner: ctx.accounts.pinata.owner,
        round: ctx.accounts.pinata.round,
        prize_lamports: prize,
        winners,
        lamports_per_winner,
    });
    // `close = rent_payer` returns the remaining base rent when the instruction ends.
    Ok(())
}
