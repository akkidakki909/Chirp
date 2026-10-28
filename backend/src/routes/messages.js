import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
router.use(requireAuth);
router.get('/conversations', async (req,res) => {
 try {
  const { rows } = await query(`WITH ranked AS (
   SELECT dm.*, ROW_NUMBER() OVER (PARTITION BY LEAST(sender_id::text,recipient_id::text), GREATEST(sender_id::text,recipient_id::text) ORDER BY created_at DESC) rn
   FROM direct_messages dm WHERE sender_id=$1 OR recipient_id=$1
  ) SELECT r.id, r.content AS last_message, r.created_at AS last_message_at,
    CASE WHEN r.sender_id=$1 THEN r.recipient_id ELSE r.sender_id END AS participant_id,
    u.username,u.display_name,u.avatar_url,
    (SELECT count(*)::int FROM direct_messages unread WHERE unread.sender_id=CASE WHEN r.sender_id=$1 THEN r.recipient_id ELSE r.sender_id END AND unread.recipient_id=$1 AND unread.read_at IS NULL) AS unread_count
   FROM ranked r JOIN users u ON u.id=CASE WHEN r.sender_id=$1 THEN r.recipient_id ELSE r.sender_id END WHERE r.rn=1 ORDER BY r.created_at DESC`, [req.userId]);
  res.json({ conversations: rows });
 } catch(e) { console.error('messages conversations:',e); res.status(500).json({error:'Could not load conversations'}); }
});
router.get('/with/:userId', async (req,res) => {
 try {
  if(req.params.userId===req.userId) return res.status(400).json({error:'Cannot message yourself'});
  const u=await query('SELECT id,username,display_name,avatar_url FROM users WHERE id=$1 AND deleted_at IS NULL',[req.params.userId]);
  if(!u.rows[0]) return res.status(404).json({error:'User not found'});
  const {rows}=await query(`SELECT id,sender_id,recipient_id,content,created_at FROM direct_messages WHERE (sender_id=$1 AND recipient_id=$2) OR (sender_id=$2 AND recipient_id=$1) ORDER BY created_at ASC`,[req.userId,req.params.userId]);
  await query('UPDATE direct_messages SET read_at=now() WHERE sender_id=$1 AND recipient_id=$2 AND read_at IS NULL',[req.params.userId,req.userId]);
  res.json({participant:u.rows[0],messages:rows});
 } catch(e) { console.error('messages thread:',e); res.status(500).json({error:'Could not load messages'}); }
});
router.post('/with/:userId', async (req,res) => {
 try {
  const content=String(req.body.content||'').trim(); if(!content) return res.status(400).json({error:'Message cannot be empty'}); if(content.length>4000) return res.status(400).json({error:'Message is too long'}); if(req.params.userId===req.userId) return res.status(400).json({error:'Cannot message yourself'});
  const u=await query('SELECT id FROM users WHERE id=$1 AND deleted_at IS NULL',[req.params.userId]); if(!u.rows[0]) return res.status(404).json({error:'User not found'});
  const {rows}=await query('INSERT INTO direct_messages(sender_id,recipient_id,content) VALUES($1,$2,$3) RETURNING id,sender_id,recipient_id,content,created_at',[req.userId,req.params.userId,content]); res.status(201).json({message:rows[0]});
 } catch(e) { console.error('send message:',e); res.status(500).json({error:'Could not send message'}); }
});
router.get('/unread-count', async(req,res)=>{try{const {rows}=await query('SELECT count(*)::int AS count FROM direct_messages WHERE recipient_id=$1 AND read_at IS NULL',[req.userId]);res.json({count:rows[0].count});}catch(e){res.status(500).json({error:'Could not count unread messages'});}});
export default router;
