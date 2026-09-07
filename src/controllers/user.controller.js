import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { validateUserRegistration } from "../validators/user.validator.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const validationErrors = validateUserRegistration({ name, email, password });
  if (validationErrors.length) {
    throw new ApiError(422, "Validation failed", validationErrors);
  }

  const cleanName = name.trim();
  const cleanEmail = email.trim();

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

  const foundUser = await User.findOne({ where: { email: cleanEmail } });
  if (!foundUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  delete foundUser.password;
  res
    .status(201)
    .json(new ApiResponse(201, foundUser, "User registered successfully"));
});

export { registerUser };
