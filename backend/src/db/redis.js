import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

export const redis = new Redis(process.env.REDIS_URL);

// ---------- Trending hashtags with time-decay scoring ----------
// score = uses within window, decayed so older mentions matter less.
const TREND_KEY = 'trending:hashtags';

export async function bumpHashtag(tag) {
  const now = Date.now() / 1000;
  // ZINCRBY with a decayed increment: newer bumps count fuller than older ones
  await redis.zincrby(TREND_KEY, 1, tag.toLowerCase());
  await redis.zadd('trending:hashtags:lastseen', now, tag.toLowerCase());
}

export async function getTrending(limit = 10) {
  // Apply exponential decay based on last-seen time before returning ranking
  const tags = await redis.zrevrange(TREND_KEY, 0, limit * 3, 'WITHSCORES');
  const now = Date.now() / 1000;
  const decayed = [];
  for (let i = 0; i < tags.length; i += 2) {
    const tag = tags[i];
    const score = parseFloat(tags[i + 1]);
    const lastSeen = parseFloat(await redis.zscore('trending:hashtags:lastseen', tag)) || now;
    const ageHours = (now - lastSeen) / 3600;
    const decayFactor = Math.exp(-ageHours / 24); // half-life-ish decay over a day
    decayed.push({ tag, score: score * decayFactor });
  }
  return decayed.sort((a, b) => b.score - a.score).slice(0, limit);
}

// ---------- Cache helpers ----------
export async function cacheGetJSON(key) {
  const val = await redis.get(key);
  return val ? JSON.parse(val) : null;
}
export async function cacheSetJSON(key, value, ttlSeconds = 60) {
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}
export async function cacheInvalidate(key) {
  await redis.del(key);
}

// ---------- Rate limiting (fixed window) ----------
export async function rateLimit(key, limit, windowSeconds) {
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, windowSeconds);
  return count <= limit;
}

// ---------- Idempotency ----------
export async function checkIdempotency(key) {
  const set = await redis.set(`idem:${key}`, '1', 'NX', 'EX', 60);
  return set === 'OK'; // true = first time seeing this key
}
