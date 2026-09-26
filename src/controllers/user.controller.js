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

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body ?? {};

  const cleanName = typeof name === "string" ? name.trim() : name;
  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : email;

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

  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : email;

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

  const sanitizedUser = user.toJSON();
  delete sanitizedUser.password;
  delete sanitizedUser.refresh_token;

  res
    .status(200)
    .json(new ApiResponse(200, sanitizedUser, "User logged in successfully"));
});

export { registerUser, loginUser };
