// Seeds the database with demo users + tweets + follows + likes so
// feed/search/trending/analytics endpoints have something to show.
// Run: npm run seed
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool, query } from '../db/pool.js';

const DEMO_USERS = [
  { username: 'aditya_dev', displayName: 'Aditya Sharma', bio: 'Full-stack dev | Coffee enthusiast' },
  { username: 'priya_codes', displayName: 'Priya Nair', bio: 'CS student | Open source contributor' },
  { username: 'rahul_wanderer', displayName: 'Rahul Kapoor', bio: 'Travel | Photography | DBMS enthusiast' },
  { username: 'neha_ml', displayName: 'Neha Verma', bio: 'ML engineer | Building cool things' },
];

const SAMPLE_TWEETS = [
  'Just finished setting up #postgres partitioning for our project 🎉',
  'Redis sorted sets are so underrated for #trending features',
  'Recursive CTEs finally clicked for me today, threaded replies are neat',
  'Anyone else obsessed with #dbms this semester or just me',
  'Shipped the fan-out vs pull feed benchmark, results are wild',
];

async function seed() {
  console.log('Seeding...');
  const userIds = [];
  for (const u of DEMO_USERS) {
    const hash = await bcrypt.hash('password123', 10);
    const { rows } = await query(
      `INSERT INTO users (username, display_name, email, password_hash, bio, avatar_url)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (username) DO UPDATE SET bio = EXCLUDED.bio
       RETURNING id`,
      [u.username, u.displayName, `${u.username}@example.com`, hash, u.bio,
       `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`]
    );
    userIds.push(rows[0].id);
  }

  // everyone follows everyone (small demo graph)
  for (const a of userIds) {
    for (const b of userIds) {
      if (a !== b) await query(
        `INSERT INTO follows (follower_id, followee_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [a, b]
      );
    }
  }

  // a handful of tweets per user
  for (const uid of userIds) {
    for (const content of SAMPLE_TWEETS) {
      await query(`INSERT INTO tweets (user_id, content) VALUES ($1,$2)`, [uid, content]);
    }
  }

  // random likes
  const { rows: tweets } = await query(`SELECT id, created_at FROM tweets`);
  for (const uid of userIds) {
    for (const t of tweets.slice(0, 5)) {
      await query(
        `INSERT INTO likes (user_id, tweet_id, tweet_created_at) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
        [uid, t.id, t.created_at]
      );
    }
  }

  console.log(`Seeded ${userIds.length} users and ${tweets.length} tweets.`);
  await pool.end();
}

seed().catch((err) => { console.error(err); process.exit(1); });
