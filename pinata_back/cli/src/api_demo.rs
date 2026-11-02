//! `api-demo <api_url>`: uses the API the way the web app will, with a test
//! wallet (keys/devnet-commenter-1.json) instead of Phantom:
//! sign in by signing a message → complete the profile → comment on a post,
//! paying on Devnet → the API confirms the payment → like the post.

use std::str::FromStr;

use anchor_lang::{
    prelude::Pubkey, solana_program::instruction::Instruction, system_program, InstructionData,
    ToAccountMetas,
};
use pinata::{accounts, instruction};
use reqwest::{
    blocking::{Client as Http, RequestBuilder},
    StatusCode,
};
use serde_json::{json, Value};
use solana_signer::Signer;

use crate::{load_or_create_keypair, sol, Client, Result, COMMENTER_FUNDING, COMMENTER_KEYPAIRS};

pub fn run(chain: &Client, api: &str) -> Result<()> {
    let wallet = load_or_create_keypair(COMMENTER_KEYPAIRS[0])?;
    chain.ensure_funded(&wallet.pubkey(), COMMENTER_FUNDING)?;
    // Keeps the session cookie between requests, like a browser
    let http = Http::builder().cookie_store(true).build()?;

    println!("\n1. Sign in with {}", wallet.pubkey());
    let challenge = call(http.post(format!("{api}/auth/nonce")).json(&json!({ "wallet": wallet.pubkey().to_string() })))?;
    let message = text(&challenge, "message")?;
    println!("{message}\n");
    // What Phantom does when the user clicks "Sign": an ed25519 signature, no transaction
    let signature = wallet.sign_message(message.as_bytes());
    let me = call(http.post(format!("{api}/auth/verify")).json(&json!({
        "wallet": wallet.pubkey().to_string(),
        "nonce": text(&challenge, "nonce")?,
        "signature": signature.to_string(),
    })))?;
    if me["needs_profile"].as_bool() == Some(true) {
        println!("   first sign-in: completing the profile");
        call(http.patch(format!("{api}/me")).json(&json!({
            "username": "devnet_tester",
            "display_name": "Devnet Tester",
            "bio": "Test wallet driven by pinata-cli api-demo",
        })))?;
    }
    let me = call(http.get(format!("{api}/me")))?;
    println!("   signed in as @{}", text(&me, "username")?);

    println!("\n2. Comment on the newest post whose author has an open Piñata");
    let rules = call(http.get(format!("{api}/pinatas/rules")))?;
    let amount = rules["min_comment_lamports"].as_u64().ok_or("rules without a minimum comment")?;
    let posts = call(http.get(format!("{api}/posts")))?;
    let mut intent = None;
    for post in posts.as_array().ok_or("posts is not a list")? {
        let request = http.post(format!("{api}/posts/{}/comments", text(post, "id")?)).json(&json!({
            "wallet": wallet.pubkey().to_string(),
            "content": "Paid on Devnet by pinata-cli api-demo: the API checked the transaction before publishing.",
            "amount_lamports": amount,
        }));
        match call_status(request)? {
            (StatusCode::CREATED, body) => {
                println!("   post by @{}: {}", text(&post["author"], "username")?, text(post, "id")?);
                intent = Some(body);
                break;
            }
            // This author has no open Piñata yet: try the next post
            (StatusCode::CONFLICT, _) => continue,
            (status, body) => return Err(format!("{status}: {body}").into()),
        }
    }
    let intent = intent.ok_or("no post can receive comments: run `pinata-cli demo-pinatas` first")?;
    let comment_id = text(&intent["comment"], "id")?;
    println!("   pending comment {comment_id}, paying {}", sol(amount));

    println!("\n3. Pay on-chain (the wallet signs pay_comment)");
    let payment = &intent["payment"];
    let key = |name: &str| -> Result<Pubkey> { Ok(Pubkey::from_str(text(payment, name)?)?) };
    let ix = Instruction::new_with_bytes(
        pinata::ID,
        &instruction::PayComment {
            comment_id: hex_16(text(payment, "comment_id_hex")?)?,
            amount_lamports: amount,
        }
        .data(),
        accounts::PayComment {
            commenter: key("commenter")?,
            config: key("config")?,
            creator: key("creator")?,
            creator_pinata: key("creator_pinata")?,
            platform_pinata: key("platform_pinata")?,
            platform_wallet: key("platform_wallet")?,
            system_program: system_program::ID,
        }
        .to_account_metas(None),
    );
    let tx_signature = chain.send(&[ix], &wallet, &[])?;

    println!("\n4. The API reads the transaction from Solana and publishes the comment");
    let comment = call(http.post(format!("{api}/comments/{comment_id}/confirm")).json(&json!({ "signature": tx_signature })))?;
    println!("   status: {}, author: @{}", text(&comment, "status")?, text(&comment["author"], "username")?);

    println!("\n5. Like the post");
    let post_id = text(&comment, "post_id")?;
    let vote = call(http.post(format!("{api}/posts/{post_id}/vote")).json(&json!({ "value": 1 })))?;
    println!("   likes {}, dislikes {}, my vote {}", vote["likes"], vote["dislikes"], vote["my_vote"]);

    let post = call(http.get(format!("{api}/posts/{post_id}")))?;
    println!(
        "\nPost now has {} comments ({} paid in total).",
        post["comment_count"],
        sol(post["comments_lamports"].as_u64().unwrap_or_default())
    );
    call(http.post(format!("{api}/auth/logout")))?;
    Ok(())
}

/// Sends the request and returns the JSON body, failing on any non-2xx status.
fn call(request: RequestBuilder) -> Result<Value> {
    match call_status(request)? {
        (status, body) if status.is_success() => Ok(body),
        (status, body) => Err(format!("{status}: {body}").into()),
    }
}

fn call_status(request: RequestBuilder) -> Result<(StatusCode, Value)> {
    let response = request.send()?;
    let status = response.status();
    Ok((status, response.json().unwrap_or(Value::Null)))
}

fn text<'a>(value: &'a Value, field: &str) -> Result<&'a str> {
    value[field].as_str().ok_or_else(|| format!("missing \"{field}\" in {value}").into())
}

fn hex_16(hex: &str) -> Result<[u8; 16]> {
    let bytes = (0..hex.len())
        .step_by(2)
        .map(|i| u8::from_str_radix(hex.get(i..i + 2).ok_or("odd hex length")?, 16).map_err(Into::into))
        .collect::<Result<Vec<u8>>>()?;
    bytes.try_into().map_err(|_| "comment id must be 16 bytes".into())
}
