-- Additive migration: post images and persistent bookmarks. Safe to run more than once.
ALTER TABLE tweets ADD COLUMN IF NOT EXISTS image_urls TEXT[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS bookmarks (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tweet_id UUID NOT NULL,
  tweet_created_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tweet_id)
);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_time ON bookmarks (user_id, created_at DESC);

-- Older databases may still have the original notification type constraint.
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('post','like','follow','retweet','reply','mention'));
