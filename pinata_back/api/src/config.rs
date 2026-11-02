//! Settings read from environment variables (and from `.env`, when present).

use std::env;

pub struct Settings {
    pub database_url: String,
    pub bind_addr: String,
    pub rpc_url: String,
    /// Origin of the web app, the only one allowed to call the API from a browser
    pub frontend_origin: String,
    /// Mark the session cookie `Secure` (HTTPS only). Off for local development.
    pub cookie_secure: bool,
    /// Folder with the demo creators' keypairs, created by `seed`
    pub demo_keys_dir: String,
    /// Wallet that owns the demo profile "samirdourado", so its owner can sign in as it
    pub demo_owner_wallet: Option<String>,
}

impl Settings {
    pub fn from_env() -> Result<Self, String> {
        dotenvy::dotenv().ok();
        Ok(Self {
            database_url: env::var("DATABASE_URL").map_err(|_| "DATABASE_URL is not set")?,
            bind_addr: var_or("BIND_ADDR", "0.0.0.0:8080"),
            rpc_url: var_or("SOLANA_RPC_URL", "https://api.devnet.solana.com"),
            frontend_origin: var_or("FRONTEND_ORIGIN", "http://localhost:3000"),
            cookie_secure: var_or("COOKIE_SECURE", "false") == "true",
            demo_keys_dir: var_or("DEMO_KEYS_DIR", "keys/demo"),
            demo_owner_wallet: env::var("DEMO_OWNER_WALLET").ok().filter(|value| !value.is_empty()),
        })
    }

    /// Host shown in the sign-in message, e.g. "localhost:3000"
    pub fn app_domain(&self) -> &str {
        self.frontend_origin
            .split_once("://")
            .map_or(self.frontend_origin.as_str(), |(_, host)| host)
    }
}

fn var_or(name: &str, default: &str) -> String {
    env::var(name).unwrap_or_else(|_| default.to_string())
}
