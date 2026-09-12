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
    errors.push({ field: "name", message: "Name is required" });
    errors.push({ field: "email", message: "Email is required" });
    errors.push({ field: "password", message: "Password is required" });
    return errors;
  }

  if (typeof name !== "string" || !name) {
    errors.push({ field: "name", message: "Name is required" });
  } else {
    if (name.length < 2) {
      errors.push({
        field: "name",
        message: "Name must be at least 2 characters",
      });
    }
    if (name.length > NAME_MAX_LENGTH) {
      errors.push({
        field: "name",
        message: `Name must be at most ${NAME_MAX_LENGTH} characters`,
      });
    }
  }

  if (typeof email !== "string" || !email) {
    errors.push({ field: "email", message: "Email is required" });
  } else {
    if (email.length > EMAIL_MAX_LENGTH) {
      errors.push({
        field: "email",
        message: `Email must be at most ${EMAIL_MAX_LENGTH} characters`,
      });
    }
    if (!EMAIL_REGEX.test(email)) {
      errors.push({
        field: "email",
        message: "Email must be a valid email address",
      });
    }
  }

  if (typeof password !== "string") {
    errors.push({ field: "password", message: "Password is required" });
  } else {
    if (password.length < PASSWORD_MIN_LENGTH) {
      errors.push({
        field: "password",
        message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
      });
    }
    if (password.length > PASSWORD_MAX_LENGTH) {
      errors.push({
        field: "password",
        message: `Password must be at most ${PASSWORD_MAX_LENGTH} characters`,
      });
    }
  }

  return errors;
};

/**
 * Validates login fields and returns an array of field-level errors.
 * Only checks email and password; name is ignored.
 * Returns an empty array when both fields pass validation.
 */
export const validateUserLogin = ({ email, password } = {}) => {
  const errors = [];

  if (!email && !password) {
    errors.push({ field: "email", message: "Email is required" });
    errors.push({ field: "password", message: "Password is required" });
    return errors;
  }

  if (typeof email !== "string" || !email) {
    errors.push({ field: "email", message: "Email is required" });
  } else {
    if (email.length > EMAIL_MAX_LENGTH) {
      errors.push({
        field: "email",
        message: `Email must be at most ${EMAIL_MAX_LENGTH} characters`,
      });
    }
    if (!EMAIL_REGEX.test(email)) {
      errors.push({
        field: "email",
        message: "Email must be a valid email address",
      });
    }
  }

  if (typeof password !== "string") {
    errors.push({ field: "password", message: "Password is required" });
  } else {
    if (password.length < PASSWORD_MIN_LENGTH) {
      errors.push({
        field: "password",
        message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
      });
    }
    if (password.length > PASSWORD_MAX_LENGTH) {
      errors.push({
        field: "password",
        message: `Password must be at most ${PASSWORD_MAX_LENGTH} characters`,
      });
    }
  }

  return errors;
};
