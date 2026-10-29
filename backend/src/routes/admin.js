
import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const STATUSES = ['pending', 'reviewed', 'resolved', 'dismissed'];
const ROLES = ['user', 'moderator', 'admin'];

async function requireStaff(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT role FROM users
       WHERE id = $1 AND deleted_at IS NULL`,
      [req.userId]
    );

    const role = rows[0]?.role;

    if (!['admin', 'moderator'].includes(role)) {
      return res.status(403).json({
        error: 'Admin or moderator access is required.',
      });
    }

    req.currentRole = role;
    next();
  } catch (error) {
    console.error('Staff authorization failed:', error.message);
    return res.status(500).json({ error: 'Authorization check failed.' });
  }
}

function requireAdmin(req, res, next) {
  if (req.currentRole !== 'admin') {
    return res.status(403).json({
      error: 'Only an admin can manage users.',
    });
  }
  next();
}

router.use(requireAuth, requireStaff);

router.get('/reports', async (req, res) => {
  const status = req.query.status || 'all';

  if (status !== 'all' && !STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid report status.' });
  }

  try {
    const { rows } = await query(
      `SELECT
         r.id,
         r.reporter_id,
         reporter.username AS reporter_username,
         r.target_type,
         r.target_tweet_id,
         r.target_tweet_created_at,
         r.target_user_id,
         r.reason,
         r.details,
         r.status,
         r.reviewed_by,
         r.reviewed_at,
         r.created_at,
         target_user.username AS target_username,
         t.content AS target_tweet_content,
         tweet_author.username AS target_tweet_author
       FROM reports r
       LEFT JOIN users reporter ON reporter.id = r.reporter_id
       LEFT JOIN users target_user ON target_user.id = r.target_user_id
       LEFT JOIN tweets t
         ON t.id = r.target_tweet_id
        AND (
          r.target_tweet_created_at IS NULL
          OR t.created_at = r.target_tweet_created_at
        )
       LEFT JOIN users tweet_author ON tweet_author.id = t.user_id
       WHERE ($1 = 'all' OR r.status = $1)
       ORDER BY r.created_at DESC`,
      [status]
    );

    return res.json(rows);
  } catch (error) {
    console.error('Load reports failed:', error.message);
    return res.status(500).json({ error: 'Could not load reports.' });
  }
});

router.patch('/reports/:id', async (req, res) => {
  const { status } = req.body;

  if (!STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid report status.' });
  }

  try {
    const { rows } = await query(
      `UPDATE reports
       SET status = $1, reviewed_by = $2, reviewed_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, req.userId, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error('Update report failed:', error.message);
    return res.status(500).json({ error: 'Could not update report status.' });
  }
});

// Only admins can view/manage the account list.
router.get('/users', requireAdmin, async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT
         id,
         username,
         display_name AS "displayName",
         email,
         role,
         followers_count AS "followersCount",
         following_count AS "followingCount",
         posts_count AS "postsCount",
         created_at AS "createdAt",
         deleted_at AS "deletedAt",
         (deleted_at IS NOT NULL) AS disabled
       FROM users
       ORDER BY created_at DESC`
    );

    return res.json(rows);
  } catch (error) {
    console.error('Load users failed:', error.message);
    return res.status(500).json({ error: 'Could not load users.' });
  }
});

router.patch('/users/:id/role', requireAdmin, async (req, res) => {
  const { role } = req.body;

  if (!ROLES.includes(role)) {
    return res.status(400).json({ error: 'Invalid user role.' });
  }

  if (String(req.params.id) === String(req.userId) && role !== 'admin') {
    return res.status(400).json({
      error: 'You cannot remove your own admin role.',
    });
  }

  try {
    const { rows } = await query(
      `UPDATE users
       SET role = $1
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING id, username, display_name AS "displayName", email, role`,
      [role, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Active user not found.' });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error('Change role failed:', error.message);
    return res.status(500).json({ error: 'Could not change user role.' });
  }
});

router.patch('/users/:id/status', requireAdmin, async (req, res) => {
  const { disabled } = req.body;

  if (typeof disabled !== 'boolean') {
    return res.status(400).json({ error: 'disabled must be true or false.' });
  }

  if (String(req.params.id) === String(req.userId) && disabled) {
    return res.status(400).json({ error: 'You cannot disable your own account.' });
  }

  try {
    const { rows } = await query(
      `UPDATE users
       SET deleted_at = CASE
         WHEN $1::boolean THEN COALESCE(deleted_at, NOW())
         ELSE NULL
       END
       WHERE id = $2
       RETURNING id, username, role, deleted_at AS "deletedAt",
                 (deleted_at IS NOT NULL) AS disabled`,
      [disabled, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error('Change account status failed:', error.message);
    return res.status(500).json({ error: 'Could not change account status.' });
  }
});

export default router;
