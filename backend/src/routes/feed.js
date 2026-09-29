import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { cacheGetJSON, cacheSetJSON } from '../db/redis.js';

const router = Router();

// GET /api/feed?mode=pull|fanout&cursor=<ISO timestamp>&limit=20
router.get('/', requireAuth, async (req, res) => {
  const mode = req.query.mode === 'fanout' ? 'fanout' : 'pull';
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const cursor = req.query.cursor || new Date().toISOString();
  const cacheKey = `feed:${mode}:${req.userId}:${cursor}:${limit}`;

  const cached = await cacheGetJSON(cacheKey);
  if (cached) return res.json({ ...cached, cached: true });

  const start = process.hrtime.bigint();
  let rows;
  if (mode === 'pull') {
    // Read-time join across follows + tweets. No precompute cost, but heavier read.
    ({ rows } = await query(
      `SELECT t.* FROM tweets t
       WHERE (t.user_id IN (SELECT followee_id FROM follows WHERE follower_id = $1) OR t.user_id = $1)
         AND t.created_at < $2 AND t.deleted_at IS NULL
       ORDER BY t.created_at DESC LIMIT $3`,
      [req.userId, cursor, limit]
    ));
  } else {
    // Precomputed at write-time via the fanout_tweet() trigger. Cheap read, costlier write.
    ({ rows } = await query(
      `SELECT t.* FROM feed_entries f
       JOIN tweets t ON t.id = f.tweet_id AND t.created_at = f.tweet_created_at
       WHERE f.owner_id = $1 AND f.tweet_created_at < $2 AND t.deleted_at IS NULL
       ORDER BY f.tweet_created_at DESC LIMIT $3`,
      [req.userId, cursor, limit]
    ));
  }
  const tookMs = Number(process.hrtime.bigint() - start) / 1e6;

  const payload = {
    mode, tookMs,
    nextCursor: rows.length ? rows[rows.length - 1].created_at : null,
    tweets: rows.map(t => ({
      id: t.id, userId: t.user_id, content: t.content, parentTweetId: t.parent_tweet_id,
      likeCount: t.like_count, retweetCount: t.retweet_count, replyCount: t.reply_count,
      createdAt: t.created_at,
    })),
  };
  await cacheSetJSON(cacheKey, payload, 30); // short TTL — feeds go stale fast
  res.json(payload);
});

// GET /api/feed/benchmark — runs both modes back to back for your report
router.get('/benchmark', requireAuth, async (req, res) => {
  const cursor = new Date().toISOString();
  const runs = {};
  for (const mode of ['pull', 'fanout']) {
    const start = process.hrtime.bigint();
    if (mode === 'pull') {
      await query(
        `SELECT t.id FROM tweets t
         WHERE (t.user_id IN (SELECT followee_id FROM follows WHERE follower_id = $1) OR t.user_id = $1)
           AND t.created_at < $2 ORDER BY t.created_at DESC LIMIT 20`,
        [req.userId, cursor]
      );
    } else {
      await query(
        `SELECT tweet_id FROM feed_entries WHERE owner_id = $1 AND tweet_created_at < $2
         ORDER BY tweet_created_at DESC LIMIT 20`,
        [req.userId, cursor]
      );
    }
    runs[mode] = Number(process.hrtime.bigint() - start) / 1e6;
  }
  res.json({ tookMs: runs, note: 'Run this after seeding a realistic amount of data for a meaningful comparison.' });
});

export default router;
