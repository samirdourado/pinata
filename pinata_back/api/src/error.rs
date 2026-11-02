//! API errors: every handler returns `ApiResult`, and errors become JSON
//! responses like `{"error": "..."}` with the matching HTTP status.

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

#[derive(Debug)]
pub enum AppError {
    BadRequest(String),
    Unauthorized,
    Forbidden(String),
    NotFound(&'static str),
    Conflict(String),
    /// The Solana RPC failed or timed out
    Upstream(String),
    Internal(String),
}

pub type ApiResult<T> = Result<T, AppError>;

impl AppError {
    pub fn bad_request(message: impl Into<String>) -> Self {
        Self::BadRequest(message.into())
    }

    pub fn conflict(message: impl Into<String>) -> Self {
        Self::Conflict(message.into())
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            Self::BadRequest(message) => (StatusCode::BAD_REQUEST, message),
            Self::Unauthorized => (StatusCode::UNAUTHORIZED, "Sign in with your wallet first.".into()),
            Self::Forbidden(message) => (StatusCode::FORBIDDEN, message),
            Self::NotFound(what) => (StatusCode::NOT_FOUND, format!("{what} not found.")),
            Self::Conflict(message) => (StatusCode::CONFLICT, message),
            Self::Upstream(message) => {
                tracing::warn!("solana rpc: {message}");
                (StatusCode::BAD_GATEWAY, "The Solana network did not answer. Try again.".into())
            }
            Self::Internal(message) => {
                // Details go to the log, never to the client
                tracing::error!("{message}");
                (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong.".into())
            }
        };
        (status, Json(json!({ "error": message }))).into_response()
    }
}

impl From<sqlx::Error> for AppError {
    fn from(error: sqlx::Error) -> Self {
        Self::Internal(format!("database: {error}"))
    }
}

/// True when the error is a unique constraint violation (e.g. a taken username).
pub fn is_unique_violation(error: &sqlx::Error) -> bool {
    matches!(error, sqlx::Error::Database(db) if db.is_unique_violation())
}
