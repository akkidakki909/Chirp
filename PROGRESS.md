# Progress Log

## Phase 1–8 - 2026-09-27 (pre-built, via Claude)
- Built full Postgres schema: users, tweets (partitioned monthly), follows,
  likes, retweets, hashtags, tweet_hashtags, notifications, feed_entries.
- Added triggers for denormalized counters, fan-out-on-write, search_vector sync.
- Added materialized view `top_tweets_week`.
- Built Express backend: auth (JWT+bcrypt), tweets (incl. recursive CTE thread),
  feed (pull + fanout modes with benchmark endpoint), follows, likes/retweets,
  full-text search, Redis-backed trending, analytics (window functions).
- Added Redis helpers: trending (time-decay ZSET), cache get/set, rate limiting,
  idempotency keys.
- Added seed script populating demo users/tweets/follows/likes.
- Added Socket.io server scaffold (not yet consumed by frontend).
- Files created: see /backend/src/** and /backend/package.json.
- Assumptions made: single Postgres instance for dev (no read replicas);
  fan-out happens synchronously in-transaction for grading determinism;
  JWT stored client-side, no refresh-token rotation (kept simple for scope).
- What's left: wiring the existing React frontend (currently on mockData.js)
  to these real endpoints; socket client in frontend; analytics UI page.

## Step 1 - Frontend API Client Setup
- Added `axios` dependency to `frontend/package.json`.
- Created [client.js](file:///c:/Users/adity/OneDrive/Documents/Desktop/chirp-fullstack/project/frontend/src/api/client.js) with base URL configured via `VITE_API_URL` (defaulting to `http://localhost:5000/api`) and a request interceptor for JWT authorization header.
- Added [frontend/.env](file:///c:/Users/adity/OneDrive/Documents/Desktop/chirp-fullstack/project/frontend/.env) setting `VITE_API_URL=http://localhost:5000/api`.

## Step 2 - Database Normalization Audit & BCNF Documentation
- Audited all 9 tables in `001_init.sql` against 1NF, 2NF, 3NF, and BCNF with candidate keys, FDs, and redundancy classifications.
- Created [NORMALIZATION.md](file:///c:/Users/adity/OneDrive/Documents/Desktop/chirp-fullstack/project/docs/NORMALIZATION.md) detailing the UNF -> 1NF -> 2NF -> 3NF -> BCNF decomposition walkthrough with concrete sample data and anomaly proofs.
- Documented deliberate engineering denormalizations (counters, search vectors, partition pruning keys, fan-out tables) and partitioned FK enforcement mechanisms.
- Prepared proposed Migration 003 schema fixes (removing `feed_entries.author_id`, adding `notifications` domain CHECK constraint, updating `fanout_tweet()`, and removing `is_reply` in `tweets.js`).
