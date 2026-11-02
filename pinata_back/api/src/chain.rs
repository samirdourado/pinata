//! Reads from Solana: the program Config, Piñata accounts, and the check that
//! a transaction really paid for a given comment.

use std::{
    sync::RwLock,
    time::{Duration, Instant},
};

use anchor_lang::{
    prelude::{Pubkey, Rent},
    AccountDeserialize, AnchorDeserialize, Discriminator,
};
use pinata::{instruction::PayComment, pda, Config, CreatorProfile, Pinata, PinataStatus};
use serde::Serialize;
use solana_commitment_config::CommitmentConfig;
use solana_rpc_client::nonblocking::rpc_client::RpcClient;
use solana_rpc_client_api::config::RpcTransactionConfig;
use solana_signature::Signature;
use solana_transaction_status_client_types::UiTransactionEncoding;

use crate::error::{ApiResult, AppError};

/// The Config changes rarely; caching it saves one RPC call per comment.
const CONFIG_TTL: Duration = Duration::from_secs(60);
/// A transaction the wallet just sent may take a few seconds to be confirmed.
const CONFIRM_ATTEMPTS: u32 = 10;
const CONFIRM_DELAY: Duration = Duration::from_millis(1500);

pub struct Chain {
    rpc: RpcClient,
    config: RwLock<Option<(Instant, Config)>>,
}

/// A Piñata as the web app shows it.
#[derive(Serialize)]
pub struct PinataView {
    pub address: String,
    pub round: u64,
    pub status: &'static str,
    pub target_lamports: u64,
    pub threshold_bps: u16,
    pub threshold_lamports: u64,
    /// Current prize: the account balance above its rent-exempt minimum
    pub prize_lamports: u64,
    pub ticket_count: u32,
    pub opened_at: i64,
    pub winners: Vec<String>,
}

/// What a `pay_comment` transaction must contain to pay for a comment.
pub struct ExpectedPayment {
    pub comment_id: [u8; 16],
    pub commenter: Pubkey,
    pub creator: Pubkey,
    pub creator_pinata: Pubkey,
    pub amount_lamports: u64,
}

pub enum PaymentCheck {
    Paid,
    /// The transaction pays for this comment but failed on-chain
    Failed,
}

// Account positions in a pay_comment instruction (field order of `PayComment`)
const COMMENTER: usize = 0;
const CREATOR: usize = 2;
const CREATOR_PINATA: usize = 3;

impl Chain {
    pub fn new(rpc_url: String) -> Self {
        Self {
            rpc: RpcClient::new_with_commitment(rpc_url, CommitmentConfig::confirmed()),
            config: RwLock::new(None),
        }
    }

    pub async fn config(&self) -> ApiResult<Config> {
        if let Some((fetched_at, config)) = self.config.read().unwrap().as_ref() {
            if fetched_at.elapsed() < CONFIG_TTL {
                return Ok(config.clone());
            }
        }
        let config: Config = self
            .account(&pda::config())
            .await?
            .map(|(config, _)| config)
            .ok_or_else(|| AppError::Internal("the program Config does not exist on this cluster".into()))?;
        *self.config.write().unwrap() = Some((Instant::now(), config.clone()));
        Ok(config)
    }

    /// The creator's open Piñata, or None if they have no active one.
    pub async fn creator_pinata(&self, creator: &Pubkey) -> ApiResult<Option<PinataView>> {
        let Some((profile, _)) = self.account::<CreatorProfile>(&pda::creator_profile(creator)).await? else {
            return Ok(None);
        };
        if !profile.has_active_pinata {
            return Ok(None);
        }
        self.pinata(&pda::pinata(creator, profile.round)).await
    }

    pub async fn platform_pinata(&self) -> ApiResult<Option<PinataView>> {
        let config = self.config().await?;
        self.pinata(&pda::platform_pinata(config.platform_round)).await
    }

    async fn pinata(&self, address: &Pubkey) -> ApiResult<Option<PinataView>> {
        let Some((pinata, (data_len, lamports))) = self.account::<Pinata>(address).await? else {
            return Ok(None);
        };
        let threshold_lamports = pinata
            .threshold_lamports()
            .map_err(|error| AppError::Internal(format!("threshold: {error}")))?;
        Ok(Some(PinataView {
            address: address.to_string(),
            round: pinata.round,
            status: match pinata.status {
                PinataStatus::Open => "open",
                PinataStatus::Drawing => "drawing",
                PinataStatus::Drawn => "drawn",
            },
            target_lamports: pinata.target_lamports,
            threshold_bps: pinata.threshold_bps,
            threshold_lamports,
            prize_lamports: lamports.saturating_sub(Rent::default().minimum_balance(data_len)),
            ticket_count: pinata.ticket_count,
            opened_at: pinata.opened_at,
            winners: pinata.winners().iter().map(ToString::to_string).collect(),
        }))
    }

    /// Reads and decodes an account. Also returns its (data length, lamports).
    async fn account<T: AccountDeserialize>(&self, address: &Pubkey) -> ApiResult<Option<(T, (usize, u64))>> {
        let account = self
            .rpc
            .get_account_with_commitment(address, self.rpc.commitment())
            .await
            .map_err(|error| AppError::Upstream(error.to_string()))?
            .value;
        let Some(account) = account else { return Ok(None) };
        let decoded = T::try_deserialize(&mut account.data.as_slice())
            .map_err(|error| AppError::Internal(format!("decoding {address}: {error}")))?;
        Ok(Some((decoded, (account.data.len(), account.lamports))))
    }

    /// Fetches the transaction (waiting a little for confirmation) and checks
    /// that it calls pay_comment for this exact comment, wallet, creator and amount.
    pub async fn check_comment_payment(
        &self,
        signature: &Signature,
        expected: &ExpectedPayment,
    ) -> ApiResult<PaymentCheck> {
        let config = RpcTransactionConfig {
            encoding: Some(UiTransactionEncoding::Base64),
            commitment: Some(CommitmentConfig::confirmed()),
            max_supported_transaction_version: Some(0),
        };
        let mut attempt = 0;
        let fetched = loop {
            attempt += 1;
            match self.rpc.get_transaction_with_config(signature, config).await {
                Ok(fetched) => break fetched,
                // Not confirmed yet (or the RPC hiccuped): wait and retry
                Err(_) if attempt < CONFIRM_ATTEMPTS => tokio::time::sleep(CONFIRM_DELAY).await,
                Err(_) => {
                    return Err(AppError::conflict(
                        "The payment is not confirmed yet. Try again in a few seconds.",
                    ))
                }
            }
        };

        let transaction = fetched
            .transaction
            .transaction
            .decode()
            .ok_or_else(|| AppError::bad_request("Could not decode the transaction."))?;
        let failed = fetched.transaction.meta.is_some_and(|meta| meta.err.is_some());
        let message = &transaction.message;
        let keys = message.static_account_keys();

        for instruction in message.instructions() {
            if keys.get(instruction.program_id_index as usize) != Some(&pinata::ID) {
                continue;
            }
            let Some(args) = instruction.data.strip_prefix(PayComment::DISCRIMINATOR) else {
                continue;
            };
            let Ok(args) = PayComment::deserialize(&mut &args[..]) else {
                continue;
            };
            if args.comment_id != expected.comment_id {
                continue;
            }
            let account = |position: usize| {
                instruction
                    .accounts
                    .get(position)
                    .and_then(|&index| keys.get(index as usize))
            };
            let matches = account(COMMENTER) == Some(&expected.commenter)
                && account(CREATOR) == Some(&expected.creator)
                && account(CREATOR_PINATA) == Some(&expected.creator_pinata)
                && args.amount_lamports == expected.amount_lamports;
            if !matches {
                return Err(AppError::bad_request(
                    "The transaction does not match this comment (wallet, creator, Piñata or amount).",
                ));
            }
            return Ok(if failed { PaymentCheck::Failed } else { PaymentCheck::Paid });
        }
        Err(AppError::bad_request("This transaction does not pay for this comment."))
    }
}
