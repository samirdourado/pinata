-- Pinata schema. Money lives on Solana; the database keeps the content and a
-- mirror of what happened on-chain, so pages load without RPC calls.

-- Accounts sign in with their wallet, so the wallet is the identity.
-- username stays NULL until the profile is completed.
CREATE TABLE users (
    id           uuid PRIMARY KEY,
    wallet       text NOT NULL UNIQUE,
    username     text UNIQUE CHECK (username ~ '^[a-z0-9_]{3,20}$'),
    display_name text CHECK (char_length(display_name) BETWEEN 2 AND 60),
    bio          text NOT NULL DEFAULT '' CHECK (char_length(bio) <= 160),
    avatar_url   text,
    is_demo      boolean NOT NULL DEFAULT false,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Sign-in challenges: the wallet signs `message`; single use, short-lived.
CREATE TABLE auth_nonces (
    nonce      text PRIMARY KEY,
    wallet     text NOT NULL,
    message    text NOT NULL,
    expires_at timestamptz NOT NULL
);

-- Only a SHA-256 of the session token is stored, so a database leak does not
-- leak usable sessions.
CREATE TABLE sessions (
    token_hash bytea PRIMARY KEY,
    user_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL
);
CREATE INDEX sessions_user_idx ON sessions (user_id);

-- likes/dislikes are counters kept in step with `votes` in the same transaction.
CREATE TABLE posts (
    id         uuid PRIMARY KEY,
    author_id  uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    content    text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
    likes      integer NOT NULL DEFAULT 0 CHECK (likes >= 0),
    dislikes   integer NOT NULL DEFAULT 0 CHECK (dislikes >= 0),
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX posts_created_at_idx ON posts (created_at DESC);
CREATE INDEX posts_author_idx ON posts (author_id, created_at DESC);

-- Anyone comments by paying, with or without an account. The paying wallet is
-- the commenter: when its owner signs in later, every past comment shows the
-- profile through users.wallet, with nothing to migrate.
-- id is also the comment_id sent on-chain, which ties the payment to the comment.
CREATE TABLE comments (
    id                   uuid PRIMARY KEY,
    post_id              uuid NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
    commenter_wallet     text NOT NULL,
    content              text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
    amount_lamports      bigint NOT NULL CHECK (amount_lamports > 0),
    status               text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    -- Creator Piñata round the payment is meant for (NULL in demo data)
    creator_pinata_round bigint,
    -- NULL in demo data, which was never paid on-chain
    tx_signature         text UNIQUE,
    created_at           timestamptz NOT NULL DEFAULT now(),
    confirmed_at         timestamptz
);
CREATE INDEX comments_post_idx ON comments (post_id, created_at) WHERE status = 'confirmed';
CREATE INDEX comments_wallet_idx ON comments (commenter_wallet);

CREATE TABLE votes (
    post_id    uuid NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
    user_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    value      smallint NOT NULL CHECK (value IN (-1, 1)),
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (post_id, user_id)
);

-- Settled Piñata accounts are closed on-chain, so their history lives here.
-- owner_wallet: creator wallet, or the Config address for the platform Piñata.
CREATE TABLE pinata_winners (
    id             uuid PRIMARY KEY,
    kind           text NOT NULL CHECK (kind IN ('creator', 'platform')),
    owner_wallet   text NOT NULL,
    round          bigint, -- NULL in demo data
    winner_wallet  text NOT NULL,
    prize_lamports bigint NOT NULL CHECK (prize_lamports >= 0),
    tx_signature   text,
    won_at         timestamptz NOT NULL,
    UNIQUE (kind, owner_wallet, round, winner_wallet)
);
CREATE INDEX pinata_winners_owner_idx ON pinata_winners (owner_wallet, won_at DESC);
CREATE INDEX pinata_winners_won_at_idx ON pinata_winners (won_at DESC);
