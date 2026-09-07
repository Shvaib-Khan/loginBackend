const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const NAME_MAX_LENGTH = 100;
export const EMAIL_MAX_LENGTH = 255;
export const PASSWORD_MIN_LENGTH = 6;
// bcrypt ignores everything past 72 bytes, so cap the raw input there
export const PASSWORD_MAX_LENGTH = 72;

/**
 * Validates registration fields and returns an array of field-level errors.
 * Returns an empty array when all fields pass validation.
 */
export const validateUserRegistration = ({ name, email, password } = {}) => {
  const errors = [];

  if (!name && !email && !password) {
    errors.push({ field: "name", message: "All fields are required" });
    errors.push({ field: "email", message: "All fields are required" });
    errors.push({ field: "password", message: "All fields are required" });
    return errors;
  }

  if (typeof name !== "string" || !name.trim()) {
    errors.push({ field: "name", message: "Name cannot be empty" });
  } else {
    const cleanName = name.trim();
    if (cleanName.length < 2) {
      errors.push({ field: "name", message: "Name must be at least 2 characters" });
    }
    if (cleanName.length > NAME_MAX_LENGTH) {
      errors.push({ field: "name", message: `Name must be at most ${NAME_MAX_LENGTH} characters` });
    }
  }

  if (typeof email !== "string" || !email.trim()) {
    errors.push({ field: "email", message: "Email cannot be empty" });
  } else {
    const cleanEmail = email.trim();
    if (cleanEmail.length > EMAIL_MAX_LENGTH) {
      errors.push({ field: "email", message: `Email must be at most ${EMAIL_MAX_LENGTH} characters` });
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      errors.push({ field: "email", message: "Email must be a valid email address" });
    }
  }

  if (typeof password !== "string") {
    errors.push({ field: "password", message: "Password must be a string" });
  } else {
    if (password.length < PASSWORD_MIN_LENGTH) {
      errors.push({ field: "password", message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` });
    }
    if (password.length > PASSWORD_MAX_LENGTH) {
      errors.push({ field: "password", message: `Password must be at most ${PASSWORD_MAX_LENGTH} characters` });
    }
  }

  return errors;
};
