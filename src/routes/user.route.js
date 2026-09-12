import { Router } from "express";
import { registerUser, loginUser } from "../controllers/user.controller.js";
import { loginRateLimiterMiddleware } from "../middlewares/rateLimiter.middleware.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginRateLimiterMiddleware, loginUser);

export default router;
