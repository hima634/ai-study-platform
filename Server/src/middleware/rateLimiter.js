import redis from '../config/redis.js';

export const rateLimit = ({ name, limit, windowSeconds }) => {
  return async (req, res, next) => {
    try {
      const key = `rl:${name}:${req.user.id}`;

      // INCR and TTL are sent together, so they run as one step
      const results = await redis.multi().incr(key).ttl(key).exec();
      const count = results[0][1];
      let ttl = results[1][1];

      // No timer on the key yet: this is the first request of a new window
      if (ttl === -1) {
        await redis.expire(key, windowSeconds);
        ttl = windowSeconds;
      }

      res.set('X-RateLimit-Limit', String(limit));
      res.set('X-RateLimit-Remaining', String(Math.max(0, limit - count)));

      if (count > limit) {
        res.set('Retry-After', String(ttl));
        return res.status(429).json({
          message: `Too many requests. Please wait ${ttl} seconds and try again.`
        });
      }
    } catch (err) {
      // If Redis is down, let the request through instead of blocking every user
      console.error('Rate limiter error:', err.code || err.message || String(err));
    }

    next();
  };
};