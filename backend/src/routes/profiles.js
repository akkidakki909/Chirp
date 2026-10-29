import { Router } from 'express';
import { query } from '../db/pool.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
const router=Router();
router.get('/:username',optionalAuth,async(req,res)=>{try{
 const {rows}=await query(`SELECT u.id,u.username,u.display_name,u.bio,u.location,u.website,u.avatar_url,u.banner_url,u.is_verified,u.followers_count,u.following_count,u.posts_count,u.created_at,
 CASE WHEN $2::uuid IS NULL THEN false ELSE EXISTS(SELECT 1 FROM follows f WHERE f.follower_id=$2 AND f.followee_id=u.id) END AS is_following
 FROM users u WHERE lower(u.username)=lower($1) AND u.deleted_at IS NULL`,[req.params.username,req.userId||null]);
 if(!rows[0])return res.status(404).json({error:'User not found'});
 const user=rows[0]; const posts=await query(`SELECT t.id,t.user_id,t.content,t.parent_tweet_id,t.like_count,t.retweet_count,t.reply_count,t.created_at,t.image_urls,u.username,u.display_name,u.avatar_url,u.is_verified FROM tweets t JOIN users u ON u.id=t.user_id WHERE t.user_id=$1 AND t.deleted_at IS NULL AND t.is_reply=false ORDER BY t.created_at DESC LIMIT 50`,[user.id]);
 res.json({user,posts:posts.rows.map(t=>({id:t.id,userId:t.user_id,content:t.content,parentTweetId:t.parent_tweet_id,likes:t.like_count||0,reposts:t.retweet_count||0,comments:t.reply_count||0,createdAt:t.created_at,user:{id:t.user_id,username:t.username,displayName:t.display_name,handle:'@'+t.username,avatar:t.avatar_url,isVerified:t.is_verified},images:(t.image_urls||[]).map(url=>url.startsWith('http')?url:`http://localhost:${process.env.PORT||5000}${url}`)}))});
 }catch(e){console.error('profile:',e);res.status(500).json({error:'Could not load profile'});}});
router.post('/:userId/follow',requireAuth,async(req,res)=>{try{if(req.params.userId===req.userId)return res.status(400).json({error:'Cannot follow yourself'});const r=await query('INSERT INTO follows(follower_id,followee_id) VALUES($1,$2) ON CONFLICT DO NOTHING RETURNING follower_id',[req.userId,req.params.userId]);if(r.rowCount)await query("INSERT INTO notifications(user_id,actor_id,type) VALUES($1,$2,'follow')",[req.params.userId,req.userId]);res.json({following:true});}catch(e){console.error('follow profile:',e);res.status(500).json({error:'Could not follow user'});}});
router.delete('/:userId/follow',requireAuth,async(req,res)=>{try{await query('DELETE FROM follows WHERE follower_id=$1 AND followee_id=$2',[req.userId,req.params.userId]);res.json({following:false});}catch(e){res.status(500).json({error:'Could not unfollow user'});}});
export default router;
