// tests/unit/user.controller.test.js
import { jest } from "@jest/globals";

// 1. Mock the User model so registerUser never touches a real database
jest.unstable_mockModule("../../src/models/user.model.js", () => ({
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

// 2. Mock bcrypt so we never run real (slow) hashing in tests
jest.unstable_mockModule("bcryptjs", () => ({
  default: {
    hash: jest.fn(),
  },
}));

// 3. Import the controller AFTER the mocks are registered
const { registerUser } =
  await import("../../src/controllers/user.controller.js");
const User = (await import("../../src/models/user.model.js")).default;
const bcrypt = (await import("bcryptjs")).default;

// 4. Tiny helpers that build fake Express req/res objects
const mockRequest = (body) => ({ body });

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const validBody = {
  name: "John Doe",
  email: "john@example.com",
  password: "secret123",
};

const createdUserRow = {
  id: 1,
  name: "John Doe",
  email: "john@example.com",
  created_at: "2026-09-05T10:00:00.000Z",
  updated_at: "2026-09-05T10:00:00.000Z",
};

describe("registerUser Controller", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    // resetAllMocks also clears queued mockResolvedValueOnce values between tests
    jest.resetAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockRestore();
  });

  it("should register a new user and return 201 with the created user (no password)", async () => {
    // 1. No existing user, bcrypt hashes, create returns the new row
    User.findOne.mockResolvedValueOnce(null);
    bcrypt.hash.mockResolvedValueOnce("$2b$10$hashedPassword");
    User.create.mockResolvedValueOnce(createdUserRow);

    // 2. Fire the request
    const req = mockRequest(validBody);
    const res = mockResponse();
    await registerUser(req, res);

    // 3. ORM query used to look the email up
    expect(User.findOne).toHaveBeenCalledWith({
      where: { email: validBody.email },
    });

    // 4. bcrypt hashes the password with 10 rounds
    expect(bcrypt.hash).toHaveBeenCalledWith(validBody.password, 10);

    // 5. ORM query used to insert the user with the hashed password
    expect(User.create).toHaveBeenCalledWith({
      name: validBody.name,
      email: validBody.email,
      password: "$2b$10$hashedPassword",
    });

    // 6. Response is 201 with the user payload
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "User registered successfully",
      user: {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        createdAt: "2026-09-05T10:00:00.000Z",
        updatedAt: "2026-09-05T10:00:00.000Z",
      },
    });

    // 7. EDGE CASE: the password must NEVER leak into the response
    expect(res.json.mock.calls[0][0]).not.toHaveProperty("user.password");
    expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain(
      "$2b$10$hashedPassword",
    );
  });

  it("should return 400 when the name is missing", async () => {
    const req = mockRequest({
      email: validBody.email,
      password: validBody.password,
    });
    const res = mockResponse();
    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "All fields are required",
    });

    // Database must not be touched
    expect(User.findOne).not.toHaveBeenCalled();
    expect(User.create).not.toHaveBeenCalled();
  });

  it("should return 400 when the email is missing", async () => {
    const req = mockRequest({
      name: validBody.name,
      password: validBody.password,
    });
    const res = mockResponse();
    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "All fields are required",
    });
    expect(User.findOne).not.toHaveBeenCalled();
  });

  it("should return 400 when the password is missing", async () => {
    const req = mockRequest({
      name: validBody.name,
      email: validBody.email,
    });
    const res = mockResponse();
    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "All fields are required",
    });
    expect(User.findOne).not.toHaveBeenCalled();
  });

  it("should return 400 when a field is an empty string (edge case)", async () => {
    const req = mockRequest({
      name: "",
      email: validBody.email,
      password: validBody.password,
    });
    const res = mockResponse();
    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "All fields are required",
    });
  });

  it("should return 409 when the email is already registered", async () => {
    // 1. The ORM query finds an existing user
    User.findOne.mockResolvedValueOnce({ id: 9, email: validBody.email });

    const req = mockRequest(validBody);
    const res = mockResponse();
    await registerUser(req, res);

    // 2. Conflict response, and nothing else is executed
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: "Email already exists" });
    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(User.create).not.toHaveBeenCalled();
  });

  it("should return 500 when the findOne ORM query fails (database down)", async () => {
    User.findOne.mockRejectedValueOnce(new Error("MySQL connection lost"));

    const req = mockRequest(validBody);
    const res = mockResponse();
    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("should return 500 when bcrypt hashing fails (edge case)", async () => {
    User.findOne.mockResolvedValueOnce(null);
    bcrypt.hash.mockRejectedValueOnce(new Error("hash failed"));

    const req = mockRequest(validBody);
    const res = mockResponse();
    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
    expect(User.create).not.toHaveBeenCalled();
  });

  it("should return 500 when the create ORM query fails (edge case)", async () => {
    User.findOne.mockResolvedValueOnce(null);
    bcrypt.hash.mockResolvedValueOnce("$2b$10$hashedPassword");
    User.create.mockRejectedValueOnce(new Error("Duplicate entry"));

    const req = mockRequest(validBody);
    const res = mockResponse();
    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
