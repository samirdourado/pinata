mod common;

use common::*;
use solana_signer::Signer;

#[test]
fn creator_opens_pinata_within_config_ranges() {
    let mut env = TestEnv::new();
    let creator = env.funded_wallet(10);

    assert_error(env.open_creator_pinata(&creator, 1, SOL / 1_000, 6_000), "TargetOutOfRange");
    assert_error(env.open_creator_pinata(&creator, 1, SOL, 9_500), "ThresholdOutOfRange");
    assert_error(env.open_creator_pinata(&creator, 2, SOL, 6_000), "InvalidRound");

    assert_ok(env.open_creator_pinata(&creator, 1, SOL, 6_000));
    let pinata = env.pinata(&pinata_pda(&creator.pubkey(), 1));
    assert_eq!(pinata.owner, creator.pubkey());
    assert_eq!(pinata.target_lamports, SOL);
    assert_eq!(pinata.threshold_bps, 6_000);
    assert_eq!(pinata.max_winners, 1);
    assert_eq!(pinata.rent_payer, creator.pubkey());

    let profile = env.profile(&creator.pubkey());
    assert_eq!(profile.round, 1);
    assert!(profile.has_active_pinata);
}

#[test]
fn creator_cannot_open_a_second_pinata_while_one_is_active() {
    let mut env = TestEnv::new();
    let creator = env.funded_wallet(10);
    assert_ok(env.open_creator_pinata(&creator, 1, SOL, 6_000));
    assert_error(env.open_creator_pinata(&creator, 2, SOL, 6_000), "CreatorPinataAlreadyActive");
}

#[test]
fn creator_without_pinata_cannot_receive_comments() {
    let mut env = TestEnv::new();
    let creator = env.funded_wallet(1);
    let commenter = env.funded_wallet(1);
    // The creator Piñata account does not exist
    assert!(env.pay_comment(&commenter, &creator.pubkey(), 1, MIN_COMMENT).is_err());
}

#[test]
fn comment_below_minimum_is_rejected() {
    let mut env = TestEnv::new();
    let creator = env.funded_wallet(1);
    let commenter = env.funded_wallet(1);
    assert_ok(env.open_creator_pinata(&creator, 1, SOL, 6_000));
    assert_error(
        env.pay_comment(&commenter, &creator.pubkey(), 1, MIN_COMMENT - 1),
        "CommentBelowMinimum",
    );
}

#[test]
fn comment_payment_is_split_four_ways_and_records_tickets() {
    let mut env = TestEnv::new();
    let creator = env.funded_wallet(1);
    let commenter = env.funded_wallet(2);
    assert_ok(env.open_creator_pinata(&creator, 1, SOL, 6_000));

    let creator_pinata = pinata_pda(&creator.pubkey(), 1);
    let pool = platform_pinata_pda(1);
    let platform = env.platform_wallet.pubkey();
    let before = [
        env.balance(&commenter.pubkey()),
        env.balance(&creator.pubkey()),
        env.balance(&creator_pinata),
        env.balance(&pool),
        env.balance(&platform),
    ];

    let amount = SOL; // 1 SOL comment
    assert_ok(env.pay_comment(&commenter, &creator.pubkey(), 1, amount));

    let deposit = env.ticket_deposit();
    let after = [
        env.balance(&commenter.pubkey()),
        env.balance(&creator.pubkey()),
        env.balance(&creator_pinata),
        env.balance(&pool),
        env.balance(&platform),
    ];
    // The commenter pays exactly the chosen amount (plus the network fee)
    assert_eq!(before[0] - after[0], amount + TX_FEE);
    assert_eq!(after[1] - before[1], 350_000_000); // 35% creator
    assert_eq!(after[2] - before[2], 350_000_000 + deposit); // 35% creator Piñata + ticket deposit
    assert_eq!(after[3] - before[3], 200_000_000 + deposit); // 20% pool + ticket deposit
    assert_eq!(after[4] - before[4], 100_000_000 - 2 * deposit); // 10% platform, funds the deposits

    // The deposits only cover storage: the prizes are exactly 35% and 20%
    assert_eq!(env.prize(&creator_pinata), 350_000_000);
    assert_eq!(env.prize(&pool), 200_000_000);
    assert_eq!(env.tickets(&creator_pinata), vec![commenter.pubkey()]);
    assert_eq!(env.tickets(&pool), vec![commenter.pubkey()]);
}

#[test]
fn each_comment_is_one_more_ticket() {
    let mut env = TestEnv::new();
    let creator = env.funded_wallet(1);
    let alice = env.funded_wallet(1);
    let bob = env.funded_wallet(1);
    assert_ok(env.open_creator_pinata(&creator, 1, SOL, 6_000));

    for commenter in [&alice, &bob, &alice] {
        assert_ok(env.pay_comment(commenter, &creator.pubkey(), 1, MIN_COMMENT));
    }
    let expected = vec![alice.pubkey(), bob.pubkey(), alice.pubkey()];
    assert_eq!(env.tickets(&pinata_pda(&creator.pubkey(), 1)), expected);
    assert_eq!(env.pinata(&pinata_pda(&creator.pubkey(), 1)).ticket_count, 3);
    assert_eq!(env.tickets(&platform_pinata_pda(1)), expected);
}

#[test]
fn creator_commenting_on_own_post_competes_only_for_the_platform_pinata() {
    let mut env = TestEnv::new();
    let creator = env.funded_wallet(2);
    assert_ok(env.open_creator_pinata(&creator, 1, SOL, 6_000));

    let platform = env.platform_wallet.pubkey();
    let creator_before = env.balance(&creator.pubkey());
    let platform_before = env.balance(&platform);

    assert_ok(env.pay_comment(&creator, &creator.pubkey(), 1, SOL));

    let deposit = env.ticket_deposit();
    let creator_pinata = pinata_pda(&creator.pubkey(), 1);
    assert!(env.tickets(&creator_pinata).is_empty());
    assert_eq!(env.tickets(&platform_pinata_pda(1)), vec![creator.pubkey()]);
    // The creator keeps their own 35% share: they only pay the other 65%
    assert_eq!(creator_before - env.balance(&creator.pubkey()), 650_000_000 + TX_FEE);
    assert_eq!(env.prize(&creator_pinata), 350_000_000);
    // Only one ticket deposit is taken from the platform share
    assert_eq!(env.balance(&platform) - platform_before, 100_000_000 - deposit);
}
