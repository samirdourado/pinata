use anchor_lang::prelude::*;

use crate::{constants::*, state::*};

/// Admin-only. New values apply to Piñatas opened afterwards.
#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    pub admin: Signer<'info>,

    #[account(mut, seeds = [CONFIG_SEED], bump = config.bump, has_one = admin)]
    pub config: Account<'info, Config>,
}

pub fn handler(ctx: Context<UpdateConfig>, params: ConfigParams) -> Result<()> {
    params.validate(&Rent::get()?)?;
    ctx.accounts.config.params = params;
    Ok(())
}
