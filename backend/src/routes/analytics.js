import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Rank the current user's tweets by engagement (window function)
router.get('/my-rankings', requireAuth, async (req, res) => {
  const { rows } = await query(
    `SELECT id, content, like_count, retweet_count,
            RANK() OVER (ORDER BY like_count DESC) AS like_rank,
            RANK() OVER (ORDER BY retweet_count DESC) AS retweet_rank
     FROM tweets WHERE user_id = $1 AND deleted_at IS NULL
     ORDER BY like_rank`,
    [req.userId]
  );
  res.json(rows);
});

// Global follower leaderboard (window function)
router.get('/leaderboard', async (_req, res) => {
  const { rows } = await query(
    `SELECT id, username, display_name, followers_count,
            RANK() OVER (ORDER BY followers_count DESC) AS follower_rank
     FROM users WHERE deleted_at IS NULL
     ORDER BY follower_rank LIMIT 20`
  );
  res.json(rows);
});

// Top tweets this week — served straight from the materialized view
router.get('/top-tweets', async (_req, res) => {
  const { rows } = await query(`SELECT * FROM top_tweets_week ORDER BY engagement_score DESC`);
  res.json(rows);
});

export default router;
