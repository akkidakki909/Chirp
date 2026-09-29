// Refreshes the top_tweets_week materialized view.
// Run once manually (npm run refresh-views) or schedule with cron below.
import 'dotenv/config';
import cron from 'node-cron';
import { pool } from '../db/pool.js';

async function refresh() {
  await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY top_tweets_week');
  console.log(`[${new Date().toISOString()}] top_tweets_week refreshed`);
}

if (process.argv.includes('--once')) {
  refresh().then(() => pool.end());
} else {
  // every 15 minutes
  cron.schedule('*/15 * * * *', refresh);
  console.log('Materialized view refresh scheduled every 15 minutes.');
}
