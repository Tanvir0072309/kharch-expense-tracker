const crypto = require("node:crypto");

const redisClient = require("../config/redis");

/**
 * Sliding-window rate limiter backed by a Redis sorted set (ZSET).
 *
 * Each request adds an entry `{ score: timestamp, member: uniqueId }` to a
 * per-key ZSET. On every request we drop everything older than
 * `now - windowMs` (ZREMRANGEBYSCORE) and then count what's left
 * (ZCARD) - both O(log N). This gives a true sliding window (unlike a
 * fixed-window counter, which can be burst-bypassed at the edge of two
 * adjacent windows) while staying cheap per request.
 *
 * @param {object} options
 * @param {number} options.windowMs   Size of the sliding window, in ms.
 * @param {number} options.max        Max requests allowed within the window.
 * @param {string} options.keyPrefix  Namespaces the Redis keys (e.g. "login").
 * @param {(req: import('express').Request) => string} [options.keyGenerator]
 *        Builds the per-client key suffix. Defaults to IP address.
 * @param {string} [options.message]  Client-facing message when blocked.
 */
const rateLimit = ({
  windowMs,
  max,
  keyPrefix,
  keyGenerator,
  message = "Too many requests, please try again later",
}) => {
  if (!windowMs || !max || !keyPrefix) {
    throw new Error(
      "rateLimit requires windowMs, max, and keyPrefix to be set",
    );
  }

  return async (req, res, next) => {
    try {
      const identity = keyGenerator
        ? keyGenerator(req)
        : req.ip || req.socket?.remoteAddress || "unknown";

      const key = `rate-limit:${keyPrefix}:${identity}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      // A random member (not just the timestamp) so two requests landing in
      // the same millisecond don't collide and silently overwrite each other
      // in the ZSET.
      const member = `${now}:${crypto.randomBytes(6).toString("hex")}`;

      const results = await redisClient
        .multi()
        .zRemRangeByScore(key, 0, windowStart)
        .zAdd(key, { score: now, value: member })
        .zCard(key)
        .pExpire(key, windowMs)
        .exec();

      // node-redis v4 multi().exec() resolves to an array of raw replies,
      // in the same order the commands were queued.
      const count = Number(results[2]);

      res.set("X-RateLimit-Limit", String(max));
      res.set("X-RateLimit-Remaining", String(Math.max(max - count, 0)));

      if (count > max) {
        res.set("Retry-After", String(Math.ceil(windowMs / 1000)));

        return res.status(429).json({
          success: false,
          message,
          errors: {
            rateLimit: message,
          },
        });
      }

      return next();
    } catch (error) {
      // If Redis is briefly unavailable, fail open rather than locking
      // every user out of auth entirely - but log loudly so it's visible.
      console.error(`Rate limiter error [${keyPrefix}]:`, error);
      return next();
    }
  };
};

// Per-IP limiter: the most common case, guards endpoints purely by client IP.
const rateLimitByIp = (options) =>
  rateLimit({
    ...options,
    keyGenerator: (req) => req.ip || req.socket?.remoteAddress || "unknown",
  });

// Per-email limiter: combined with a per-IP limiter on sensitive endpoints
// (login, OTP verification) so a single attacker can't spray requests across
// many IPs to brute-force a single victim's account.
const rateLimitByEmail = (options) =>
  rateLimit({
    ...options,
    keyGenerator: (req) => {
      const email =
        typeof req.body?.email === "string"
          ? req.body.email.trim().toLowerCase()
          : "unknown";

      return email;
    },
  });

module.exports = {
  rateLimit,
  rateLimitByIp,
  rateLimitByEmail,
};
