//! Command line client for the Pinata program on Devnet.
//!
//! Run from `pinata_back/` (inside the anchor container):
//!   cargo run -p pinata-cli -- init <platform_wallet>
//!   cargo run -p pinata-cli -- status
//!   cargo run -p pinata-cli -- draw-demo
//!
//! Options: `--url <rpc>` (default: public Devnet RPC) and `--keypair <file>`
//! (default: keys/deploy-keypair.json, the admin and upgrade authority).

use std::{error::Error, fs, path::Path, str::FromStr, thread, time::Duration};

use anchor_lang::{
    prelude::{AccountMeta, Pubkey},
    solana_program::instruction::Instruction,
    system_program, AccountDeserialize, InstructionData, ToAccountMetas,
};
use ephemeral_vrf_sdk::consts as vrf_consts;
use pinata::{
    accounts, instruction, Config, ConfigParams, CreatorProfile, FeeSplit, Pinata, PinataKind,
    PinataStatus, CONFIG_SEED, CREATOR_SEED, IDENTITY_SEED, PINATA_SEED,
};
use solana_commitment_config::CommitmentConfig;
use solana_keypair::Keypair;
use solana_rpc_client::rpc_client::RpcClient;
use solana_signer::Signer;
use solana_transaction::Transaction;

type Result<T> = std::result::Result<T, Box<dyn Error>>;

const SOL: u64 = 1_000_000_000;
const DEVNET_URL: &str = "https://api.devnet.solana.com";
const DEFAULT_KEYPAIR: &str = "keys/deploy-keypair.json";
/// Test commenters for draw-demo, created on first use (git-ignored like all of keys/)
const COMMENTER_KEYPAIRS: [&str; 2] = ["keys/devnet-commenter-1.json", "keys/devnet-commenter-2.json"];
const COMMENTER_FUNDING: u64 = SOL / 50; // 0.02 SOL each
const DRAW_TIMEOUT: Duration = Duration::from_secs(120);

/// Devnet parameters: the agreed business rules with small amounts, so a
/// whole round can be tested with a few SOL. The admin can change them later
/// with update_config.
fn devnet_params(platform_wallet: Pubkey) -> ConfigParams {
    ConfigParams {
        platform_wallet,
        split: FeeSplit {
            creator_bps: 3_500,
            creator_pinata_bps: 3_500,
            platform_pool_bps: 2_000,
            platform_bps: 1_000,
        },
        min_comment_lamports: SOL / 200, // 0.005 SOL
        creator_target_min_lamports: SOL / 100,
        creator_target_max_lamports: 1_000 * SOL,
        creator_threshold_min_bps: 100,   // 1%
        creator_threshold_max_bps: 9_000, // 90%
        platform_target_lamports: SOL / 10,
        platform_threshold_bps: 6_000, // 60% on the 1st of the month
        platform_winners: 3,
        timezone_offset_seconds: -3 * 3600, // Brasília
    }
}

fn main() {
    if let Err(error) = run() {
        eprintln!("error: {error}");
        std::process::exit(1);
    }
}

fn run() -> Result<()> {
    let mut url = DEVNET_URL.to_string();
    let mut keypair_path = DEFAULT_KEYPAIR.to_string();
    let mut positional = Vec::new();
    let mut args = std::env::args().skip(1);
    while let Some(arg) = args.next() {
        match arg.as_str() {
            "--url" => url = args.next().ok_or("--url needs a value")?,
            "--keypair" => keypair_path = args.next().ok_or("--keypair needs a value")?,
            _ => positional.push(arg),
        }
    }

    let client = Client {
        rpc: RpcClient::new_with_commitment(url, CommitmentConfig::confirmed()),
        admin: read_keypair(&keypair_path)?,
    };
    match positional.iter().map(String::as_str).collect::<Vec<_>>().as_slice() {
        ["init", platform_wallet] => client.init(Pubkey::from_str(platform_wallet)?),
        ["status"] => client.status(),
        ["draw-demo"] => client.draw_demo(),
        _ => Err("usage: pinata-cli [--url <rpc>] [--keypair <file>] init <platform_wallet> | status | draw-demo".into()),
    }
}

struct Client {
    rpc: RpcClient,
    admin: Keypair,
}

impl Client {
    /// Creates the Config and the first platform Piñata. Run right after the deploy:
    /// whoever calls initialize first becomes the admin.
    fn init(&self, platform_wallet: Pubkey) -> Result<()> {
        if self.fetch::<Config>(&config_pda())?.is_some() {
            println!("Already initialized.");
            return self.status();
        }
        let ix = Instruction::new_with_bytes(
            pinata::ID,
            &instruction::Initialize { params: devnet_params(platform_wallet) }.data(),
            accounts::Initialize {
                admin: self.admin.pubkey(),
                config: config_pda(),
                platform_pinata: platform_pinata_pda(1),
                system_program: system_program::ID,
            }
            .to_account_metas(None),
        );
        self.send(&[ix], &self.admin, &[])?;
        self.status()
    }

    fn status(&self) -> Result<()> {
        let config = self.fetch::<Config>(&config_pda())?.ok_or("not initialized: run init")?;
        let params = &config.params;
        println!("Program          {}", pinata::ID);
        println!("Config           {}", config_pda());
        println!("Admin            {}", config.admin);
        println!("Platform wallet  {}", params.platform_wallet);
        println!(
            "Split (bps)      creator {} / creator Piñata {} / platform Piñata {} / platform {}",
            params.split.creator_bps,
            params.split.creator_pinata_bps,
            params.split.platform_pool_bps,
            params.split.platform_bps
        );
        println!("Minimum comment  {}", sol(params.min_comment_lamports));
        let pool = platform_pinata_pda(config.platform_round);
        println!("\nPlatform Piñata round {} ({pool})", config.platform_round);
        self.print_pinata(&pool)?;

        let creator = self.admin.pubkey();
        if let Some(profile) = self.fetch::<CreatorProfile>(&creator_profile_pda(&creator))? {
            let address = pinata_pda(&creator, profile.round);
            println!("\nCreator Piñata of {creator}, round {} ({address})", profile.round);
            if self.rpc.get_account(&address).is_ok() {
                self.print_pinata(&address)?;
            } else {
                println!("  settled and closed");
            }
        }
        Ok(())
    }

    /// One full creator Piñata round against the real MagicBlock oracle:
    /// open → two commenters pay → the owner bursts early → the oracle calls
    /// consume_randomness → settle pays the winner. The admin key plays the
    /// creator. Safe to rerun: it resumes from the current state.
    fn draw_demo(&self) -> Result<()> {
        let creator = &self.admin;
        let profile = self.fetch::<CreatorProfile>(&creator_profile_pda(&creator.pubkey()))?;
        let round = match profile {
            Some(profile) if profile.has_active_pinata => profile.round,
            profile => {
                let round = profile.map_or(1, |p| p.round + 1);
                println!("Opening creator Piñata round {round} (target 0.01 SOL, early burst from 1%)");
                let ix = Instruction::new_with_bytes(
                    pinata::ID,
                    &instruction::OpenCreatorPinata {
                        round,
                        target_lamports: SOL / 100,
                        threshold_bps: 100,
                    }
                    .data(),
                    accounts::OpenCreatorPinata {
                        creator: creator.pubkey(),
                        config: config_pda(),
                        creator_profile: creator_profile_pda(&creator.pubkey()),
                        pinata: pinata_pda(&creator.pubkey(), round),
                        system_program: system_program::ID,
                    }
                    .to_account_metas(None),
                );
                self.send(&[ix], creator, &[])?;
                round
            }
        };
        let address = pinata_pda(&creator.pubkey(), round);

        if self.pinata(&address)?.status == PinataStatus::Open {
            for path in COMMENTER_KEYPAIRS {
                let commenter = load_or_create_keypair(path)?;
                if self.rpc.get_balance(&commenter.pubkey())? < COMMENTER_FUNDING / 2 {
                    println!("Funding {} with {}", commenter.pubkey(), sol(COMMENTER_FUNDING));
                    let ix = transfer(&creator.pubkey(), &commenter.pubkey(), COMMENTER_FUNDING);
                    self.send(&[ix], creator, &[])?;
                }
                println!("{} pays a comment", commenter.pubkey());
                self.pay_comment(&commenter, &creator.pubkey(), round)?;
            }
            println!("Owner bursts the Piñata early and requests randomness");
            let ix = Instruction::new_with_bytes(
                pinata::ID,
                &instruction::RequestCreatorDraw {}.data(),
                accounts::RequestCreatorDraw {
                    caller: creator.pubkey(),
                    pinata: address,
                    vrf: vrf_accounts(),
                    system_program: system_program::ID,
                }
                .to_account_metas(None),
            );
            self.send(&[ix], creator, &[])?;
        }

        if self.pinata(&address)?.status == PinataStatus::Drawing {
            println!("Waiting for the MagicBlock oracle...");
            let started = std::time::Instant::now();
            while self.pinata(&address)?.status == PinataStatus::Drawing {
                if started.elapsed() > DRAW_TIMEOUT {
                    return Err("the oracle did not answer in time; rerun draw-demo to keep waiting".into());
                }
                thread::sleep(Duration::from_secs(2));
            }
            println!("Oracle answered after {}s", started.elapsed().as_secs());
        }

        let state = self.pinata(&address)?;
        println!("Prize {} → winners {:?}", sol(state.prize_lamports), state.winners());
        self.settle(&address, &state)?;
        println!("Settled. Piñata closed, round {round} finished.");
        Ok(())
    }

    fn pay_comment(&self, commenter: &Keypair, creator: &Pubkey, creator_round: u64) -> Result<()> {
        let config = self.fetch::<Config>(&config_pda())?.ok_or("not initialized")?;
        let ix = Instruction::new_with_bytes(
            pinata::ID,
            &instruction::PayComment {
                // In the app this is the comment's UUID from the database
                comment_id: Keypair::new().pubkey().to_bytes()[..16].try_into().unwrap(),
                amount_lamports: config.params.min_comment_lamports,
            }
            .data(),
            accounts::PayComment {
                commenter: commenter.pubkey(),
                config: config_pda(),
                creator: *creator,
                creator_pinata: pinata_pda(creator, creator_round),
                platform_pinata: platform_pinata_pda(config.platform_round),
                platform_wallet: config.params.platform_wallet,
                system_program: system_program::ID,
            }
            .to_account_metas(None),
        );
        self.send(&[ix], commenter, &[])
    }

    fn settle(&self, address: &Pubkey, state: &Pinata) -> Result<()> {
        let config = self.fetch::<Config>(&config_pda())?.ok_or("not initialized")?;
        let mut metas = accounts::Settle {
            config: config_pda(),
            pinata: *address,
            rent_payer: state.rent_payer,
            platform_wallet: config.params.platform_wallet,
            platform_pinata: platform_pinata_pda(config.platform_round),
            creator_profile: match state.kind {
                PinataKind::Creator => Some(creator_profile_pda(&state.owner)),
                PinataKind::Platform => None,
            },
        }
        .to_account_metas(None);
        // The winners receive the prize, so they go in as writable extra accounts
        metas.extend(state.winners().iter().map(|winner| AccountMeta::new(*winner, false)));
        let ix = Instruction::new_with_bytes(pinata::ID, &instruction::Settle {}.data(), metas);
        self.send(&[ix], &self.admin, &[])
    }

    fn print_pinata(&self, address: &Pubkey) -> Result<()> {
        let account = self.rpc.get_account(address)?;
        let state = Pinata::try_deserialize(&mut account.data.as_slice())?;
        let rent = self.rpc.get_minimum_balance_for_rent_exemption(account.data.len())?;
        println!("  status   {:?}", state.status);
        println!("  prize    {} of {}", sol(account.lamports - rent), sol(state.target_lamports));
        println!("  tickets  {}", state.ticket_count);
        if !state.winners().is_empty() {
            println!("  winners  {:?}", state.winners());
        }
        Ok(())
    }

    fn pinata(&self, address: &Pubkey) -> Result<Pinata> {
        self.fetch(address)?.ok_or_else(|| format!("Piñata {address} not found").into())
    }

    /// Reads and decodes an account, or None if it does not exist.
    fn fetch<T: AccountDeserialize>(&self, address: &Pubkey) -> Result<Option<T>> {
        let account = self.rpc.get_account_with_commitment(address, self.rpc.commitment())?.value;
        account
            .map(|account| T::try_deserialize(&mut account.data.as_slice()).map_err(Into::into))
            .transpose()
    }

    fn send(&self, ixs: &[Instruction], payer: &Keypair, extra_signers: &[&Keypair]) -> Result<()> {
        let mut signers = vec![payer];
        signers.extend(extra_signers);
        let blockhash = self.rpc.get_latest_blockhash()?;
        let tx = Transaction::new_signed_with_payer(ixs, Some(&payer.pubkey()), &signers, blockhash);
        let signature = self.rpc.send_and_confirm_transaction(&tx).map_err(|error| format!("{error:#?}"))?;
        println!("  tx https://solscan.io/tx/{signature}?cluster=devnet");
        Ok(())
    }
}

// ----- Addresses (same seeds as the program) -----

fn config_pda() -> Pubkey {
    Pubkey::find_program_address(&[CONFIG_SEED], &pinata::ID).0
}

fn creator_profile_pda(creator: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(&[CREATOR_SEED, creator.as_ref()], &pinata::ID).0
}

fn pinata_pda(owner: &Pubkey, round: u64) -> Pubkey {
    Pubkey::find_program_address(&[PINATA_SEED, owner.as_ref(), &round.to_le_bytes()], &pinata::ID).0
}

fn platform_pinata_pda(round: u64) -> Pubkey {
    pinata_pda(&config_pda(), round)
}

fn vrf_accounts() -> accounts::VrfAccounts {
    accounts::VrfAccounts {
        oracle_queue: vrf_consts::DEFAULT_QUEUE,
        program_identity: Pubkey::find_program_address(&[IDENTITY_SEED], &pinata::ID).0,
        vrf_program: vrf_consts::VRF_PROGRAM_ID,
        slot_hashes: ephemeral_vrf_sdk::compat::slot_hashes::ID,
    }
}

// ----- Helpers -----

/// System Program transfer, encoded by hand (instruction 2, then the amount)
/// to avoid one more crate for a single instruction.
fn transfer(from: &Pubkey, to: &Pubkey, lamports: u64) -> Instruction {
    let mut data = 2u32.to_le_bytes().to_vec();
    data.extend_from_slice(&lamports.to_le_bytes());
    Instruction::new_with_bytes(
        system_program::ID,
        &data,
        vec![AccountMeta::new(*from, true), AccountMeta::new(*to, false)],
    )
}

/// Reads a keypair file in the Solana CLI format: a JSON array of 64 bytes.
fn read_keypair(path: &str) -> Result<Keypair> {
    let text = fs::read_to_string(path).map_err(|error| format!("{path}: {error}"))?;
    let bytes = text
        .trim()
        .trim_start_matches('[')
        .trim_end_matches(']')
        .split(',')
        .map(|byte| byte.trim().parse::<u8>())
        .collect::<std::result::Result<Vec<_>, _>>()?;
    Ok(Keypair::try_from(bytes.as_slice())?)
}

fn load_or_create_keypair(path: &str) -> Result<Keypair> {
    if Path::new(path).exists() {
        return read_keypair(path);
    }
    let keypair = Keypair::new();
    let bytes: Vec<String> = keypair.to_bytes().iter().map(u8::to_string).collect();
    fs::write(path, format!("[{}]", bytes.join(",")))?;
    Ok(keypair)
}

fn sol(lamports: u64) -> String {
    format!("{} SOL", lamports as f64 / SOL as f64)
}
