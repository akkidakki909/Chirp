import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
const router=Router(); router.use(requireAuth);
router.get('/',async(req,res)=>{try{const {rows}=await query(`SELECT n.id,n.type,n.tweet_id,n.is_read,n.created_at,u.id AS actor_id,u.username,u.display_name,u.avatar_url,t.content AS tweet_content FROM notifications n JOIN users u ON u.id=n.actor_id LEFT JOIN LATERAL (SELECT content FROM tweets WHERE id=n.tweet_id AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1) t ON true WHERE n.user_id=$1 ORDER BY n.created_at DESC LIMIT 100`,[req.userId]);res.json({notifications:rows});}catch(e){console.error('notifications:',e);res.status(500).json({error:'Could not load notifications'});}});
router.get('/unread-count',async(req,res)=>{try{const {rows}=await query('SELECT count(*)::int AS count FROM notifications WHERE user_id=$1 AND is_read=false',[req.userId]);res.json({count:rows[0].count});}catch(e){res.status(500).json({error:'Could not count notifications'});}});
router.patch('/read-all',async(req,res)=>{try{await query('UPDATE notifications SET is_read=true WHERE user_id=$1 AND is_read=false',[req.userId]);res.json({ok:true});}catch(e){res.status(500).json({error:'Could not mark notifications read'});}});
router.patch('/:id/read',async(req,res)=>{try{await query('UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2',[req.params.id,req.userId]);res.json({ok:true});}catch(e){res.status(500).json({error:'Could not mark notification read'});}});
export default router;
