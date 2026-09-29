-- ============================================================
-- CHIRP — PostgreSQL Schema (Primary DB)
-- Every enhanced feature from PROJECT.md lives in this file.
-- Run with: psql -U postgres -d chirp -f 001_init.sql
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- fuzzy username search

-- ---------- USERS ----------
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username        VARCHAR(20) UNIQUE NOT NULL CHECK (username ~ '^[a-zA-Z0-9_]{3,20}$'),
  display_name    VARCHAR(50) NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  bio             VARCHAR(160) DEFAULT '',
  location        VARCHAR(100) DEFAULT '',
  website         VARCHAR(100) DEFAULT '',
  avatar_url      TEXT,
  banner_url      TEXT,
  is_verified     BOOLEAN DEFAULT FALSE,
  -- denormalized counters, kept correct only via triggers below
  followers_count INTEGER NOT NULL DEFAULT 0,
  following_count INTEGER NOT NULL DEFAULT 0,
  posts_count     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ  -- soft delete
);

CREATE INDEX idx_users_username_trgm ON users USING GIN (username gin_trgm_ops);

-- ---------- TWEETS (partitioned by month) ----------
-- Novelty: range partitioning on created_at for scalability.
CREATE TABLE tweets (
  id               UUID DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content          VARCHAR(280) NOT NULL CHECK (char_length(content) > 0),
  parent_tweet_id  UUID,                -- self-reference, no FK constraint (cross-partition) — enforced in app layer + trigger
  is_reply         BOOLEAN NOT NULL DEFAULT FALSE,
  like_count       INTEGER NOT NULL DEFAULT 0,
  retweet_count    INTEGER NOT NULL DEFAULT 0,
  reply_count      INTEGER NOT NULL DEFAULT 0,
  search_vector    TSVECTOR,            -- full text search
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ,
  PRIMARY KEY (id, created_at)          -- partition key must be part of PK
) PARTITION BY RANGE (created_at);

-- Helper: auto-create the next N monthly partitions
CREATE OR REPLACE FUNCTION create_tweets_partition(month_start DATE)
RETURNS VOID AS $$
DECLARE
  part_name TEXT := 'tweets_' || to_char(month_start, 'YYYY_MM');
  month_end DATE := (month_start + INTERVAL '1 month')::date;
BEGIN
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF tweets FOR VALUES FROM (%L) TO (%L);',
    part_name, month_start, month_end
  );
END;
$$ LANGUAGE plpgsql;

-- Create partitions for the last 2 months, this month, and next 2 months (demo range)
DO $$
DECLARE d DATE;
BEGIN
  FOR d IN SELECT generate_series(date_trunc('month', now()) - INTERVAL '2 month',
                                   date_trunc('month', now()) + INTERVAL '2 month',
                                   INTERVAL '1 month')::date
  LOOP
    PERFORM create_tweets_partition(d);
  END LOOP;
END $$;

CREATE INDEX idx_tweets_user_created ON tweets (user_id, created_at DESC);
CREATE INDEX idx_tweets_parent ON tweets (parent_tweet_id);
CREATE INDEX idx_tweets_search ON tweets USING GIN (search_vector);

-- Keep search_vector in sync
CREATE OR REPLACE FUNCTION tweets_search_vector_update() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tweets_search_vector
BEFORE INSERT OR UPDATE OF content ON tweets
FOR EACH ROW EXECUTE FUNCTION tweets_search_vector_update();

-- ---------- FOLLOWS (composite PK, self-follow blocked) ----------
CREATE TABLE follows (
  follower_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id),
  CHECK (follower_id <> followee_id)
);
CREATE INDEX idx_follows_followee ON follows (followee_id);

-- ---------- LIKES ----------
CREATE TABLE likes (
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tweet_id      UUID NOT NULL,
  tweet_created_at TIMESTAMPTZ NOT NULL, -- needed to join partitioned tweets table
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tweet_id)
);

-- ---------- RETWEETS (supports quote-tweet content) ----------
CREATE TABLE retweets (
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tweet_id          UUID NOT NULL,
  tweet_created_at  TIMESTAMPTZ NOT NULL,
  quote_content     VARCHAR(280),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tweet_id)
);

-- ---------- HASHTAGS ----------
CREATE TABLE hashtags (
  id        SERIAL PRIMARY KEY,
  tag       VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE tweet_hashtags (
  tweet_id          UUID NOT NULL,
  tweet_created_at  TIMESTAMPTZ NOT NULL,
  hashtag_id        INTEGER NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
  PRIMARY KEY (tweet_id, hashtag_id)
);

-- ---------- NOTIFICATIONS ----------
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- recipient
  actor_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- who did it
  type        VARCHAR(20) NOT NULL CHECK (type IN ('like','follow','retweet','reply','mention')),
  tweet_id    UUID,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON notifications (user_id, is_read, created_at DESC);

-- ---------- PRECOMPUTED FEED (fan-out-on-write target table) ----------
CREATE TABLE feed_entries (
  owner_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- whose home feed
  tweet_id          UUID NOT NULL,
  tweet_created_at  TIMESTAMPTZ NOT NULL,
  author_id         UUID NOT NULL,
  inserted_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, tweet_id)
);
CREATE INDEX idx_feed_owner_time ON feed_entries (owner_id, tweet_created_at DESC);

-- ============================================================
-- TRIGGERS — denormalized counters (novelty #9)
-- ============================================================

CREATE OR REPLACE FUNCTION trg_incr_followers() RETURNS TRIGGER AS $$
BEGIN
  UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  UPDATE users SET followers_count = followers_count + 1 WHERE id = NEW.followee_id;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_follows_insert AFTER INSERT ON follows
FOR EACH ROW EXECUTE FUNCTION trg_incr_followers();

CREATE OR REPLACE FUNCTION trg_decr_followers() RETURNS TRIGGER AS $$
BEGIN
  UPDATE users SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
  UPDATE users SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = OLD.followee_id;
  RETURN OLD;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_follows_delete AFTER DELETE ON follows
FOR EACH ROW EXECUTE FUNCTION trg_decr_followers();

CREATE OR REPLACE FUNCTION trg_incr_posts() RETURNS TRIGGER AS $$
BEGIN
  UPDATE users SET posts_count = posts_count + 1 WHERE id = NEW.user_id;
  IF NEW.parent_tweet_id IS NOT NULL THEN
    UPDATE tweets SET reply_count = reply_count + 1 WHERE id = NEW.parent_tweet_id;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tweets_insert AFTER INSERT ON tweets
FOR EACH ROW EXECUTE FUNCTION trg_incr_posts();

CREATE OR REPLACE FUNCTION trg_like_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tweets SET like_count = like_count + 1 WHERE id = NEW.tweet_id;
    RETURN NEW;
  ELSE
    UPDATE tweets SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.tweet_id;
    RETURN OLD;
  END IF;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_likes_insert AFTER INSERT ON likes
FOR EACH ROW EXECUTE FUNCTION trg_like_count();
CREATE TRIGGER trg_likes_delete AFTER DELETE ON likes
FOR EACH ROW EXECUTE FUNCTION trg_like_count();

CREATE OR REPLACE FUNCTION trg_retweet_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tweets SET retweet_count = retweet_count + 1 WHERE id = NEW.tweet_id;
    RETURN NEW;
  ELSE
    UPDATE tweets SET retweet_count = GREATEST(retweet_count - 1, 0) WHERE id = OLD.tweet_id;
    RETURN OLD;
  END IF;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_retweets_insert AFTER INSERT ON retweets
FOR EACH ROW EXECUTE FUNCTION trg_retweet_count();
CREATE TRIGGER trg_retweets_delete AFTER DELETE ON retweets
FOR EACH ROW EXECUTE FUNCTION trg_retweet_count();

-- ============================================================
-- FAN-OUT ON WRITE — push a new tweet into every follower's feed
-- ============================================================
CREATE OR REPLACE FUNCTION fanout_tweet() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO feed_entries (owner_id, tweet_id, tweet_created_at, author_id)
  SELECT follower_id, NEW.id, NEW.created_at, NEW.user_id
  FROM follows WHERE followee_id = NEW.user_id;

  -- authors also see their own tweets in their home feed
  INSERT INTO feed_entries (owner_id, tweet_id, tweet_created_at, author_id)
  VALUES (NEW.user_id, NEW.id, NEW.created_at, NEW.user_id)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tweets_fanout AFTER INSERT ON tweets
FOR EACH ROW EXECUTE FUNCTION fanout_tweet();

-- ============================================================
-- MATERIALIZED VIEW — top tweets this week (novelty #3)
-- Refresh on a schedule (see src/scripts/refreshMatViews.js / cron)
-- ============================================================
CREATE MATERIALIZED VIEW top_tweets_week AS
SELECT t.id, t.user_id, t.content, t.like_count, t.retweet_count, t.reply_count, t.created_at,
       (t.like_count * 1 + t.retweet_count * 2 + t.reply_count * 1.5) AS engagement_score
FROM tweets t
WHERE t.created_at > now() - INTERVAL '7 days'
  AND t.deleted_at IS NULL
ORDER BY engagement_score DESC
LIMIT 50;

CREATE UNIQUE INDEX idx_top_tweets_week_id ON top_tweets_week (id);

-- ============================================================
-- WINDOW FUNCTIONS — example query, not a stored object.
-- (kept here as reference; used directly in routes/analytics.js)
-- ============================================================
-- Rank a user's own tweets by engagement, and rank all users by followers:
--
-- SELECT id, content, like_count,
--        RANK() OVER (ORDER BY like_count DESC) AS like_rank
-- FROM tweets WHERE user_id = $1;
--
-- SELECT id, username, followers_count,
--        RANK() OVER (ORDER BY followers_count DESC) AS follower_rank
-- FROM users;
