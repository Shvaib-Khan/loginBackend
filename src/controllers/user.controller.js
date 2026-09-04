import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { validateUserRegistration } from "../validators/user.validator.js";

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const validationMessage = validateUserRegistration({
      name,
      email,
      password,
    });
    if (validationMessage) {
      return res.status(422).json({ message: validationMessage });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    const existingUser = await User.findOne({ where: { email: cleanEmail } });
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        createdAt: createdUser.created_at,
        updatedAt: createdUser.updated_at,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export { registerUser };
