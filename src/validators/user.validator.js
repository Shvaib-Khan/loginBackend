const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const NAME_MAX_LENGTH = 100;
export const EMAIL_MAX_LENGTH = 255;
export const PASSWORD_MIN_LENGTH = 6;
// bcrypt ignores everything past 72 bytes, so cap the raw input there
export const PASSWORD_MAX_LENGTH = 72;
export const validateUserRegistration = ({ name, email, password } = {}) => {
  if (!name || !email || !password) {
    return "All fields are required";
  }
  if (typeof name !== "string" || !name.trim()) {
    return "Name cannot be empty";
  }
  if (name.trim().length < 2) {
    return "Name must be at least 2 characters";
  }
  if (name.trim().length > NAME_MAX_LENGTH) {
    return `Name must be at most ${NAME_MAX_LENGTH} characters`;
  }
  if (typeof email !== "string" || !email.trim()) {
    return "Email cannot be empty";
  }
  if (email.trim().length > EMAIL_MAX_LENGTH) {
    return `Email must be at most ${EMAIL_MAX_LENGTH} characters`;
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return "Email must be a valid email address";
  }
  if (typeof password !== "string") {
    return "Password must be a string";
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters`;
  }

  return null;
};
