import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);


// Return only bookmarks explicitly saved by the signed-in user.
router.get('/', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT t.id, t.user_id, t.content, t.parent_tweet_id,
              t.like_count, t.retweet_count, t.reply_count, t.created_at,
              COALESCE(t.image_urls, ARRAY[]::TEXT[]) AS image_urls,
              u.username, u.display_name, u.avatar_url, u.is_verified,
              EXISTS (
                SELECT 1 FROM likes l
                WHERE l.user_id = $1 AND l.tweet_id = t.id
              ) AS is_liked,
              TRUE AS is_bookmarked
       FROM bookmarks b
       JOIN tweets t
         ON t.id = b.tweet_id AND t.created_at = b.tweet_created_at
       JOIN users u ON u.id = t.user_id
       WHERE b.user_id = $1 AND t.deleted_at IS NULL
       ORDER BY b.created_at DESC`,
      [req.userId]
    );

    const origin = `http://localhost:${process.env.PORT || 5000}`;
    res.json({
      bookmarks: rows.map((t) => ({
        id: t.id,
        userId: t.user_id,
        content: t.content,
        parentTweetId: t.parent_tweet_id,
        likes: t.like_count || 0,
        reposts: t.retweet_count || 0,
        comments: t.reply_count || 0,
        createdAt: t.created_at,
        isLiked: Boolean(t.is_liked),
        isBookmarked: true,
        images: (t.image_urls || []).map((url) =>
          /^https?:\/\//i.test(url) ? url : `${origin}${url.startsWith('/') ? '' : '/'}${url}`
        ),
        user: {
          id: t.user_id,
          username: t.username,
          displayName: t.display_name,
          handle: `@${t.username}`,
          avatar: t.avatar_url,
          isVerified: t.is_verified,
        },
      })),
    });
  } catch (error) {
    console.error('Load bookmarks error:', error);
    res.status(500).json({ error: 'Could not load bookmarks. Check the bookmarks migration and backend log.' });
  }
});

// Save the exact post row, including created_at because tweets is partitioned.
router.post('/:tweetId', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, created_at FROM tweets
       WHERE id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC LIMIT 1`,
      [req.params.tweetId]
    );
    const tweet = rows[0];
    if (!tweet) return res.status(404).json({ error: 'Post not found' });

    await query(
      `INSERT INTO bookmarks (user_id, tweet_id, tweet_created_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, tweet_id) DO NOTHING`,
      [req.userId, tweet.id, tweet.created_at]
    );
    res.status(200).json({ bookmarked: true, tweetId: tweet.id });
  } catch (error) {
    console.error('Add bookmark error:', error);
    res.status(500).json({ error: 'Could not bookmark post. Check the bookmarks table and backend log.' });
  }
});

router.delete('/:tweetId', async (req, res) => {
  try {
    await query(
      'DELETE FROM bookmarks WHERE user_id = $1 AND tweet_id = $2',
      [req.userId, req.params.tweetId]
    );
    res.status(200).json({ bookmarked: false, tweetId: req.params.tweetId });
  } catch (error) {
    console.error('Remove bookmark error:', error);
    res.status(500).json({ error: 'Could not remove bookmark. Check the backend log.' });
  }
});

export default router;
