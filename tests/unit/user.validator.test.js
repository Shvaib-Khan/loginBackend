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
  it("should return null when every field is valid", () => {
    expect(validateUserRegistration(validBody)).toBeNull();
  });

  it("should return null when name/email carry surrounding whitespace", () => {
    expect(
      validateUserRegistration({
        name: "  John Doe  ",
        email: "  john@example.com  ",
        password: "secret123",
      }),
    ).toBeNull();
  });

  it("should flag a missing name as required", () => {
    const { name, ...rest } = validBody;
    expect(validateUserRegistration(rest)).toBe("All fields are required");
  });

  it("should flag a missing email as required", () => {
    const { email, ...rest } = validBody;
    expect(validateUserRegistration(rest)).toBe("All fields are required");
  });

  it("should flag a missing password as required", () => {
    const { password, ...rest } = validBody;
    expect(validateUserRegistration(rest)).toBe("All fields are required");
  });

  it("should flag an undefined body as required", () => {
    expect(validateUserRegistration(undefined)).toBe("All fields are required");
  });

  it("should reject a whitespace-only name", () => {
    expect(validateUserRegistration({ ...validBody, name: "   " })).toBe(
      "Name cannot be empty",
    );
  });

  it("should reject a single-character name", () => {
    expect(validateUserRegistration({ ...validBody, name: "A" })).toBe(
      "Name must be at least 2 characters",
    );
  });

  it("should reject a name longer than 100 characters", () => {
    expect(
      validateUserRegistration({ ...validBody, name: "J".repeat(101) }),
    ).toBe("Name must be at most 100 characters");
  });

  it("should accept a name of exactly 100 characters", () => {
    expect(
      validateUserRegistration({ ...validBody, name: "J".repeat(100) }),
    ).toBeNull();
  });

  it("should reject a whitespace-only email", () => {
    expect(validateUserRegistration({ ...validBody, email: "   " })).toBe(
      "Email cannot be empty",
    );
  });

  it("should reject an email without a domain extension", () => {
    expect(
      validateUserRegistration({ ...validBody, email: "john@example" }),
    ).toBe("Email must be a valid email address");
  });

  it("should reject an email without an @ symbol", () => {
    expect(
      validateUserRegistration({ ...validBody, email: "john.example.com" }),
    ).toBe("Email must be a valid email address");
  });

  it("should reject an email longer than 255 characters", () => {
    expect(
      validateUserRegistration({
        ...validBody,
        email: `${"a".repeat(250)}@example.com`,
      }),
    ).toBe("Email must be at most 255 characters");
  });

  it("should accept a 255-character email", () => {
    const email = `${"a".repeat(243)}@example.com`;
    expect(email.length).toBe(255);
    expect(validateUserRegistration({ ...validBody, email })).toBeNull();
  });

  it("should reject a non-string password", () => {
    expect(validateUserRegistration({ ...validBody, password: 123456 })).toBe(
      "Password must be a string",
    );
  });

  it("should reject a password shorter than 6 characters", () => {
    expect(validateUserRegistration({ ...validBody, password: "12345" })).toBe(
      "Password must be at least 6 characters",
    );
  });

  it("should reject a password longer than 72 characters", () => {
    expect(
      validateUserRegistration({ ...validBody, password: "p".repeat(73) }),
    ).toBe("Password must be at most 72 characters");
  });

  it("should accept a password of exactly 6 characters", () => {
    expect(
      validateUserRegistration({ ...validBody, password: "123456" }),
    ).toBeNull();
  });

  it("should accept a password of exactly 72 characters", () => {
    expect(
      validateUserRegistration({ ...validBody, password: "p".repeat(72) }),
    ).toBeNull();
  });
});
