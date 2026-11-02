//! Demo data, from the web app's `data/mockData.ts`. Run with `pinata-api seed`
//! (`--reset` deletes the demo data first).
//!
//! Each demo profile gets a wallet whose keypair is saved in `keys/demo/`
//! (git-ignored), so the CLI can open real Devnet Piñatas for them. The profile
//! "samirdourado" uses DEMO_OWNER_WALLET when it is set, so its owner signs in
//! as it. Demo comments and winners were never paid on-chain: they have no
//! transaction signature.

use std::{fs, path::Path};

use chrono::{Duration, Utc};
use solana_keypair::{read_keypair_file, write_keypair_file, Keypair};
use solana_signer::Signer;
use sqlx::PgPool;
use uuid::Uuid;

use crate::config::Settings;

const MILLI_SOL: i64 = 1_000_000;

struct DemoProfile {
    username: &'static str,
    name: &'static str,
    avatar_seed: &'static str,
    bio: &'static str,
    /// The web app's "member since" month
    member_since: &'static str,
}

const PROFILES: [DemoProfile; 7] = [
    DemoProfile { username: "samirdourado", name: "Samir Dourado", avatar_seed: "Samir", bio: "Building healthier communities in the Solana ecosystem.", member_since: "2025-03-01" },
    DemoProfile { username: "superteambr", name: "Superteam Brasil", avatar_seed: "Superteam", bio: "Supporting builders and talent throughout the Solana ecosystem in Brazil.", member_since: "2025-01-01" },
    DemoProfile { username: "cryptodev", name: "CryptoDev", avatar_seed: "CryptoDev", bio: "Developer exploring on-chain products and social experiences.", member_since: "2025-04-01" },
    DemoProfile { username: "web3builder", name: "Web3Builder", avatar_seed: "Web3Builder", bio: "Sharing product and community lessons from the Web3 ecosystem.", member_since: "2025-02-01" },
    DemoProfile { username: "anasouza", name: "Ana Souza", avatar_seed: "Ana", bio: "Product designer focused on communities and open experiences.", member_since: "2025-05-01" },
    DemoProfile { username: "solanafan", name: "SolanaFan", avatar_seed: "SolanaFan", bio: "Learning, building, and sharing in the Solana ecosystem.", member_since: "2025-06-01" },
    DemoProfile { username: "produtodao", name: "ProdutoDAO", avatar_seed: "ProdutoDAO", bio: "Product research, open feedback, and tools for builders.", member_since: "2025-07-01" },
];

struct DemoPost {
    author: &'static str,
    content: &'static str,
    likes: i32,
    dislikes: i32,
    minutes_ago: i64,
    /// (commenter, content, amount in thousandths of SOL, minutes ago)
    comments: &'static [(&'static str, &'static str, i64, i64)],
}

const POSTS: [DemoPost; 8] = [
    DemoPost {
        author: "samirdourado",
        content: "What do you think about using micropayments in social networks to eliminate bots and spam? Does the Pay-to-Comment model make sense for creators?",
        likes: 42, dislikes: 3, minutes_ago: 120,
        comments: &[
            ("cryptodev", "I believe the financial barrier removes 99% of bots. The key is keeping the fee low enough (a few cents) to avoid repelling real users.", 5, 60),
            ("web3builder", "The Piñata raffle at the end of the week is a great incentive for engagement!", 5, 30),
            ("anasouza", "The fee can work as a signal of intent as long as the amount stays accessible and transparent.", 400, 22),
            ("solanafan", "It would also be helpful to show exactly where each share of the payment goes. That builds trust.", 400, 18),
            ("produtodao", "A small free daily allowance alongside the fee could also welcome new users.", 400, 12),
            ("superteambr", "Transparency in the rules and allocation will be essential for the community to participate.", 400, 7),
        ],
    },
    DemoPost {
        author: "superteambr",
        content: "The Colosseum Hackathon has started! What projects are you building in the Solana ecosystem?",
        likes: 128, dislikes: 2, minutes_ago: 300,
        comments: &[
            ("samirdourado", "I'm building a community experience focused on conversations that truly add value.", 80, 180),
            ("anasouza", "We're building tools to support local builders. What kind of meetup would be most useful?", 200, 120),
            ("produtodao", "Short product review sessions often spark really useful conversations.", 150, 60),
            ("solanafan", "A track for newcomers would likely have strong demand too.", 100, 40),
        ],
    },
    DemoPost {
        author: "samirdourado",
        content: "A good online conversation deserves more than a quick reaction. What mechanisms help reward people who contribute context and experience?",
        likes: 86, dislikes: 4, minutes_ago: 1_380,
        comments: &[],
    },
    DemoPost {
        author: "cryptodev",
        content: "I'm testing a reputation model that combines votes, response quality, and recurring participation. How can we prevent a single metric from being manipulated?",
        likes: 64, dislikes: 2, minutes_ago: 1_560,
        comments: &[
            ("samirdourado", "Reputation needs to be explainable so people understand how to improve.", 20, 1_440),
            ("anasouza", "I would separate quality and frequency so we don't only favor people who live on the platform.", 25, 1_200),
        ],
    },
    DemoPost {
        author: "web3builder",
        content: "Which metrics would you track to know if a community is truly healthy beyond just member count?",
        likes: 64, dislikes: 2, minutes_ago: 3_000,
        comments: &[
            ("web3builder", "Retention of contributors and answer quality are good signals.", 15, 2_880),
            ("solanafan", "It also helps to track how many people return to answer after the first interaction.", 15, 1_440),
        ],
    },
    DemoPost {
        author: "anasouza",
        content: "Which indicators show that a community is welcoming newcomers effectively?",
        likes: 39, dislikes: 2, minutes_ago: 4_320,
        comments: &[
            ("samirdourado", "Time to first response and how many different people help are good starting points.", 30, 2_880),
            ("cryptodev", "A clear welcome message with straightforward next steps helps a lot.", 20, 1_440),
        ],
    },
    DemoPost {
        author: "solanafan",
        content: "What feature would make you participate more in a builder community?",
        likes: 32, dislikes: 3, minutes_ago: 5_760,
        comments: &[
            ("produtodao", "A board for code and product review requests would be very useful.", 10, 4_320),
            ("samirdourado", "Finding partners to test ideas also lowers the barrier to entry significantly.", 15, 2_880),
        ],
    },
    DemoPost {
        author: "produtodao",
        content: "How do you prioritize user feedback when the team is still small?",
        likes: 32, dislikes: 3, minutes_ago: 7_200,
        comments: &[
            ("anasouza", "I group issues by recurring problem and talk with the most affected users before estimating effort.", 20, 5_760),
            ("web3builder", "A public changelog helps close the loop with the people who sent the suggestion.", 20, 4_320),
        ],
    },
];

/// (Piñata owner, winner, prize in thousandths of SOL, days ago). Owner "platform" is the platform Piñata.
const WINNERS: [(&str, &str, i64, i64); 5] = [
    ("samirdourado", "cryptodev", 180, 30),
    ("samirdourado", "web3builder", 120, 38),
    ("platform", "anasouza", 420, 7),
    ("platform", "cryptodev", 280, 7),
    ("platform", "web3builder", 190, 7),
];

pub async fn run(db: &PgPool, settings: &Settings, reset: bool) -> Result<(), Box<dyn std::error::Error>> {
    let mut tx = db.begin().await?;
    if reset {
        sqlx::query("DELETE FROM comments WHERE commenter_wallet IN (SELECT wallet FROM users WHERE is_demo)")
            .execute(&mut *tx)
            .await?;
        sqlx::query("DELETE FROM pinata_winners WHERE round IS NULL").execute(&mut *tx).await?;
        // Cascades to the demo posts, their comments and votes, and sessions
        sqlx::query("DELETE FROM users WHERE is_demo").execute(&mut *tx).await?;
    } else {
        let seeded: bool = sqlx::query_scalar("SELECT EXISTS (SELECT 1 FROM users WHERE is_demo)")
            .fetch_one(&mut *tx)
            .await?;
        if seeded {
            println!("Demo data already present. Use `seed --reset` to recreate it.");
            return Ok(());
        }
    }

    let now = Utc::now();
    let mut wallets = std::collections::HashMap::new();
    for profile in &PROFILES {
        let wallet = demo_wallet(settings, profile.username)?;
        let member_since = format!("{}T12:00:00Z", profile.member_since).parse::<chrono::DateTime<Utc>>()?;
        // ON CONFLICT: the owner may have signed in with DEMO_OWNER_WALLET before seeding
        sqlx::query(
            "INSERT INTO users (id, wallet, username, display_name, bio, avatar_url, is_demo, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, true, $7)
             ON CONFLICT (wallet) DO UPDATE SET username = $3, display_name = $4, bio = $5,
                 avatar_url = $6, is_demo = true, created_at = $7",
        )
        .bind(Uuid::new_v4())
        .bind(&wallet)
        .bind(profile.username)
        .bind(profile.name)
        .bind(profile.bio)
        .bind(format!("https://api.dicebear.com/7.x/bottts/svg?seed={}", profile.avatar_seed))
        .bind(member_since)
        .execute(&mut *tx)
        .await?;
        wallets.insert(profile.username, wallet);
    }

    for post in &POSTS {
        let post_id = Uuid::new_v4();
        sqlx::query(
            "INSERT INTO posts (id, author_id, content, likes, dislikes, created_at)
             SELECT $1, id, $3, $4, $5, $6 FROM users WHERE username = $2",
        )
        .bind(post_id)
        .bind(post.author)
        .bind(post.content)
        .bind(post.likes)
        .bind(post.dislikes)
        .bind(now - Duration::minutes(post.minutes_ago))
        .execute(&mut *tx)
        .await?;
        for &(commenter, content, milli_sol, minutes_ago) in post.comments {
            let created_at = now - Duration::minutes(minutes_ago);
            sqlx::query(
                "INSERT INTO comments (id, post_id, commenter_wallet, content, amount_lamports, status, created_at, confirmed_at)
                 VALUES ($1, $2, $3, $4, $5, 'confirmed', $6, $6)",
            )
            .bind(Uuid::new_v4())
            .bind(post_id)
            .bind(&wallets[commenter])
            .bind(content)
            .bind(milli_sol * MILLI_SOL)
            .bind(created_at)
            .execute(&mut *tx)
            .await?;
        }
    }

    for (owner, winner, milli_sol, days_ago) in WINNERS {
        let (kind, owner_wallet) = match owner {
            "platform" => ("platform", pinata::pda::config().to_string()),
            creator => ("creator", wallets[creator].clone()),
        };
        sqlx::query(
            "INSERT INTO pinata_winners (id, kind, owner_wallet, winner_wallet, prize_lamports, won_at)
             VALUES ($1, $2, $3, $4, $5, $6)",
        )
        .bind(Uuid::new_v4())
        .bind(kind)
        .bind(owner_wallet)
        .bind(&wallets[winner])
        .bind(milli_sol * MILLI_SOL)
        .bind(now - Duration::days(days_ago))
        .execute(&mut *tx)
        .await?;
    }
    tx.commit().await?;

    println!(
        "Seeded {} profiles, {} posts, {} comments and {} winners.",
        PROFILES.len(),
        POSTS.len(),
        POSTS.iter().map(|post| post.comments.len()).sum::<usize>(),
        WINNERS.len()
    );
    for profile in &PROFILES {
        println!("  @{:<13} {}", profile.username, wallets[profile.username]);
    }
    Ok(())
}

/// The demo profile's wallet: DEMO_OWNER_WALLET for "samirdourado" when set,
/// otherwise a keypair kept in keys/demo/<username>.json (created on first run).
fn demo_wallet(settings: &Settings, username: &str) -> Result<String, Box<dyn std::error::Error>> {
    if username == "samirdourado" {
        if let Some(wallet) = &settings.demo_owner_wallet {
            return Ok(wallet.clone());
        }
    }
    let path = Path::new(&settings.demo_keys_dir).join(format!("{username}.json"));
    let keypair = if path.exists() {
        read_keypair_file(&path)?
    } else {
        fs::create_dir_all(&settings.demo_keys_dir)?;
        let keypair = Keypair::new();
        write_keypair_file(&keypair, &path)?;
        keypair
    };
    Ok(keypair.pubkey().to_string())
}
