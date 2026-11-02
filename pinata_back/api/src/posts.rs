//! Posts and votes. Posting is free; only signed-in accounts with a profile post.

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    auth::{CurrentUser, MaybeUser},
    comments::{self, CommentView},
    error::{ApiResult, AppError},
    users::Author,
    AppState,
};

const PAGE_SIZE: i64 = 20;

#[derive(Serialize)]
pub struct PostView {
    pub id: Uuid,
    pub content: String,
    pub created_at: DateTime<Utc>,
    pub author: Author,
    pub likes: i32,
    pub dislikes: i32,
    /// The signed-in account's vote: 1, -1, or null
    pub my_vote: Option<i16>,
    pub comment_count: i64,
    /// Sum of the confirmed comment payments
    pub comments_lamports: i64,
}

#[derive(sqlx::FromRow)]
struct PostRow {
    id: Uuid,
    content: String,
    created_at: DateTime<Utc>,
    likes: i32,
    dislikes: i32,
    my_vote: Option<i16>,
    comment_count: i64,
    comments_lamports: i64,
    wallet: String,
    username: Option<String>,
    display_name: Option<String>,
    avatar_url: Option<String>,
}

impl From<PostRow> for PostView {
    fn from(row: PostRow) -> Self {
        Self {
            id: row.id,
            content: row.content,
            created_at: row.created_at,
            author: Author::new(row.wallet, row.username, row.display_name, row.avatar_url),
            likes: row.likes,
            dislikes: row.dislikes,
            my_vote: row.my_vote,
            comment_count: row.comment_count,
            comments_lamports: row.comments_lamports,
        }
    }
}

/// $1: viewer id (or NULL), $2: author username (or NULL), $3: before (or NULL),
/// $4: post id (or NULL), $5: limit
const SELECT_POSTS: &str = "
    SELECT p.id, p.content, p.created_at, p.likes, p.dislikes, v.value AS my_vote,
           COALESCE(c.count, 0) AS comment_count, COALESCE(c.lamports, 0) AS comments_lamports,
           u.wallet, u.username, u.display_name, u.avatar_url
    FROM posts p
    JOIN users u ON u.id = p.author_id
    LEFT JOIN votes v ON v.post_id = p.id AND v.user_id = $1
    LEFT JOIN LATERAL (
        SELECT count(*) AS count, sum(amount_lamports)::bigint AS lamports
        FROM comments WHERE post_id = p.id AND status = 'confirmed'
    ) c ON true
    WHERE ($2::text IS NULL OR u.username = $2)
      AND ($3::timestamptz IS NULL OR p.created_at < $3)
      AND ($4::uuid IS NULL OR p.id = $4)
    ORDER BY p.created_at DESC
    LIMIT $5";

#[derive(Deserialize)]
pub struct ListQuery {
    /// Only this author's posts
    pub author: Option<String>,
    /// Pagination: posts older than this `created_at`
    pub before: Option<DateTime<Utc>>,
    pub limit: Option<i64>,
}

/// Newest first.
pub async fn list(
    State(state): State<AppState>,
    MaybeUser(viewer): MaybeUser,
    Query(query): Query<ListQuery>,
) -> ApiResult<Json<Vec<PostView>>> {
    let rows = sqlx::query_as::<_, PostRow>(SELECT_POSTS)
        .bind(viewer.map(|user| user.id))
        .bind(query.author.map(|author| author.to_lowercase()))
        .bind(query.before)
        .bind(None::<Uuid>)
        .bind(query.limit.unwrap_or(PAGE_SIZE).clamp(1, 100))
        .fetch_all(&state.db)
        .await?;
    Ok(Json(rows.into_iter().map(Into::into).collect()))
}

async fn find(state: &AppState, viewer: Option<Uuid>, id: Uuid) -> ApiResult<PostView> {
    sqlx::query_as::<_, PostRow>(SELECT_POSTS)
        .bind(viewer)
        .bind(None::<String>)
        .bind(None::<DateTime<Utc>>)
        .bind(id)
        .bind(1_i64)
        .fetch_optional(&state.db)
        .await?
        .map(Into::into)
        .ok_or(AppError::NotFound("Post"))
}

#[derive(Serialize)]
pub struct PostDetail {
    #[serde(flatten)]
    pub post: PostView,
    /// Confirmed comments, oldest first
    pub comments: Vec<CommentView>,
}

pub async fn detail(
    State(state): State<AppState>,
    MaybeUser(viewer): MaybeUser,
    Path(id): Path<Uuid>,
) -> ApiResult<Json<PostDetail>> {
    let post = find(&state, viewer.map(|user| user.id), id).await?;
    let comments = comments::confirmed_for_post(&state, id).await?;
    Ok(Json(PostDetail { post, comments }))
}

#[derive(Deserialize)]
pub struct NewPost {
    pub content: String,
}

pub async fn create(
    State(state): State<AppState>,
    CurrentUser(user): CurrentUser,
    Json(input): Json<NewPost>,
) -> ApiResult<(StatusCode, Json<PostView>)> {
    if user.username.is_none() {
        return Err(AppError::Forbidden("Complete your profile before posting.".into()));
    }
    let content = input.content.trim();
    if !(1..=1000).contains(&content.chars().count()) {
        return Err(AppError::bad_request("A post must have 1 to 1000 characters."));
    }
    let id = Uuid::new_v4();
    sqlx::query("INSERT INTO posts (id, author_id, content) VALUES ($1, $2, $3)")
        .bind(id)
        .bind(user.id)
        .bind(content)
        .execute(&state.db)
        .await?;
    Ok((StatusCode::CREATED, Json(find(&state, Some(user.id), id).await?)))
}

#[derive(Deserialize)]
pub struct VoteInput {
    /// 1 (like), -1 (dislike) or 0 (remove the vote)
    pub value: i16,
}

#[derive(Serialize)]
pub struct VoteResult {
    pub likes: i32,
    pub dislikes: i32,
    pub my_vote: Option<i16>,
}

/// The vote and the post counters change in one transaction, so they never disagree.
pub async fn vote(
    State(state): State<AppState>,
    CurrentUser(user): CurrentUser,
    Path(post_id): Path<Uuid>,
    Json(input): Json<VoteInput>,
) -> ApiResult<Json<VoteResult>> {
    if !matches!(input.value, -1..=1) {
        return Err(AppError::bad_request("A vote must be 1, -1 or 0."));
    }
    let mut tx = state.db.begin().await?;
    // Locks the post row so concurrent votes on it are applied one at a time
    let exists: Option<Uuid> = sqlx::query_scalar("SELECT id FROM posts WHERE id = $1 FOR UPDATE")
        .bind(post_id)
        .fetch_optional(&mut *tx)
        .await?;
    exists.ok_or(AppError::NotFound("Post"))?;

    let previous: i16 = sqlx::query_scalar("DELETE FROM votes WHERE post_id = $1 AND user_id = $2 RETURNING value")
        .bind(post_id)
        .bind(user.id)
        .fetch_optional(&mut *tx)
        .await?
        .unwrap_or(0);
    if input.value != 0 {
        sqlx::query("INSERT INTO votes (post_id, user_id, value) VALUES ($1, $2, $3)")
            .bind(post_id)
            .bind(user.id)
            .bind(input.value)
            .execute(&mut *tx)
            .await?;
    }
    let like_delta = i32::from(input.value == 1) - i32::from(previous == 1);
    let dislike_delta = i32::from(input.value == -1) - i32::from(previous == -1);
    let (likes, dislikes): (i32, i32) = sqlx::query_as(
        "UPDATE posts SET likes = likes + $2, dislikes = dislikes + $3 WHERE id = $1 RETURNING likes, dislikes",
    )
    .bind(post_id)
    .bind(like_delta)
    .bind(dislike_delta)
    .fetch_one(&mut *tx)
    .await?;
    tx.commit().await?;

    Ok(Json(VoteResult {
        likes,
        dislikes,
        my_vote: (input.value != 0).then_some(input.value),
    }))
}
