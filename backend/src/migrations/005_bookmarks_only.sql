-- Additive and safe to run on the existing chirp database.
-- This migration does not delete or modify existing posts/users.
CREATE TABLE IF NOT EXISTS bookmarks (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tweet_id UUID NOT NULL,
  tweet_created_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tweet_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_time
  ON bookmarks (user_id, created_at DESC);
