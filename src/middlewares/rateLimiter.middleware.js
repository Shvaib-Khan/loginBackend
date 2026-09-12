import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redisClient } from "../config/redis.js";

let storePromise = null;
let loginRateLimiter = null;

const getLoginRateLimiter = async () => {
  if (!loginRateLimiter) {
    if (!storePromise) {
      storePromise = Promise.resolve().then(() => new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
      }));
    }

    const store = await storePromise;

    loginRateLimiter = rateLimit({
      windowMs: 60 * 1000,
      limit: 5,
      standardHeaders: true,
      legacyHeaders: false,
      store,
      keyGenerator: (req) => ipKeyGenerator(req),
      handler: (req, res, next, options) => {
        res.status(429).json({
          success: false,
          message: "Too many login attempts. Please try again later.",
          data: null,
          errors: [],
        });
      },
      skip: (req) => !req.ip,
    });
  }

  return loginRateLimiter;
};

export const loginRateLimiterMiddleware = (req, res, next) => {
  getLoginRateLimiter().then((limiter) => limiter(req, res, next)).catch(next);
};

export { getLoginRateLimiter };
