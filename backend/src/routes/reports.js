
import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const VALID_REASONS = [
  'spam',
  'harassment',
  'inappropriate',
  'misinformation',
  'other',
];

router.post('/', requireAuth, async (req, res) => {
  const {
    target_type,
    target_tweet_id,
    target_user_id,
    reason,
    details = '',
  } = req.body;

  if (!['tweet', 'user'].includes(target_type)) {
    return res.status(400).json({ error: 'Invalid report target type.' });
  }

  if (!reason || typeof reason !== 'string' || reason.length > 100) {
    return res.status(400).json({ error: 'A valid report reason is required.' });
  }

  if (typeof details !== 'string' || details.length > 2000) {
    return res.status(400).json({ error: 'Details must be 2000 characters or fewer.' });
  }

  if (target_type === 'tweet' && !target_tweet_id) {
    return res.status(400).json({ error: 'Post ID is required.' });
  }

  if (target_type === 'user' && !target_user_id) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  try {
    if (target_type === 'tweet') {
      const target = await query(
        'SELECT id, created_at FROM tweets WHERE id = $1 AND deleted_at IS NULL',
        [target_tweet_id]
      );

      if (!target.rows.length) {
        return res.status(404).json({ error: 'The reported post was not found.' });
      }

      const { rows } = await query(
        `INSERT INTO reports
          (reporter_id, target_type, target_tweet_id,
           target_tweet_created_at, reason, details, status)
         VALUES ($1, 'tweet', $2, $3, $4, $5, 'pending')
         RETURNING *`,
        [
          req.userId,
          target.rows[0].id,
          target.rows[0].created_at,
          reason,
          details.trim(),
        ]
      );

      return res.status(201).json({ report: rows[0] });
    }

    if (String(target_user_id) === String(req.userId)) {
      return res.status(400).json({ error: 'You cannot report your own account.' });
    }

    const target = await query(
      'SELECT id FROM users WHERE id = $1 AND deleted_at IS NULL',
      [target_user_id]
    );

    if (!target.rows.length) {
      return res.status(404).json({ error: 'The reported user was not found.' });
    }

    const { rows } = await query(
      `INSERT INTO reports
        (reporter_id, target_type, target_user_id, reason, details, status)
       VALUES ($1, 'user', $2, $3, $4, 'pending')
       RETURNING *`,
      [req.userId, target_user_id, reason, details.trim()]
    );

    return res.status(201).json({ report: rows[0] });
  } catch (error) {
    console.error('Report creation failed:', error.message);
    return res.status(500).json({ error: 'Could not save report.' });
  }
});

export default router;
