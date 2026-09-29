import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import {
  validateUserRegistration,
  validateUserLogin,
} from "../validators/user.validator.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { recordLoginAttempt } from "../services/loginAttempt.service.js";
import {
  generateTokens,
  verifyRefreshToken,
} from "../services/token.service.js";
import cookieOptions from "../constants.js";

const setAuthCookies = (res, accessToken, refreshToken) => {
  const accessCookieOptions = {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: "/",
  };

  const refreshCookieOptions = {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  };

  res.cookie("accessToken", accessToken, accessCookieOptions);
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
};

const clearAuthCookies = (res) => {
  res.clearCookie("accessToken", {
    path: "/",
  });
  res.clearCookie("refreshToken", {
    path: "/",
  });
};

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body ?? {};

  const cleanName = typeof name === "string" ? name.trim() : name;
  const cleanEmail =
    typeof email === "string" ? email.trim().toLowerCase() : email;

  const validationErrors = validateUserRegistration({
    name: cleanName,
    email: cleanEmail,
    password,
  });
  if (validationErrors.length) {
    throw new ApiError(422, "Validation failed", validationErrors);
  }

  const existingUser = await User.findOne({ where: { email: cleanEmail } });
  if (existingUser) {
    throw new ApiError(409, "Email already exists", [
      { field: "email", message: "Email already exists" },
    ]);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const createdUser = await User.create({
    name: cleanName,
    email: cleanEmail,
    password: hashedPassword,
  });

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }
  const foundUser = createdUser.toJSON();

  delete foundUser.password;
  res
    .status(201)
    .json(new ApiResponse(201, foundUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body ?? {};

  const cleanEmail =
    typeof email === "string" ? email.trim().toLowerCase() : email;

  const validationErrors = validateUserLogin({
    email: cleanEmail,
    password,
  });
  if (validationErrors.length) {
    throw new ApiError(422, "Validation failed", validationErrors);
  }

  const user = await User.findOne({ where: { email: cleanEmail } });

  if (!user) {
    await recordLoginAttempt(cleanEmail, req.ip, "FAILED", "User not found");
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    await recordLoginAttempt(cleanEmail, req.ip, "FAILED", "Invalid password");
    throw new ApiError(401, "Invalid email or password");
  }

  await recordLoginAttempt(cleanEmail, req.ip, "SUCCESS", "Login successful");

  // Generate access and refresh tokens
  const { accessToken, refreshToken } = generateTokens(user);

  // Store refresh token in database for session management
  await user.update({ refresh_token: refreshToken });

  // Set secure httpOnly cookies
  setAuthCookies(res, accessToken, refreshToken);

  const sanitizedUser = user.toJSON();
  delete sanitizedUser.password;
  delete sanitizedUser.refresh_token;

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: sanitizedUser, accessToken },
        "User logged in successfully",
      ),
    );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken =
    req.cookies?.refreshToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!refreshToken) {
    throw new ApiError(401, "Refresh token missing");
  }

  const decoded = verifyRefreshToken(refreshToken);

  const user = await User.findOne({
    where: { email: decoded.email, refresh_token: refreshToken },
  });

  if (!user) {
    throw new ApiError(401, "Invalid refresh token or session expired");
  }

  // Generate new tokens
  const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
    generateTokens(user);

  // Update refresh token in database (rotation)
  await user.update({ refresh_token: newRefreshToken });

  // Set new cookies
  setAuthCookies(res, newAccessToken, newRefreshToken);

  const sanitizedUser = user.toJSON();
  delete sanitizedUser.password;
  delete sanitizedUser.refresh_token;

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: sanitizedUser, accessToken: newAccessToken },
        "Token refreshed successfully",
      ),
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const refreshToken =
    req.cookies?.refreshToken ||
    req.body?.refreshToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (refreshToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      await User.update(
        { refresh_token: null },
        { where: { email: decoded.email } },
      );
    } catch {
      // If token is invalid, just clear cookies anyway
    }
  }

  // Clear authentication cookies
  clearAuthCookies(res);

  res
    .status(200)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const getMe = asyncHandler(async (req, res) => {
  const user = req.user;

  res
    .status(200)
    .json(new ApiResponse(200, user, "User profile retrieved successfully"));
});

export { registerUser, loginUser, refreshAccessToken, logoutUser, getMe };
