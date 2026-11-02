//! Accounts and public profiles.

use axum::{
    extract::{Path, State},
    Json,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    auth::CurrentUser,
    error::{is_unique_violation, ApiResult, AppError},
    AppState,
};

#[derive(sqlx::FromRow, Clone)]
pub struct UserRow {
    pub id: Uuid,
    pub wallet: String,
    pub username: Option<String>,
    pub display_name: Option<String>,
    pub bio: String,
    pub avatar_url: Option<String>,
    pub created_at: DateTime<Utc>,
}

/// The signed-in account.
#[derive(Serialize)]
pub struct Me {
    pub id: Uuid,
    pub wallet: String,
    pub username: Option<String>,
    pub display_name: Option<String>,
    pub bio: String,
    pub avatar_url: String,
    pub created_at: DateTime<Utc>,
    /// True until a username and display name are chosen; posting needs them
    pub needs_profile: bool,
}

impl From<UserRow> for Me {
    fn from(user: UserRow) -> Self {
        Self {
            avatar_url: avatar(user.avatar_url.as_deref(), user.username.as_deref(), &user.wallet),
            needs_profile: user.username.is_none() || user.display_name.is_none(),
            id: user.id,
            wallet: user.wallet,
            username: user.username,
            display_name: user.display_name,
            bio: user.bio,
            created_at: user.created_at,
        }
    }
}

/// Who wrote a post or comment. Anonymous commenters have only a wallet.
#[derive(Serialize)]
pub struct Author {
    pub wallet: String,
    pub username: Option<String>,
    pub display_name: Option<String>,
    pub avatar_url: String,
}

impl Author {
    pub fn new(
        wallet: String,
        username: Option<String>,
        display_name: Option<String>,
        avatar_url: Option<String>,
    ) -> Self {
        Self {
            avatar_url: avatar(avatar_url.as_deref(), username.as_deref(), &wallet),
            wallet,
            username,
            display_name,
        }
    }
}

/// Stored avatar, or the generated one the web app already uses.
pub fn avatar(stored: Option<&str>, username: Option<&str>, wallet: &str) -> String {
    stored.map(str::to_string).unwrap_or_else(|| {
        format!("https://api.dicebear.com/7.x/bottts/svg?seed={}", username.unwrap_or(wallet))
    })
}

#[derive(Serialize)]
pub struct Profile {
    #[serde(flatten)]
    pub author: Author,
    pub bio: String,
    pub created_at: DateTime<Utc>,
}

pub async fn me(CurrentUser(user): CurrentUser) -> Json<Me> {
    Json(user.into())
}

#[derive(Deserialize)]
pub struct ProfileUpdate {
    pub username: String,
    pub display_name: String,
    #[serde(default)]
    pub bio: String,
}

/// Same rules as the web app's forms.
fn validate_profile(input: &ProfileUpdate) -> ApiResult<(String, String, String)> {
    let username = input.username.trim().to_lowercase();
    if !(3..=20).contains(&username.len())
        || !username.chars().all(|c| c.is_ascii_alphanumeric() || c == '_')
    {
        return Err(AppError::bad_request(
            "Username must have 3 to 20 characters: letters, numbers and underscores.",
        ));
    }
    let display_name = input.display_name.trim().to_string();
    if !(2..=60).contains(&display_name.chars().count()) {
        return Err(AppError::bad_request("Name must have 2 to 60 characters."));
    }
    let bio = input.bio.trim().to_string();
    if bio.chars().count() > 160 {
        return Err(AppError::bad_request("Bio must be 160 characters or fewer."));
    }
    Ok((username, display_name, bio))
}

pub async fn update_me(
    State(state): State<AppState>,
    CurrentUser(user): CurrentUser,
    Json(input): Json<ProfileUpdate>,
) -> ApiResult<Json<Me>> {
    let (username, display_name, bio) = validate_profile(&input)?;
    let updated = sqlx::query_as::<_, UserRow>(
        "UPDATE users SET username = $2, display_name = $3, bio = $4, updated_at = now()
         WHERE id = $1
         RETURNING id, wallet, username, display_name, bio, avatar_url, created_at",
    )
    .bind(user.id)
    .bind(&username)
    .bind(&display_name)
    .bind(&bio)
    .fetch_one(&state.db)
    .await
    .map_err(|error| {
        if is_unique_violation(&error) {
            AppError::conflict("This username is already taken.")
        } else {
            error.into()
        }
    })?;
    Ok(Json(updated.into()))
}

pub async fn find_by_username(state: &AppState, username: &str) -> ApiResult<UserRow> {
    sqlx::query_as::<_, UserRow>(
        "SELECT id, wallet, username, display_name, bio, avatar_url, created_at
         FROM users WHERE username = $1",
    )
    .bind(username.to_lowercase())
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound("Profile"))
}

pub async fn profile(State(state): State<AppState>, Path(username): Path<String>) -> ApiResult<Json<Profile>> {
    let user = find_by_username(&state, &username).await?;
    Ok(Json(Profile {
        author: Author::new(user.wallet, user.username, user.display_name, user.avatar_url),
        bio: user.bio,
        created_at: user.created_at,
    }))
}
