import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/:userId', requireAuth, async (req, res) => {
  if (req.params.userId === req.userId) return res.status(400).json({ error: "Can't follow yourself" });
  try {
    await query(`INSERT INTO follows (follower_id, followee_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [req.userId, req.params.userId]);
    await query(
      `INSERT INTO notifications (user_id, actor_id, type) VALUES ($1,$2,'follow')`,
      [req.params.userId, req.userId]
    );
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:userId', requireAuth, async (req, res) => {
  await query(`DELETE FROM follows WHERE follower_id = $1 AND followee_id = $2`, [req.userId, req.params.userId]);
  res.status(204).end();
});

export default router;
