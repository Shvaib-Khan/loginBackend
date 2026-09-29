import { Router } from "express";
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getMe,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { loginRateLimiterMiddleware } from "../middlewares/rateLimiter.middleware.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginRateLimiterMiddleware, loginUser);
router.route("/refresh").post(refreshAccessToken);
router.route("/logout").post(logoutUser);
router.route("/me").get(verifyJWT, getMe);

export default router;
