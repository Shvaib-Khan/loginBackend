import { jest } from "@jest/globals";

jest.unstable_mockModule("../../src/models/user.model.js", () => ({
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.unstable_mockModule("bcryptjs", () => ({
  default: {
    hash: jest.fn(),
  },
}));

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

    expect(User.findOne).toHaveBeenCalledWith({
      where: { email: validBody.email },
    });

    expect(bcrypt.hash).toHaveBeenCalledWith(validBody.password, 10);

    expect(User.create).toHaveBeenCalledWith({
      name: validBody.name,
      email: validBody.email,
      password: "$2b$10$hashedPassword",
    });

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
    User.findOne.mockResolvedValueOnce({ id: 9, email: validBody.email });

    const req = mockRequest(validBody);
    const res = mockResponse();
    await registerUser(req, res);

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
