mod common;

use common::*;
use pinata::{Pinata, PinataStatus};
use solana_keypair::Keypair;
use solana_signer::Signer;

/// Creator with an open 1 SOL Piñata that bursts early from 60%.
fn env_with_creator() -> (TestEnv, Keypair) {
    let mut env = TestEnv::new();
    let creator = env.funded_wallet(10);
    assert_ok(env.open_creator_pinata(&creator, 1, SOL, 6_000));
    (env, creator)
}

#[test]
fn early_burst_needs_the_owner_and_the_minimum() {
    let (mut env, creator) = env_with_creator();
    let pinata = pinata_pda(&creator.pubkey(), 1);
    let fan = env.funded_wallet(10);

    // 1 SOL comment -> 0.35 SOL prize (35%), below the 60% minimum (0.6 SOL)
    assert_ok(env.pay_comment(&fan, &creator.pubkey(), 1, SOL));
    assert_error(env.request_creator_draw(&creator, pinata), "BurstThresholdNotReached");

    // +1 SOL -> 0.7 SOL prize: the owner may burst, anyone else may not
    assert_ok(env.pay_comment(&fan, &creator.pubkey(), 1, SOL));
    assert_error(env.request_creator_draw(&fan, pinata), "OnlyOwnerCanBurstEarly");
    assert_ok(env.request_creator_draw(&creator, pinata));

    let state = env.pinata(&pinata);
    assert_eq!(state.status, PinataStatus::Drawing);
    assert_eq!(state.prize_lamports, 700_000_000);
}

#[test]
fn full_pinata_can_be_burst_by_anyone() {
    let (mut env, creator) = env_with_creator();
    let pinata = pinata_pda(&creator.pubkey(), 1);
    let fan = env.funded_wallet(10);
    let automation = env.funded_wallet(1);

    // 3 SOL of comments -> 1.05 SOL prize, above the 1 SOL target
    assert_ok(env.pay_comment(&fan, &creator.pubkey(), 1, 3 * SOL));
    let queue_before = env.svm.get_account(&ephemeral_vrf_sdk::consts::DEFAULT_QUEUE).unwrap().data;
    assert_ok(env.request_creator_draw(&automation, pinata));
    assert_eq!(env.pinata(&pinata).status, PinataStatus::Drawing);

    // The MagicBlock VRF program stored the request in the oracle queue
    let queue_after = env.svm.get_account(&ephemeral_vrf_sdk::consts::DEFAULT_QUEUE).unwrap().data;
    assert_ne!(queue_before, queue_after);
    let caller_seed = pinata.to_bytes();
    assert!(queue_after.windows(32).any(|w| w == caller_seed));
}

#[test]
fn drawing_pinata_stops_taking_comments_and_cannot_be_drawn_twice() {
    let (mut env, creator) = env_with_creator();
    let pinata = pinata_pda(&creator.pubkey(), 1);
    let fan = env.funded_wallet(10);
    assert_ok(env.pay_comment(&fan, &creator.pubkey(), 1, 3 * SOL));
    assert_ok(env.request_creator_draw(&creator, pinata));

    assert_error(env.pay_comment(&fan, &creator.pubkey(), 1, SOL), "PinataNotOpen");
    assert_error(env.request_creator_draw(&creator, pinata), "PinataNotOpen");
}

#[test]
fn only_the_vrf_program_can_deliver_randomness() {
    let (mut env, creator) = env_with_creator();
    let pinata = pinata_pda(&creator.pubkey(), 1);
    let fan = env.funded_wallet(10);
    assert_ok(env.pay_comment(&fan, &creator.pubkey(), 1, 3 * SOL));
    assert_ok(env.request_creator_draw(&creator, pinata));

    // Someone pretending to be the oracle
    assert_error(
        env.consume_randomness_as(fan.pubkey(), pinata, [1; 32]),
        "InvalidVrfAccount",
    );
    assert_ok(env.fulfill_randomness(pinata, [1; 32]));
    let state = env.pinata(&pinata);
    assert_eq!(state.status, PinataStatus::Drawn);
    assert_eq!(state.winners(), &[fan.pubkey()]);
}

#[test]
fn settle_pays_the_winner_returns_deposits_and_frees_the_creator() {
    let (mut env, creator) = env_with_creator();
    let pinata = pinata_pda(&creator.pubkey(), 1);
    let alice = env.funded_wallet(10);
    let bob = env.funded_wallet(10);
    assert_ok(env.pay_comment(&alice, &creator.pubkey(), 1, SOL));
    assert_ok(env.pay_comment(&bob, &creator.pubkey(), 1, 2 * SOL));
    assert_ok(env.request_creator_draw(&creator, pinata));
    assert_ok(env.fulfill_randomness(pinata, [42; 32]));

    let drawn: Pinata = env.pinata(&pinata);
    let winner = drawn.winners()[0];
    assert!(winner == alice.pubkey() || winner == bob.pubkey());

    let platform = env.platform_wallet.pubkey();
    let deposits = 2 * env.ticket_deposit();
    let base_rent = env.rent(Pinata::space(0));
    let winner_before = env.balance(&winner);
    let creator_before = env.balance(&creator.pubkey());
    let platform_before = env.balance(&platform);

    let automation = env.funded_wallet(1);
    assert_ok(env.settle(&automation, pinata));

    assert_eq!(env.balance(&winner) - winner_before, 1_050_000_000); // 35% of 3 SOL
    assert_eq!(env.balance(&platform) - platform_before, deposits);
    assert_eq!(env.balance(&creator.pubkey()) - creator_before, base_rent);
    assert!(!env.exists(&pinata));
    assert!(!env.profile(&creator.pubkey()).has_active_pinata);

    // The creator can open the next round
    assert_ok(env.open_creator_pinata(&creator, 2, SOL, 6_000));
    assert_ok(env.pay_comment(&alice, &creator.pubkey(), 2, MIN_COMMENT));
}

#[test]
fn settle_requires_the_drawn_winners() {
    let (mut env, creator) = env_with_creator();
    let pinata = pinata_pda(&creator.pubkey(), 1);
    let fan = env.funded_wallet(10);
    assert_ok(env.pay_comment(&fan, &creator.pubkey(), 1, 3 * SOL));
    assert_ok(env.request_creator_draw(&creator, pinata));

    let automation = env.funded_wallet(1);
    assert_error(env.settle(&automation, pinata), "PinataNotDrawn");
}

#[test]
fn pinata_without_eligible_tickets_goes_half_to_platform_half_to_pool() {
    let (mut env, creator) = env_with_creator();
    let pinata = pinata_pda(&creator.pubkey(), 1);
    // Only the owner commented: 2 SOL -> 0.7 SOL prize, no tickets in their own Piñata
    assert_ok(env.pay_comment(&creator, &creator.pubkey(), 1, 2 * SOL));
    assert_ok(env.request_creator_draw(&creator, pinata));
    // No randomness needed: drawn immediately with no winners
    assert_eq!(env.pinata(&pinata).status, PinataStatus::Drawn);

    let platform = env.platform_wallet.pubkey();
    let pool = platform_pinata_pda(1);
    let platform_before = env.balance(&platform);
    let pool_prize_before = env.prize(&pool);

    let automation = env.funded_wallet(1);
    assert_ok(env.settle(&automation, pinata));
    assert_eq!(env.balance(&platform) - platform_before, 350_000_000);
    assert_eq!(env.prize(&pool) - pool_prize_before, 350_000_000);
}

#[test]
fn platform_pinata_bursts_at_target_and_opens_next_round() {
    let (mut env, creator) = env_with_creator();
    let fans: Vec<Keypair> = (0..4).map(|_| env.funded_wallet(10)).collect();
    // 4 x 0.2 SOL -> pool prize 0.16 SOL, above the 0.1 SOL target
    for fan in &fans {
        assert_ok(env.pay_comment(fan, &creator.pubkey(), 1, SOL / 5));
    }
    let automation = env.funded_wallet(1);
    assert_ok(env.request_platform_draw(&automation));

    let round1 = platform_pinata_pda(1);
    assert_eq!(env.pinata(&round1).status, PinataStatus::Drawing);
    assert_eq!(env.config().platform_round, 2);
    assert_eq!(env.pinata(&platform_pinata_pda(2)).status, PinataStatus::Open);

    // Comments keep flowing into round 2 while round 1 is drawn
    assert_ok(env.pay_comment(&fans[0], &creator.pubkey(), 1, MIN_COMMENT));
    assert_eq!(env.tickets(&platform_pinata_pda(2)), vec![fans[0].pubkey()]);

    // 3 distinct winners split the prize equally
    assert_ok(env.fulfill_randomness(round1, [5; 32]));
    let drawn = env.pinata(&round1);
    assert_eq!(drawn.winner_count, 3);
    let winners = drawn.winners().to_vec();
    let before: Vec<u64> = winners.iter().map(|w| env.balance(w)).collect();

    assert_ok(env.settle(&automation, round1));
    let share = 160_000_000 / 3;
    for (i, winner) in winners.iter().enumerate() {
        let gained = env.balance(winner) - before[i];
        let expected = if i == 0 { share + 160_000_000 % 3 } else { share };
        assert_eq!(gained, expected);
    }
    assert!(!env.exists(&round1));
}

#[test]
fn platform_pinata_below_target_waits_for_the_first_of_the_month() {
    let (mut env, creator) = env_with_creator();
    let fan = env.funded_wallet(10);
    // 0.35 SOL comment -> pool prize 0.07 SOL: 70% of the 0.1 SOL target
    assert_ok(env.pay_comment(&fan, &creator.pubkey(), 1, 350_000_000));
    let automation = env.funded_wallet(1);

    env.set_time(MID_MONTH);
    assert_error(env.request_platform_draw(&automation), "BurstThresholdNotReached");

    env.set_time(FIRST_OF_DECEMBER);
    assert_ok(env.request_platform_draw(&automation));
    assert_eq!(env.pinata(&platform_pinata_pda(1)).status, PinataStatus::Drawing);
}

#[test]
fn platform_pinata_below_the_monthly_minimum_does_not_burst_on_the_first() {
    let (mut env, creator) = env_with_creator();
    let fan = env.funded_wallet(10);
    // 0.25 SOL comment -> pool prize 0.05 SOL: 50%, below the 60% minimum
    assert_ok(env.pay_comment(&fan, &creator.pubkey(), 1, 250_000_000));
    env.set_time(FIRST_OF_DECEMBER);
    let automation = env.funded_wallet(1);
    assert_error(env.request_platform_draw(&automation), "BurstThresholdNotReached");
}
