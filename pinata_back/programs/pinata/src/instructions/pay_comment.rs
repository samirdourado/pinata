use anchor_lang::{prelude::*, system_program};

use crate::{constants::*, error::PinataError, events::CommentPaid, state::*};

/// A commenter pays for a comment. The payment is split between the post
/// author, the author's Piñata, the platform Piñata and the platform, and the
/// commenter gets a ticket in each Piñata (none in their own Piñata).
#[derive(Accounts)]
pub struct PayComment<'info> {
    #[account(mut)]
    pub commenter: Signer<'info>,

    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,

    /// CHECK: the post author's wallet, checked against the Piñata owner.
    /// `dup`: it is the same account as `commenter` when creators comment on their own post.
    #[account(mut, dup, address = creator_pinata.owner @ PinataError::CreatorMismatch)]
    pub creator: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [PINATA_SEED, creator_pinata.owner.as_ref(), &creator_pinata.round.to_le_bytes()],
        bump = creator_pinata.bump,
        constraint = creator_pinata.kind == PinataKind::Creator @ PinataError::WrongPinataKind
    )]
    pub creator_pinata: Account<'info, Pinata>,

    #[account(
        mut,
        seeds = [PINATA_SEED, config.key().as_ref(), &config.platform_round.to_le_bytes()],
        bump = platform_pinata.bump
    )]
    pub platform_pinata: Account<'info, Pinata>,

    /// CHECK: platform revenue wallet from the Config
    #[account(mut, dup, address = config.params.platform_wallet @ PinataError::InvalidConfig)]
    pub platform_wallet: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<PayComment>, comment_id: [u8; 16], amount_lamports: u64) -> Result<()> {
    let params = &ctx.accounts.config.params;
    require!(
        amount_lamports >= params.min_comment_lamports,
        PinataError::CommentBelowMinimum
    );
    // A creator without an open Piñata cannot receive comments.
    require!(
        ctx.accounts.creator_pinata.status == PinataStatus::Open,
        PinataError::PinataNotOpen
    );
    require!(
        ctx.accounts.platform_pinata.status == PinataStatus::Open,
        PinataError::PinataNotOpen
    );

    let commenter = ctx.accounts.commenter.key();
    // The owner never competes in their own Piñata.
    let creator_ticket = commenter != ctx.accounts.creator_pinata.owner;

    let split = params.split;
    let creator_share = bps_of(amount_lamports, split.creator_bps)?;
    let creator_pinata_share = bps_of(amount_lamports, split.creator_pinata_bps)?;
    let pool_share = bps_of(amount_lamports, split.platform_pool_bps)?;
    // The platform takes the remainder, so rounding never loses lamports.
    let platform_share = amount_lamports - creator_share - creator_pinata_share - pool_share;

    // Storing a ticket needs a rent deposit; it comes out of the platform share
    // and goes back to the platform when the Piñata is settled.
    let rent = Rent::get()?;
    let creator_deposit = if creator_ticket { ticket_deposit(&rent, 1) } else { 0 };
    let platform_deposit = ticket_deposit(&rent, 1);
    let platform_net = platform_share
        .checked_sub(creator_deposit + platform_deposit)
        .ok_or(PinataError::MinimumCommentTooLow)?;

    let accounts = &ctx.accounts;
    let from = accounts.commenter.to_account_info();
    let system = &accounts.system_program;
    transfer(system, &from, &accounts.creator.to_account_info(), creator_share)?;
    transfer(
        system,
        &from,
        &accounts.creator_pinata.to_account_info(),
        creator_pinata_share + creator_deposit,
    )?;
    transfer(
        system,
        &from,
        &accounts.platform_pinata.to_account_info(),
        pool_share + platform_deposit,
    )?;
    transfer(system, &from, &accounts.platform_wallet.to_account_info(), platform_net)?;

    let creator_pinata = &mut ctx.accounts.creator_pinata;
    if creator_ticket {
        append_ticket(&creator_pinata.to_account_info(), creator_pinata.ticket_count, &commenter)?;
        creator_pinata.ticket_count += 1;
    }
    let platform_pinata = &mut ctx.accounts.platform_pinata;
    append_ticket(&platform_pinata.to_account_info(), platform_pinata.ticket_count, &commenter)?;
    platform_pinata.ticket_count += 1;

    emit!(CommentPaid {
        comment_id,
        commenter,
        creator: ctx.accounts.creator.key(),
        amount_lamports,
        creator_pinata: ctx.accounts.creator_pinata.key(),
        platform_pinata: ctx.accounts.platform_pinata.key(),
        creator_ticket,
    });
    Ok(())
}

/// System Program transfer from the signer. Skips zero amounts and self-transfers
/// (a creator commenting on their own post keeps the creator share).
fn transfer<'info>(
    system_program: &Program<'info, System>,
    from: &AccountInfo<'info>,
    to: &AccountInfo<'info>,
    lamports: u64,
) -> Result<()> {
    if lamports == 0 || from.key == to.key {
        return Ok(());
    }
    system_program::transfer(
        CpiContext::new(
            system_program.key(),
            system_program::Transfer {
                from: from.clone(),
                to: to.clone(),
            },
        ),
        lamports,
    )
}
