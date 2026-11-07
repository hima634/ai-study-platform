import redis from '../config/redis.js';

export const getOrSet = async (key, ttlSeconds, fetchFn) => {
  try {
    const cached = await redis.get(key);
    if (cached) {
      console.log('Cache hit:', key.slice(0, 80));
      return JSON.parse(cached);
    }
  } catch (err) {
    console.error('Cache read failed:', err.message);
  }

  console.log('Cache miss:', key.slice(0, 80));
  const fresh = await fetchFn();

  try {
    await redis.set(key, JSON.stringify(fresh), 'EX', ttlSeconds);
  } catch (err) {
    console.error('Cache write failed:', err.message);
  }

  return fresh;
};