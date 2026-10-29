import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    let existing = await query('SELECT 1 FROM bookmarks WHERE user_id=$1 LIMIT 1', [req.userId]);
    // Helpful demo defaults: bookmark up to two recent posts once, but only if this account has none.
    if (!existing.rows.length) {
      await query(`INSERT INTO bookmarks(user_id,tweet_id,tweet_created_at)
        SELECT $1,t.id,t.created_at FROM tweets t
        WHERE t.deleted_at IS NULL AND t.user_id <> $1
        ORDER BY t.created_at DESC LIMIT 2 ON CONFLICT DO NOTHING`, [req.userId]);
    }
    const { rows } = await query(`SELECT t.id,t.user_id,t.content,t.parent_tweet_id,t.like_count,t.retweet_count,t.reply_count,t.created_at,t.image_urls,
        u.username,u.display_name,u.avatar_url,u.is_verified,
        EXISTS(SELECT 1 FROM likes l WHERE l.user_id=$1 AND l.tweet_id=t.id) AS is_liked,
        EXISTS(SELECT 1 FROM bookmarks b WHERE b.user_id=$1 AND b.tweet_id=t.id) AS is_bookmarked
      FROM bookmarks b JOIN tweets t ON t.id=b.tweet_id AND t.created_at=b.tweet_created_at
      JOIN users u ON u.id=t.user_id WHERE b.user_id=$1 AND t.deleted_at IS NULL
      ORDER BY b.created_at DESC`, [req.userId]);
    res.json({ bookmarks: rows.map(t => ({ id:t.id,userId:t.user_id,content:t.content,parentTweetId:t.parent_tweet_id,likes:t.like_count||0,reposts:t.retweet_count||0,comments:t.reply_count||0,createdAt:t.created_at,isLiked:Boolean(t.is_liked),isBookmarked:Boolean(t.is_bookmarked),images:(t.image_urls||[]).map(url=>url.startsWith('http')?url:`http://localhost:${process.env.PORT||5000}${url}`),user:{id:t.user_id,username:t.username,displayName:t.display_name,handle:`@${t.username}`,avatar:t.avatar_url,isVerified:t.is_verified}})) });
  } catch (error) { console.error('Load bookmarks error:', error); res.status(500).json({error:'Could not load bookmarks. Run migration 004_media_bookmarks.sql.'}); }
});

router.post('/:tweetId', async (req,res) => {
  try { const { rows } = await query('SELECT id,created_at FROM tweets WHERE id=$1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1',[req.params.tweetId]);
    if(!rows[0]) return res.status(404).json({error:'Post not found'});
    await query('INSERT INTO bookmarks(user_id,tweet_id,tweet_created_at) VALUES($1,$2,$3) ON CONFLICT(user_id,tweet_id) DO NOTHING',[req.userId,rows[0].id,rows[0].created_at]);
    res.status(201).json({bookmarked:true});
  } catch(error) { console.error('Add bookmark error:',error); res.status(500).json({error:'Could not bookmark post'}); }
});
router.delete('/:tweetId', async (req,res) => {
  try { await query('DELETE FROM bookmarks WHERE user_id=$1 AND tweet_id=$2',[req.userId,req.params.tweetId]); res.status(204).end(); }
  catch(error) { console.error('Remove bookmark error:',error); res.status(500).json({error:'Could not remove bookmark'}); }
});
export default router;
