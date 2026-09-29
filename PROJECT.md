# Chirp — Twitter Clone (DBMS Course Project)

## Stack
- Frontend: React + Vite (already built — see `/frontend`)
- Backend: Node.js + Express (already scaffolded — see `/backend`)
- Primary DB: PostgreSQL (schema + triggers + partitioning already written, see `/backend/src/migrations`)
- Cache/trending/rate-limit: Redis

## Architectural decisions (locked in, don't relitigate)
- Postgres is the single source of truth. Redis is disposable — if it's flushed, no data is lost, only speed/trending state.
- Tweets table is RANGE PARTITIONED by month (`created_at`).
- Denormalized counters (`followers_count`, `like_count`, etc.) are kept correct via Postgres TRIGGERS, not app-layer increments.
- Feed has TWO implementations behind `GET /api/feed?mode=pull|fanout` — pull joins at read time, fanout reads from a precomputed `feed_entries` table populated by a trigger at write time. Both exist so we can benchmark and discuss the tradeoff in the report.
- Trending hashtags live ONLY in Redis (sorted set with time-decay), not Postgres.

## Current status
- [x] Phase 1 — Postgres schema + migrations + partitioning + triggers + materialized view (`backend/src/migrations/001_init.sql`, `002_queries_reference.sql`)
- [x] Phase 2 — Backend auth (JWT + bcrypt) + user model
- [x] Phase 3 — Tweet CRUD + recursive CTE thread endpoint
- [x] Phase 4 — Follows + pull feed
- [x] Phase 5 — Likes/retweets + trigger-based counters
- [x] Phase 6 — Full-text search (tsvector/GIN) + hashtags
- [x] Phase 7 — Redis integration (trending, cache, rate limit, idempotency)
- [x] Phase 8 — Fan-out feed + `/api/feed/benchmark` endpoint
- [ ] Phase 9 — Frontend wired to these APIs (frontend currently uses `src/data/mockData.js`, NOT the backend yet — this is the main remaining work)
- [ ] Phase 10 — Real-time layer (Socket.io server exists in `backend/src/server.js`, but frontend has no socket client yet)
- [ ] Phase 11 — Isolation-level demo write-up (SQL is ready in `002_queries_reference.sql`, needs to be run manually and screenshotted for the report — not app code)
- [ ] Phase 12 — Analytics dashboard UI (backend endpoints exist at `/api/analytics/*`, no frontend page yet)

## What's NOT done yet (this is the actual remaining work)
1. Replace `frontend/src/data/mockData.js` usage with real API calls (axios/fetch) to the endpoints below.
2. Add an `AuthContext`-compatible login/register flow hitting `/api/auth/*` and storing the JWT.
3. Add a socket.io client in the frontend to receive live notifications.
4. Build a simple analytics page using `/api/analytics/*`.
5. Add a `.env` for the frontend with `VITE_API_URL`.

## API contract (already implemented in backend, frontend needs to call these)
- `POST /api/auth/register` `{ username, displayName, email, password }` → `{ token, user }`
- `POST /api/auth/login` `{ email, password }` → `{ token, user }`
- `POST /api/tweets` (auth) `{ content, parentTweetId? }` → tweet
- `GET /api/tweets/:id/thread` → recursive reply thread
- `DELETE /api/tweets/:id` (auth)
- `GET /api/feed?mode=pull|fanout&cursor=&limit=` (auth) → `{ tweets, nextCursor, tookMs }`
- `GET /api/feed/benchmark` (auth) → timing comparison of both modes
- `POST/DELETE /api/follows/:userId` (auth)
- `POST/DELETE /api/likes/:tweetId` (auth)
- `POST /api/retweets/:tweetId` (auth) `{ quoteContent? }`
- `GET /api/search?q=` → full-text search results
- `GET /api/search/trending` → Redis-backed trending hashtags
- `GET /api/analytics/my-rankings` (auth), `/api/analytics/leaderboard`, `/api/analytics/top-tweets`

## Tech decisions log
- Chose monthly range partitioning (not hash) on `tweets.created_at` so old-month partitions can later be archived/dropped wholesale — a common real-world reason to partition, easy to explain in viva.
- Chose SERIALIZABLE vs READ COMMITTED for the isolation demo specifically because the "double like" lost-update scenario is easy to reproduce with two `psql` tabs and easy to explain visually.
- Fan-out writes to `feed_entries` happen in the SAME transaction as the tweet insert (via trigger), not a background job, to keep the demo deterministic for grading — a production system would likely do this asynchronously (mention this tradeoff in the report).
