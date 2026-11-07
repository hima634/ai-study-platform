import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: 6379,
  maxRetriesPerRequest: 1 // fail fast if Redis is down instead of hanging
});

redis.on('error', (err) => console.error('Redis cache error:', err.message));

export default redis;