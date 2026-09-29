import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyAccessToken } from "../services/token.service.js";
import User from "../models/user.model.js";

const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = verifyAccessToken(token);

    const user = await User.findOne({ where: { email: decodedToken.email } });

    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }

    // Check if user's refresh token exists in DB (user is still logged in)
    if (!user.refresh_token) {
      throw new ApiError(401, "Session expired. Please login again.");
    }

    delete user.password;
    delete user.refresh_token;

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Access token expired");
    }
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});

export { verifyJWT };