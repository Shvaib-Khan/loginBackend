import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redisClient } from "../config/redis.js";
import {
  RATE_LIMITER_WINDOW_MS,
  RATE_LIMITER_MAX_ATTEMPTS,
} from "../config/appConfig.js";

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
      windowMs: RATE_LIMITER_WINDOW_MS,
      limit: RATE_LIMITER_MAX_ATTEMPTS,
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
