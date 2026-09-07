import { jest } from "@jest/globals";

jest.unstable_mockModule("../../src/models/user.model.js", () => ({
  default: {},
}));

const { validateUserRegistration } =
  await import("../../src/validators/user.validator.js");

const validBody = {
  name: "John Doe",
  email: "john@example.com",
  password: "secret123",
};

describe("validateUserRegistration Validator", () => {
  it("should return an empty array when every field is valid", () => {
    expect(validateUserRegistration(validBody)).toEqual([]);
  });

  it("should return an empty array when name/email carry surrounding whitespace", () => {
    expect(
      validateUserRegistration({
        name: "  John Doe  ",
        email: "  john@example.com  ",
        password: "secret123",
      }),
    ).toEqual([]);
  });

  it("should flag all fields as required when no fields are provided", () => {
    const result = validateUserRegistration({});
    expect(result).toHaveLength(3);
    expect(result).toContainEqual({ field: "name", message: "All fields are required" });
    expect(result).toContainEqual({ field: "email", message: "All fields are required" });
    expect(result).toContainEqual({ field: "password", message: "All fields are required" });
  });

  it("should flag an undefined body as required for all fields", () => {
    const result = validateUserRegistration(undefined);
    expect(result).toHaveLength(3);
    expect(result.some((e) => e.field === "name" && e.message === "All fields are required")).toBe(true);
    expect(result.some((e) => e.field === "email" && e.message === "All fields are required")).toBe(true);
    expect(result.some((e) => e.field === "password" && e.message === "All fields are required")).toBe(true);
  });

  it("should reject a whitespace-only name", () => {
    const result = validateUserRegistration({ ...validBody, name: "   " });
    expect(result).toContainEqual({ field: "name", message: "Name cannot be empty" });
  });

  it("should reject a single-character name", () => {
    const result = validateUserRegistration({ ...validBody, name: "A" });
    expect(result).toContainEqual({ field: "name", message: "Name must be at least 2 characters" });
  });

  it("should reject a name longer than 100 characters", () => {
    const result = validateUserRegistration({ ...validBody, name: "J".repeat(101) });
    expect(result).toContainEqual({ field: "name", message: "Name must be at most 100 characters" });
  });

  it("should accept a name of exactly 100 characters", () => {
    const result = validateUserRegistration({ ...validBody, name: "J".repeat(100) });
    expect(result).toEqual([]);
  });

  it("should reject a whitespace-only email", () => {
    const result = validateUserRegistration({ ...validBody, email: "   " });
    expect(result).toContainEqual({ field: "email", message: "Email cannot be empty" });
  });

  it("should reject an email without a domain extension", () => {
    const result = validateUserRegistration({ ...validBody, email: "john@example" });
    expect(result).toContainEqual({ field: "email", message: "Email must be a valid email address" });
  });

  it("should reject an email without an @ symbol", () => {
    const result = validateUserRegistration({ ...validBody, email: "john.example.com" });
    expect(result).toContainEqual({ field: "email", message: "Email must be a valid email address" });
  });

  it("should reject an email longer than 255 characters", () => {
    const result = validateUserRegistration({
      ...validBody,
      email: `${"a".repeat(250)}@example.com`,
    });
    expect(result).toContainEqual({ field: "email", message: "Email must be at most 255 characters" });
  });

  it("should accept a 255-character email", () => {
    const email = `${"a".repeat(243)}@example.com`;
    expect(email.length).toBe(255);
    const result = validateUserRegistration({ ...validBody, email });
    expect(result).toEqual([]);
  });

  it("should reject a non-string password", () => {
    const result = validateUserRegistration({ ...validBody, password: 123456 });
    expect(result).toContainEqual({ field: "password", message: "Password must be a string" });
  });

  it("should reject a password shorter than 6 characters", () => {
    const result = validateUserRegistration({ ...validBody, password: "12345" });
    expect(result).toContainEqual({ field: "password", message: "Password must be at least 6 characters" });
  });

  it("should reject a password longer than 72 characters", () => {
    const result = validateUserRegistration({ ...validBody, password: "p".repeat(73) });
    expect(result).toContainEqual({ field: "password", message: "Password must be at most 72 characters" });
  });

  it("should accept a password of exactly 6 characters", () => {
    const result = validateUserRegistration({ ...validBody, password: "123456" });
    expect(result).toEqual([]);
  });

  it("should accept a password of exactly 72 characters", () => {
    const result = validateUserRegistration({ ...validBody, password: "p".repeat(72) });
    expect(result).toEqual([]);
  });

  it("should collect multiple validation errors at once", () => {
    const result = validateUserRegistration({
      name: "A",
      email: "bad-email",
      password: "123",
    });
    expect(result.length).toBeGreaterThan(1);
    expect(result.some((e) => e.field === "name")).toBe(true);
    expect(result.some((e) => e.field === "email")).toBe(true);
    expect(result.some((e) => e.field === "password")).toBe(true);
  });
});
