//! Pinata HTTP API. The database keeps the content (profiles, posts, comments,
//! votes, winners); Solana keeps the money. See pinata_back/README.md.
//!
//!   pinata-api               run the server (applies pending migrations first)
//!   pinata-api seed          load the demo data
//!   pinata-api seed --reset  delete the demo data and load it again

mod auth;
mod chain;
mod comments;
mod config;
mod error;
mod pinatas;
mod posts;
mod seed;
mod users;

use std::sync::Arc;

use axum::{
    http::{header::CONTENT_TYPE, HeaderValue, Method},
    routing::{get, post},
    Router,
};
use sqlx::{postgres::PgPoolOptions, PgPool};
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber::EnvFilter;

use crate::{chain::Chain, config::Settings};

/// Shared by every request handler.
#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub chain: Arc<Chain>,
    pub settings: Arc<Settings>,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| "pinata_api=info,tower_http=info".into()),
        )
        .init();
    if let Err(error) = run().await {
        eprintln!("error: {error}");
        std::process::exit(1);
    }
}

async fn run() -> Result<(), Box<dyn std::error::Error>> {
    let settings = Settings::from_env()?;
    let db = PgPoolOptions::new().max_connections(10).connect(&settings.database_url).await?;
    // Migrations are compiled into the binary from api/migrations/
    sqlx::migrate!().run(&db).await?;

    let args: Vec<String> = std::env::args().skip(1).collect();
    match args.iter().map(String::as_str).collect::<Vec<_>>().as_slice() {
        [] => serve(db, settings).await,
        ["seed"] => seed::run(&db, &settings, false).await,
        ["seed", "--reset"] => seed::run(&db, &settings, true).await,
        _ => Err("usage: pinata-api [seed [--reset]]".into()),
    }
}

async fn serve(db: PgPool, settings: Settings) -> Result<(), Box<dyn std::error::Error>> {
    // The web app runs on another origin and sends the session cookie, so CORS
    // must name that origin exactly and allow credentials.
    let cors = CorsLayer::new()
        .allow_origin(settings.frontend_origin.parse::<HeaderValue>()?)
        .allow_methods([Method::GET, Method::POST, Method::PATCH])
        .allow_headers([CONTENT_TYPE])
        .allow_credentials(true);
    let listener = tokio::net::TcpListener::bind(&settings.bind_addr).await?;
    tracing::info!("listening on {}", settings.bind_addr);

    let state = AppState {
        db,
        chain: Arc::new(Chain::new(settings.rpc_url.clone())),
        settings: Arc::new(settings),
    };
    let app = Router::new()
        .route("/health", get(|| async { "ok" }))
        .route("/auth/nonce", post(auth::nonce))
        .route("/auth/verify", post(auth::verify))
        .route("/auth/logout", post(auth::logout))
        .route("/me", get(users::me).patch(users::update_me))
        .route("/users/{username}", get(users::profile))
        .route("/users/{username}/pinata", get(pinatas::creator))
        .route("/posts", get(posts::list).post(posts::create))
        .route("/posts/{id}", get(posts::detail))
        .route("/posts/{id}/vote", post(posts::vote))
        .route("/posts/{id}/comments", post(comments::create))
        .route("/comments/{id}/confirm", post(comments::confirm))
        .route("/pinatas/rules", get(pinatas::rules))
        .route("/pinatas/platform", get(pinatas::platform))
        .route("/pinatas/winners", get(pinatas::recent_winners))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    axum::serve(listener, app)
        .with_graceful_shutdown(async {
            tokio::signal::ctrl_c().await.ok();
        })
        .await?;
    Ok(())
}
