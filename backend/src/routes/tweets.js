import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { bumpHashtag, checkIdempotency } from '../db/redis.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, '../../uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase();
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 4 },
  fileFilter: (_req, file, cb) => {
    if (!['image/jpeg','image/png','image/gif','image/webp'].includes(file.mimetype)) {
      const err = new Error('Only JPG, PNG, GIF, and WEBP images are supported');
      err.status = 400; return cb(err);
    }
    cb(null, true);
  },
});

function toPublicTweet(t) {
  return {
    id: t.id, userId: t.user_id, content: t.content, parentTweetId: t.parent_tweet_id,
    likeCount: t.like_count, retweetCount: t.retweet_count, replyCount: t.reply_count,
    createdAt: t.created_at, imageUrls: t.image_urls || [],
  };
}

// ---------- Create tweet (extracts hashtags, bumps trending) ----------
router.post('/', requireAuth, upload.array('images', 4), async (req, res) => {
  try {
  const { content, parentTweetId, idempotencyKey } = req.body;
  const text = String(content || '').trim();
  if (!text) return res.status(400).json({ error: 'Write something before posting (text is required).' });
  if (text.length > 280) return res.status(400).json({ error: 'Posts must be 280 characters or fewer.' });
  const imageUrls = (req.files || []).map(file => `/uploads/${file.filename}`);
  if (idempotencyKey) {
    try { const isNew = await checkIdempotency(idempotencyKey); if (!isNew) return res.status(409).json({ error: 'Duplicate submission ignored' }); }
    catch (redisError) { console.warn('Idempotency check skipped because Redis is unavailable:', redisError.message); }
  }

  const { rows } = await query(
    `INSERT INTO tweets (user_id, content, parent_tweet_id, is_reply, image_urls)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.userId, text, parentTweetId || null, !!parentTweetId, imageUrls]
  );
  const tweet = rows[0];

  // Notifications are secondary: a stale notification constraint must not make post creation appear to fail.
  try {
    if (parentTweetId) {
      const parent = await query('SELECT user_id FROM tweets WHERE id=$1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1', [parentTweetId]);
      if (parent.rows[0] && parent.rows[0].user_id !== req.userId) {
        await query("INSERT INTO notifications(user_id,actor_id,type,tweet_id) VALUES($1,$2,'reply',$3)", [parent.rows[0].user_id, req.userId, tweet.id]);
      }
    } else {
      await query("INSERT INTO notifications(user_id,actor_id,type,tweet_id) SELECT follower_id,$1,'post',$2 FROM follows WHERE followee_id=$1 AND follower_id<>$1", [req.userId, tweet.id]);
    }
  } catch (notificationError) { console.warn('Post saved; notification creation skipped:', notificationError.message); }

  // hashtags: extract, upsert, link, bump Redis trending
  const tags = [...content.matchAll(/#(\w+)/g)].map(m => m[1]);
  for (const tag of tags) {
    const { rows: h } = await query(
      `INSERT INTO hashtags (tag) VALUES ($1)
       ON CONFLICT (tag) DO UPDATE SET tag = EXCLUDED.tag RETURNING id`,
      [tag.toLowerCase()]
    );
    await query(
      `INSERT INTO tweet_hashtags (tweet_id, tweet_created_at, hashtag_id) VALUES ($1,$2,$3)
       ON CONFLICT DO NOTHING`,
      [tweet.id, tweet.created_at, h[0].id]
    );
    try { await bumpHashtag(tag); } catch (redisError) { console.warn('Trending score update skipped:', redisError.message); }
  }

  res.status(201).json(toPublicTweet(tweet));
  } catch (error) {
    console.error('Create tweet error:', error);
    const status = error.status || 500;
    res.status(status).json({ error: status === 500 ? 'Could not create post. Check database migration 004_media_bookmarks.sql and backend logs.' : error.message });
  }
});

// ---------- Recursive CTE: full thread ----------
router.get('/:id/thread', optionalAuth, async (req, res) => {
  const { rows } = await query(
    `WITH RECURSIVE thread AS (
       SELECT id, user_id, content, parent_tweet_id, created_at, like_count, retweet_count, reply_count, 0 AS depth
       FROM tweets WHERE id = $1
       UNION ALL
       SELECT t.id, t.user_id, t.content, t.parent_tweet_id, t.created_at, t.like_count, t.retweet_count, t.reply_count, th.depth + 1
       FROM tweets t
       JOIN thread th ON t.parent_tweet_id = th.id
     )
     SELECT * FROM thread ORDER BY depth, created_at;`,
    [req.params.id]
  );
  res.json(rows.map(toPublicTweet));
});

router.delete('/:id', requireAuth, async (req, res) => {
  const { rows } = await query(
    `UPDATE tweets SET deleted_at = now() WHERE id = $1 AND user_id = $2 RETURNING id`,
    [req.params.id, req.userId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found or not yours' });
  res.status(204).end();
});

export default router;
