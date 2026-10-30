//! Test harness: a LiteSVM chain with the Pinata program, the MagicBlock VRF
//! program and its oracle queue (both dumped from Devnet into tests/fixtures).
#![allow(dead_code)]

use anchor_lang::{
    prelude::Pubkey, solana_program::instruction::Instruction, AccountDeserialize,
    InstructionData, ToAccountMetas,
};
use ephemeral_vrf_sdk::consts as vrf_consts;
use litesvm::{types::TransactionResult, LiteSVM};
use pinata::{
    accounts, instruction, Config, ConfigParams, CreatorProfile, FeeSplit, Pinata, CONFIG_SEED,
    CREATOR_SEED, IDENTITY_SEED, PINATA_SEED,
};
use solana_account::Account;
use solana_clock::Clock;
use solana_keypair::Keypair;
use solana_message::{Message, VersionedMessage};
use solana_signature::Signature;
use solana_signer::Signer;
use solana_transaction::versioned::VersionedTransaction;

pub const SOL: u64 = 1_000_000_000;
pub const TX_FEE: u64 = 5_000;
pub const MIN_COMMENT: u64 = 5_000_000; // 0.005 SOL
pub const BRASILIA: i32 = -3 * 3600;
/// 2026-11-10 12:00 in Brasília (not the 1st of the month)
pub const MID_MONTH: i64 = 1_794_322_800;
/// 2026-12-01 00:30 in Brasília
pub const FIRST_OF_DECEMBER: i64 = 1_796_095_800;

pub fn default_params(platform_wallet: Pubkey) -> ConfigParams {
    ConfigParams {
        platform_wallet,
        split: FeeSplit {
            creator_bps: 3_500,
            creator_pinata_bps: 3_500,
            platform_pool_bps: 2_000,
            platform_bps: 1_000,
        },
        min_comment_lamports: MIN_COMMENT,
        creator_target_min_lamports: SOL / 100,
        creator_target_max_lamports: 1_000 * SOL,
        creator_threshold_min_bps: 100,
        creator_threshold_max_bps: 9_000,
        platform_target_lamports: SOL / 10,
        platform_threshold_bps: 6_000,
        platform_winners: 3,
        timezone_offset_seconds: BRASILIA,
    }
}

pub struct TestEnv {
    pub svm: LiteSVM,
    pub admin: Keypair,
    pub platform_wallet: Keypair,
}

impl TestEnv {
    /// Chain with both programs loaded, but no Config yet.
    pub fn bare() -> Self {
        // Signature checks off so tests can sign as the VRF identity PDA,
        // as the real VRF program does when it calls us back.
        let mut svm = LiteSVM::new().with_sigverify(false);
        // Read at run time, not with include_bytes!: the .so only exists after
        // `anchor build`, inside the Docker target volume, so the editor
        // could not compile the tests on the host.
        svm.add_program_from_file(
            pinata::ID,
            concat!(env!("CARGO_MANIFEST_DIR"), "/../../target/deploy/pinata.so"),
        )
        .expect("target/deploy/pinata.so not found: run `anchor build` first");
        svm.add_program(
            vrf_consts::VRF_PROGRAM_ID,
            include_bytes!("../fixtures/magicblock_vrf.so"),
        )
        .unwrap();
        let queue_data = include_bytes!("../fixtures/oracle_queue.bin").to_vec();
        let queue_lamports = svm.minimum_balance_for_rent_exemption(queue_data.len());
        svm.set_account(
            vrf_consts::DEFAULT_QUEUE,
            Account {
                lamports: queue_lamports,
                data: queue_data,
                owner: vrf_consts::VRF_PROGRAM_ID,
                executable: false,
                rent_epoch: 0,
            },
        )
        .unwrap();

        let admin = Keypair::new();
        let platform_wallet = Keypair::new();
        svm.airdrop(&admin.pubkey(), 100 * SOL).unwrap();
        svm.airdrop(&platform_wallet.pubkey(), SOL).unwrap();
        let mut env = Self {
            svm,
            admin,
            platform_wallet,
        };
        env.set_time(MID_MONTH);
        env
    }

    /// Chain with the program initialized with `default_params`.
    pub fn new() -> Self {
        let mut env = Self::bare();
        let params = default_params(env.platform_wallet.pubkey());
        env.initialize(params).unwrap();
        env
    }

    pub fn initialize(&mut self, params: ConfigParams) -> TransactionResult {
        let ix = Instruction::new_with_bytes(
            pinata::ID,
            &instruction::Initialize { params }.data(),
            accounts::Initialize {
                admin: self.admin.pubkey(),
                config: config_pda(),
                platform_pinata: platform_pinata_pda(1),
                system_program: anchor_lang::system_program::ID,
            }
            .to_account_metas(None),
        );
        let admin = self.admin.insecure_clone();
        self.send(ix, &admin, &[])
    }

    pub fn set_time(&mut self, unix_timestamp: i64) {
        let mut clock: Clock = self.svm.get_sysvar();
        clock.unix_timestamp = unix_timestamp;
        self.svm.set_sysvar(&clock);
    }

    pub fn funded_wallet(&mut self, sol: u64) -> Keypair {
        let wallet = Keypair::new();
        self.svm.airdrop(&wallet.pubkey(), sol * SOL).unwrap();
        wallet
    }

    pub fn balance(&self, address: &Pubkey) -> u64 {
        self.svm.get_balance(address).unwrap_or(0)
    }

    pub fn rent(&self, data_len: usize) -> u64 {
        self.svm.minimum_balance_for_rent_exemption(data_len)
    }

    pub fn ticket_deposit(&self) -> u64 {
        self.rent(32) - self.rent(0)
    }

    pub fn account<T: AccountDeserialize>(&self, address: &Pubkey) -> T {
        let account = self.svm.get_account(address).expect("account missing");
        T::try_deserialize(&mut account.data.as_slice()).unwrap()
    }

    pub fn exists(&self, address: &Pubkey) -> bool {
        self.svm
            .get_account(address)
            .is_some_and(|account| account.lamports > 0)
    }

    pub fn config(&self) -> Config {
        self.account(&config_pda())
    }

    pub fn pinata(&self, address: &Pubkey) -> Pinata {
        self.account(address)
    }

    pub fn profile(&self, creator: &Pubkey) -> CreatorProfile {
        self.account(&creator_profile_pda(creator))
    }

    /// Prize held by a Piñata: balance above the rent-exempt minimum.
    pub fn prize(&self, address: &Pubkey) -> u64 {
        let account = self.svm.get_account(address).unwrap();
        account.lamports - self.rent(account.data.len())
    }

    /// Wallets stored as tickets in a Piñata, in order.
    pub fn tickets(&self, address: &Pubkey) -> Vec<Pubkey> {
        let data = self.svm.get_account(address).unwrap().data;
        data[Pinata::TICKETS_OFFSET..]
            .chunks_exact(32)
            .map(|chunk| Pubkey::try_from(chunk).unwrap())
            .collect()
    }

    /// Sends one instruction, `payer` paying the fee. Each call gets a fresh
    /// blockhash so identical transactions are not rejected as duplicates.
    pub fn send(&mut self, ix: Instruction, payer: &Keypair, signers: &[&Keypair]) -> TransactionResult {
        let blockhash = self.svm.latest_blockhash();
        let message = Message::new_with_blockhash(&[ix], Some(&payer.pubkey()), &blockhash);
        let mut all: Vec<&Keypair> = vec![payer];
        all.extend(signers.iter().copied().filter(|s| s.pubkey() != payer.pubkey()));
        let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(message), &all).unwrap();
        let result = self.svm.send_transaction(tx);
        self.svm.expire_blockhash();
        result
    }

    // ----- Program instructions -----

    pub fn open_creator_pinata(
        &mut self,
        creator: &Keypair,
        round: u64,
        target_lamports: u64,
        threshold_bps: u16,
    ) -> TransactionResult {
        let ix = Instruction::new_with_bytes(
            pinata::ID,
            &instruction::OpenCreatorPinata {
                round,
                target_lamports,
                threshold_bps,
            }
            .data(),
            accounts::OpenCreatorPinata {
                creator: creator.pubkey(),
                config: config_pda(),
                creator_profile: creator_profile_pda(&creator.pubkey()),
                pinata: pinata_pda(&creator.pubkey(), round),
                system_program: anchor_lang::system_program::ID,
            }
            .to_account_metas(None),
        );
        self.send(ix, creator, &[])
    }

    pub fn pay_comment(
        &mut self,
        commenter: &Keypair,
        creator: &Pubkey,
        creator_round: u64,
        amount_lamports: u64,
    ) -> TransactionResult {
        let platform_round = self.config().platform_round;
        let ix = Instruction::new_with_bytes(
            pinata::ID,
            &instruction::PayComment {
                comment_id: [7; 16],
                amount_lamports,
            }
            .data(),
            accounts::PayComment {
                commenter: commenter.pubkey(),
                config: config_pda(),
                creator: *creator,
                creator_pinata: pinata_pda(creator, creator_round),
                platform_pinata: platform_pinata_pda(platform_round),
                platform_wallet: self.platform_wallet.pubkey(),
                system_program: anchor_lang::system_program::ID,
            }
            .to_account_metas(None),
        );
        self.send(ix, commenter, &[])
    }

    pub fn request_creator_draw(&mut self, caller: &Keypair, pinata: Pubkey) -> TransactionResult {
        let ix = Instruction::new_with_bytes(
            pinata::ID,
            &instruction::RequestCreatorDraw {}.data(),
            accounts::RequestCreatorDraw {
                caller: caller.pubkey(),
                pinata,
                vrf: vrf_accounts(),
                system_program: anchor_lang::system_program::ID,
            }
            .to_account_metas(None),
        );
        self.send(ix, caller, &[])
    }

    pub fn request_platform_draw(&mut self, caller: &Keypair) -> TransactionResult {
        let round = self.config().platform_round;
        let ix = Instruction::new_with_bytes(
            pinata::ID,
            &instruction::RequestPlatformDraw {}.data(),
            accounts::RequestPlatformDraw {
                caller: caller.pubkey(),
                config: config_pda(),
                pinata: platform_pinata_pda(round),
                next_pinata: platform_pinata_pda(round + 1),
                vrf: vrf_accounts(),
                system_program: anchor_lang::system_program::ID,
            }
            .to_account_metas(None),
        );
        self.send(ix, caller, &[])
    }

    /// Calls `consume_randomness` signed by `identity` (the scoped VRF identity
    /// PDA, unless a test wants to impersonate it). Works because sigverify is off.
    pub fn consume_randomness_as(
        &mut self,
        identity: Pubkey,
        pinata: Pubkey,
        randomness: [u8; 32],
    ) -> TransactionResult {
        let ix = Instruction::new_with_bytes(
            pinata::ID,
            &instruction::ConsumeRandomness { randomness }.data(),
            accounts::ConsumeRandomness {
                vrf_program_identity: identity,
                pinata,
            }
            .to_account_metas(None),
        );
        let fee_payer = self.admin.pubkey();
        let blockhash = self.svm.latest_blockhash();
        let message = Message::new_with_blockhash(&[ix], Some(&fee_payer), &blockhash);
        let signatures = vec![Signature::default(); message.header.num_required_signatures as usize];
        let tx = VersionedTransaction {
            signatures,
            message: VersionedMessage::Legacy(message),
        };
        let result = self.svm.send_transaction(tx);
        self.svm.expire_blockhash();
        result
    }

    /// What the VRF oracle does after a draw request.
    pub fn fulfill_randomness(&mut self, pinata: Pubkey, randomness: [u8; 32]) -> TransactionResult {
        self.consume_randomness_as(vrf_consts::scoped_vrf_identity(&pinata::ID), pinata, randomness)
    }

    pub fn settle(&mut self, caller: &Keypair, pinata: Pubkey) -> TransactionResult {
        let state = self.pinata(&pinata);
        let platform_round = self.config().platform_round;
        let creator_profile = match state.kind {
            pinata::PinataKind::Creator => Some(creator_profile_pda(&state.owner)),
            pinata::PinataKind::Platform => None,
        };
        let mut metas = accounts::Settle {
            config: config_pda(),
            pinata,
            rent_payer: state.rent_payer,
            platform_wallet: self.platform_wallet.pubkey(),
            platform_pinata: platform_pinata_pda(platform_round),
            creator_profile,
        }
        .to_account_metas(None);
        for winner in state.winners() {
            metas.push(anchor_lang::prelude::AccountMeta::new(*winner, false));
        }
        let ix = Instruction::new_with_bytes(pinata::ID, &instruction::Settle {}.data(), metas);
        self.send(ix, caller, &[])
    }
}

// ----- Addresses -----

pub fn config_pda() -> Pubkey {
    Pubkey::find_program_address(&[CONFIG_SEED], &pinata::ID).0
}

pub fn creator_profile_pda(creator: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(&[CREATOR_SEED, creator.as_ref()], &pinata::ID).0
}

pub fn pinata_pda(owner: &Pubkey, round: u64) -> Pubkey {
    Pubkey::find_program_address(&[PINATA_SEED, owner.as_ref(), &round.to_le_bytes()], &pinata::ID).0
}

pub fn platform_pinata_pda(round: u64) -> Pubkey {
    pinata_pda(&config_pda(), round)
}

pub fn vrf_accounts() -> accounts::VrfAccounts {
    accounts::VrfAccounts {
        oracle_queue: vrf_consts::DEFAULT_QUEUE,
        program_identity: Pubkey::find_program_address(&[IDENTITY_SEED], &pinata::ID).0,
        vrf_program: vrf_consts::VRF_PROGRAM_ID,
        slot_hashes: ephemeral_vrf_sdk::compat::slot_hashes::ID,
    }
}

// ----- Assertions -----

/// Asserts the transaction failed with the given Anchor error name.
pub fn assert_error(result: TransactionResult, error_name: &str) {
    let failure = result.expect_err(&format!("expected {error_name}, but the transaction succeeded"));
    let logs = failure.meta.logs.join("\n");
    assert!(
        logs.contains(&format!("Error Code: {error_name}")),
        "expected {error_name}, got {:?}\n{logs}",
        failure.err
    );
}

pub fn assert_ok(result: TransactionResult) {
    if let Err(failure) = result {
        panic!("transaction failed: {:?}\n{}", failure.err, failure.meta.logs.join("\n"));
    }
}
