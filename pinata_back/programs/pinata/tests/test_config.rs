mod common;

use anchor_lang::{prelude::Pubkey, solana_program::instruction::Instruction, InstructionData, ToAccountMetas};
use common::*;
use pinata::{accounts, instruction, PinataKind, PinataStatus};
use solana_signer::Signer;

#[test]
fn initialize_creates_config_and_first_platform_round() {
    let env = TestEnv::new();

    let config = env.config();
    assert_eq!(config.admin, env.admin.pubkey());
    assert_eq!(config.platform_round, 1);
    assert_eq!(config.params, default_params(env.platform_wallet.pubkey()));

    let pool = env.pinata(&platform_pinata_pda(1));
    assert_eq!(pool.kind, PinataKind::Platform);
    assert_eq!(pool.owner, config_pda());
    assert_eq!(pool.status, PinataStatus::Open);
    assert_eq!(pool.target_lamports, SOL / 10);
    assert_eq!(pool.threshold_bps, 6_000);
    assert_eq!(pool.max_winners, 3);
    assert_eq!(pool.ticket_count, 0);
}

#[test]
fn initialize_rejects_split_not_adding_to_100_percent() {
    let mut env = TestEnv::bare();
    let mut params = default_params(env.platform_wallet.pubkey());
    params.split.platform_bps = 999;
    assert_error(env.initialize(params), "InvalidFeeSplit");
}

#[test]
fn initialize_rejects_minimum_that_cannot_cover_ticket_deposits() {
    let mut env = TestEnv::bare();
    let mut params = default_params(env.platform_wallet.pubkey());
    // 10% of 0.001 SOL = 0.0001 SOL, less than two ticket deposits (~0.00045 SOL)
    params.min_comment_lamports = SOL / 1_000;
    assert_error(env.initialize(params), "MinimumCommentTooLow");
}

#[test]
fn initialize_rejects_too_many_winners() {
    let mut env = TestEnv::bare();
    let mut params = default_params(env.platform_wallet.pubkey());
    params.platform_winners = 6;
    assert_error(env.initialize(params), "InvalidConfig");
}

fn update_config_ix(admin: Pubkey, params: pinata::ConfigParams) -> Instruction {
    Instruction::new_with_bytes(
        pinata::ID,
        &instruction::UpdateConfig { params }.data(),
        accounts::UpdateConfig {
            admin,
            config: config_pda(),
        }
        .to_account_metas(None),
    )
}

#[test]
fn only_admin_can_update_config() {
    let mut env = TestEnv::new();
    let mut params = default_params(env.platform_wallet.pubkey());
    params.platform_winners = 5;

    let intruder = env.funded_wallet(1);
    let result = env.send(update_config_ix(intruder.pubkey(), params.clone()), &intruder, &[]);
    assert!(result.is_err());

    let admin = env.admin.insecure_clone();
    assert_ok(env.send(update_config_ix(admin.pubkey(), params), &admin, &[]));
    assert_eq!(env.config().params.platform_winners, 5);
}
