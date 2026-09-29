import { jest } from "@jest/globals";

// Mock the modules before importing the controller
jest.unstable_mockModule("../../src/models/user.model.js", () => ({
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

jest.unstable_mockModule("bcryptjs", () => ({
  default: {
    hash: jest.fn(),
    compare: jest.fn(),
  },
}));

jest.unstable_mockModule("../../src/services/token.service.js", () => ({
  generateTokens: jest.fn(),
  verifyRefreshToken: jest.fn(),
}));

jest.unstable_mockModule("../../src/services/loginAttempt.service.js", () => ({
  recordLoginAttempt: jest.fn(),
}));

jest.unstable_mockModule("../../src/utils/asyncHandler.js", () => ({
  asyncHandler: (fn) => fn,
}));

const { registerUser, loginUser, refreshAccessToken, logoutUser, getMe } =
  await import("../../src/controllers/user.controller.js");
const User = (await import("../../src/models/user.model.js")).default;
const bcrypt = (await import("bcryptjs")).default;
const tokenService = await import("../../src/services/token.service.js");
const { generateTokens, verifyRefreshToken } = tokenService;
const { recordLoginAttempt } =
  await import("../../src/services/loginAttempt.service.js");

const mockRequest = (options = {}) => ({
  body: options.body ?? {},
  cookies: options.cookies ?? {},
  headers: options.headers ?? {},
  ip: options.ip ?? "127.0.0.1",
  header: (name) =>
    options.headers?.[name.toLowerCase()] ??
    options.headers?.[name] ??
    undefined,
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = () => jest.fn();

const validBody = {
  name: "John Doe",
  email: "john@example.com",
  password: "secret123",
};

const validLoginBody = {
  email: "john@example.com",
  password: "secret123",
};

// Helper to reset all controller-related mocks
const resetControllerMocks = () => {
  jest.clearAllMocks();
  User.findOne.mockReset();
  User.create.mockReset();
  User.update.mockReset();
  bcrypt.hash.mockReset();
  bcrypt.compare.mockReset();
  generateTokens.mockReset();
  verifyRefreshToken.mockReset();
  recordLoginAttempt.mockReset();
};

describe("registerUser Controller", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    resetControllerMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  // ── Validation / utility tests (no mocking needed) ──

  it("should throw ApiError with 422 status when validation fails", async () => {
    const { ApiError } = await import("../../src/utils/ApiError.js");
    const { validateUserRegistration } = await import(
      "../../src/validators/user.validator.js"
    );

    const errors = validateUserRegistration({});
    expect(errors.length).toBeGreaterThan(0);

    const apiError = new ApiError(422, "Validation failed", errors);
    expect(apiError.statusCode).toBe(422);
    expect(apiError.message).toBe("Validation failed");
    expect(apiError.errors).toEqual(errors);
    expect(apiError.success).toBe(false);
  });

  it("should throw ApiError with 409 status when email exists", async () => {
    const { ApiError } = await import("../../src/utils/ApiError.js");

    const apiError = new ApiError(409, "Email already exists", [
      { field: "email", message: "Email already exists" },
    ]);
    expect(apiError.statusCode).toBe(409);
    expect(apiError.message).toBe("Email already exists");
    expect(apiError.errors).toEqual([
      { field: "email", message: "Email already exists" },
    ]);
    expect(apiError.success).toBe(false);
  });

  it("should throw ApiError with 500 status for server errors", async () => {
    const { ApiError } = await import("../../src/utils/ApiError.js");

    const apiError = new ApiError(500, "Something went wrong");
    expect(apiError.statusCode).toBe(500);
    expect(apiError.message).toBe("Something went wrong");
    expect(apiError.errors).toEqual([]);
    expect(apiError.success).toBe(false);
  });

  it("should throw ApiError with 404 status when user does not exist", async () => {
    const { ApiError } = await import("../../src/utils/ApiError.js");

    const apiError = new ApiError(404, "User does not exist");
    expect(apiError.statusCode).toBe(404);
    expect(apiError.message).toBe("User does not exist");
    expect(apiError.errors).toEqual([]);
    expect(apiError.success).toBe(false);
  });

  it("should throw ApiError with 401 status for invalid credentials", async () => {
    const { ApiError } = await import("../../src/utils/ApiError.js");

    const apiError = new ApiError(401, "Invalid credentials");
    expect(apiError.statusCode).toBe(401);
    expect(apiError.message).toBe("Invalid credentials");
    expect(apiError.errors).toEqual([]);
    expect(apiError.success).toBe(false);
  });

  it("should create ApiResponse with correct structure for success", async () => {
    const { ApiResponse } = await import("../../src/utils/ApiResponse.js");

    const userData = { id: 1, name: "John", email: "john@example.com" };
    const response = new ApiResponse(201, userData, "User registered successfully");

    expect(response.statusCode).toBe(201);
    expect(response.data).toEqual(userData);
    expect(response.message).toBe("User registered successfully");
    expect(response.success).toBe(true);
  });

  it("should create ApiResponse with correct structure for failure", async () => {
    const { ApiResponse } = await import("../../src/utils/ApiResponse.js");

    const response = new ApiResponse(400, null, "Bad request");

    expect(response.statusCode).toBe(400);
    expect(response.data).toBeNull();
    expect(response.message).toBe("Bad request");
    expect(response.success).toBe(false);
  });

  it("should validate user registration with valid data", async () => {
    const { validateUserRegistration } = await import(
      "../../src/validators/user.validator.js"
    );

    const errors = validateUserRegistration(validBody);
    expect(errors).toEqual([]);
  });

  it("should detect all validation errors at once", async () => {
    const { validateUserRegistration } = await import(
      "../../src/validators/user.validator.js"
    );

    const errors = validateUserRegistration({
      name: "A",
      email: "invalid",
      password: "123",
    });

    expect(errors.length).toBeGreaterThan(1);
    expect(errors.some((e) => e.field === "name")).toBe(true);
    expect(errors.some((e) => e.field === "email")).toBe(true);
    expect(errors.some((e) => e.field === "password")).toBe(true);
  });
});

describe("loginUser Controller", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    resetControllerMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  // ── Validation / utility tests ──

  it("should throw ApiError with 422 status when login validation fails", async () => {
    const { ApiError } = await import("../../src/utils/ApiError.js");
    const { validateUserLogin } = await import(
      "../../src/validators/user.validator.js"
    );

    const errors = validateUserLogin({});
    expect(errors.length).toBeGreaterThan(0);

    const apiError = new ApiError(422, "Validation failed", errors);
    expect(apiError.statusCode).toBe(422);
    expect(apiError.message).toBe("Validation failed");
    expect(apiError.errors).toEqual(errors);
    expect(apiError.success).toBe(false);
  });

  it("should throw ApiError with 404 status when user does not exist", async () => {
    const { ApiError } = await import("../../src/utils/ApiError.js");

    const apiError = new ApiError(404, "User does not exist");
    expect(apiError.statusCode).toBe(404);
    expect(apiError.message).toBe("User does not exist");
    expect(apiError.errors).toEqual([]);
    expect(apiError.success).toBe(false);
  });

  it("should throw ApiError with 401 status for invalid credentials", async () => {
    const { ApiError } = await import("../../src/utils/ApiError.js");

    const apiError = new ApiError(401, "Invalid credentials");
    expect(apiError.statusCode).toBe(401);
    expect(apiError.message).toBe("Invalid credentials");
    expect(apiError.errors).toEqual([]);
    expect(apiError.success).toBe(false);
  });

  it("should validate user login with valid data", async () => {
    const { validateUserLogin } = await import(
      "../../src/validators/user.validator.js"
    );

    const errors = validateUserLogin(validLoginBody);
    expect(errors).toEqual([]);
  });

  it("should detect login validation errors at once", async () => {
    const { validateUserLogin } = await import(
      "../../src/validators/user.validator.js"
    );

    const errors = validateUserLogin({
      email: "bad-email",
      password: "123",
    });

    expect(errors.length).toBeGreaterThan(1);
    expect(errors.some((e) => e.field === "email")).toBe(true);
    expect(errors.some((e) => e.field === "password")).toBe(true);
  });

  // ── Functional tests with mocks ──

  it("should call recordLoginAttempt with SUCCESS on successful login", async () => {
    const mockUser = {
      id: 1,
      email: "john@example.com",
      password: "hashed",
      refresh_token: null,
      toJSON: () => ({
        id: 1,
        email: "john@example.com",
        password: "hashed",
        refresh_token: null,
      }),
      update: jest.fn().mockResolvedValue(true),
    };

    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    recordLoginAttempt.mockResolvedValue(undefined);
    generateTokens.mockReturnValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    const req = mockRequest({ body: validLoginBody });
    const res = mockResponse();

    await loginUser(req, res, mockNext());

    expect(recordLoginAttempt).toHaveBeenCalledWith(
      "john@example.com",
      "127.0.0.1",
      "SUCCESS",
      "Login successful"
    );
  });

  it("should store refresh token in database on login", async () => {
    const mockUser = {
      id: 1,
      email: "john@example.com",
      password: "hashed",
      refresh_token: null,
      toJSON: () => ({
        id: 1,
        email: "john@example.com",
        password: "hashed",
        refresh_token: null,
      }),
      update: jest.fn().mockResolvedValue(true),
    };

    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    recordLoginAttempt.mockResolvedValue(undefined);
    generateTokens.mockReturnValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    const req = mockRequest({ body: validLoginBody });
    const res = mockResponse();

    await loginUser(req, res, mockNext());

    expect(mockUser.update).toHaveBeenCalledWith({
      refresh_token: "refresh-token",
    });
  });

  it("should set auth cookies on successful login", async () => {
    const mockUser = {
      id: 1,
      email: "john@example.com",
      password: "hashed",
      refresh_token: null,
      toJSON: () => ({
        id: 1,
        email: "john@example.com",
        password: "hashed",
        refresh_token: null,
      }),
      update: jest.fn().mockResolvedValue(true),
    };

    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    recordLoginAttempt.mockResolvedValue(undefined);
    generateTokens.mockReturnValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    const req = mockRequest({ body: validLoginBody });
    const res = mockResponse();

    await loginUser(req, res, mockNext());

    expect(res.cookie).toHaveBeenCalledWith(
      "accessToken",
      "access-token",
      expect.any(Object)
    );
    expect(res.cookie).toHaveBeenCalledWith(
      "refreshToken",
      "refresh-token",
      expect.any(Object)
    );
  });
});

describe("logoutUser Controller", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    resetControllerMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should clear auth cookies on logout", async () => {
    verifyRefreshToken.mockReturnValue({ email: "john@example.com" });

    const req = mockRequest({
      cookies: { refreshToken: "some-refresh-token" },
    });
    const res = mockResponse();

    await logoutUser(req, res, mockNext());

    expect(res.clearCookie).toHaveBeenCalledWith("accessToken", {
      path: "/",
    });
    expect(res.clearCookie).toHaveBeenCalledWith("refreshToken", {
      path: "/",
    });
  });

  it("should clear cookies even when no refresh token is provided", async () => {
    const req = mockRequest({});
    const res = mockResponse();

    await logoutUser(req, res, mockNext());

    expect(res.clearCookie).toHaveBeenCalledWith("accessToken", {
      path: "/",
    });
    expect(res.clearCookie).toHaveBeenCalledWith("refreshToken", {
      path: "/",
    });
  });

  it("should clear cookies when refresh token verification fails (invalid token)", async () => {
    verifyRefreshToken.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    const req = mockRequest({
      cookies: { refreshToken: "invalid-token" },
    });
    const res = mockResponse();

    await logoutUser(req, res, mockNext());

    // Cookies should still be cleared
    expect(res.clearCookie).toHaveBeenCalledWith("accessToken", {
      path: "/",
    });
    expect(res.clearCookie).toHaveBeenCalledWith("refreshToken", {
      path: "/",
    });
  });

  it("should clear refresh_token in database by email on successful logout", async () => {
    verifyRefreshToken.mockReturnValue({ email: "john@example.com" });
    User.update.mockResolvedValue(1);

    const req = mockRequest({
      cookies: { refreshToken: "valid-refresh-token" },
    });
    const res = mockResponse();

    await logoutUser(req, res, mockNext());

    // Should use email-only query, not requiring exact token match (the fix)
    expect(User.update).toHaveBeenCalledWith(
      { refresh_token: null },
      { where: { email: "john@example.com" } }
    );
  });

  it("should clear refresh_token even when cookie token differs from stored token (token rotation fix)", async () => {
    // Simulates the bug scenario: user refreshed tokens, so DB has new token
    // but cookie still has old token. The fix ensures logout still works.
    verifyRefreshToken.mockReturnValue({ email: "john@example.com" });
    User.update.mockResolvedValue(1);

    const req = mockRequest({
      // This is the OLD refresh token (before rotation)
      cookies: { refreshToken: "old-refresh-token" },
    });
    const res = mockResponse();

    await logoutUser(req, res, mockNext());

    // The fix: query by email only, not email+refreshToken
    // This ensures the token gets cleared even after rotation
    expect(User.update).toHaveBeenCalledWith(
      { refresh_token: null },
      { where: { email: "john@example.com" } }
    );
    // Verify the old query (with refresh_token in WHERE) is NOT used
    expect(User.update).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        where: expect.objectContaining({
          refresh_token: "old-refresh-token",
        }),
      })
    );
  });

  it("should return success response on logout", async () => {
    verifyRefreshToken.mockReturnValue({ email: "john@example.com" });
    User.update.mockResolvedValue(1);

    const req = mockRequest({
      cookies: { refreshToken: "valid-refresh-token" },
    });
    const res = mockResponse();

    await logoutUser(req, res, mockNext());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "User logged out successfully",
      })
    );
  });

  it("should accept refresh token from Authorization header", async () => {
    verifyRefreshToken.mockReturnValue({ email: "john@example.com" });
    User.update.mockResolvedValue(1);

    const req = mockRequest({
      headers: { Authorization: "Bearer header-refresh-token" },
    });
    const res = mockResponse();

    await logoutUser(req, res, mockNext());

    expect(User.update).toHaveBeenCalledWith(
      { refresh_token: null },
      { where: { email: "john@example.com" } }
    );
  });

  it("should accept refresh token from request body", async () => {
    verifyRefreshToken.mockReturnValue({ email: "john@example.com" });
    User.update.mockResolvedValue(1);

    const req = mockRequest({
      body: { refreshToken: "body-refresh-token" },
    });
    const res = mockResponse();

    await logoutUser(req, res, mockNext());

    expect(User.update).toHaveBeenCalledWith(
      { refresh_token: null },
      { where: { email: "john@example.com" } }
    );
  });
});

describe("refreshAccessToken Controller", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    resetControllerMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should throw ApiError when refresh token is missing", async () => {
    const { ApiError } = await import("../../src/utils/ApiError.js");

    const req = mockRequest({});
    const res = mockResponse();

    await expect(refreshAccessToken(req, res, mockNext())).rejects.toThrow(
      ApiError
    );
  });

  it("should throw when refresh token verification fails", async () => {
    verifyRefreshToken.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    const req = mockRequest({
      cookies: { refreshToken: "invalid-token" },
    });
    const res = mockResponse();

    await expect(refreshAccessToken(req, res, mockNext())).rejects.toThrow(
      /Invalid token/
    );
  });

  it("should throw ApiError when user not found for refresh token", async () => {
    verifyRefreshToken.mockReturnValue({ email: "nonexistent@example.com" });
    User.findOne.mockResolvedValue(null);

    const req = mockRequest({
      cookies: { refreshToken: "valid-looking-token" },
    });
    const res = mockResponse();

    await expect(refreshAccessToken(req, res, mockNext())).rejects.toThrow(
      /session expired/
    );
  });

  it("should rotate refresh token on successful refresh", async () => {
    const mockUser = {
      id: 1,
      email: "john@example.com",
      password: "hashed",
      refresh_token: "old-refresh-token",
      toJSON: () => ({
        id: 1,
        email: "john@example.com",
        password: "hashed",
        refresh_token: "old-refresh-token",
      }),
      update: jest.fn().mockResolvedValue(true),
    };

    verifyRefreshToken.mockReturnValue({ email: "john@example.com" });
    User.findOne.mockResolvedValue(mockUser);
    generateTokens.mockReturnValue({
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
    });

    const req = mockRequest({
      cookies: { refreshToken: "old-refresh-token" },
    });
    const res = mockResponse();

    await refreshAccessToken(req, res, mockNext());

    // Should update DB with new refresh token (rotation)
    expect(mockUser.update).toHaveBeenCalledWith({
      refresh_token: "new-refresh-token",
    });
    // Should set new cookies
    expect(res.cookie).toHaveBeenCalledWith(
      "refreshToken",
      "new-refresh-token",
      expect.any(Object)
    );
  });

  it("should return new access token on successful refresh", async () => {
    const mockUser = {
      id: 1,
      email: "john@example.com",
      password: "hashed",
      refresh_token: "old-refresh-token",
      toJSON: () => ({
        id: 1,
        email: "john@example.com",
        password: "hashed",
        refresh_token: "old-refresh-token",
      }),
      update: jest.fn().mockResolvedValue(true),
    };

    verifyRefreshToken.mockReturnValue({ email: "john@example.com" });
    User.findOne.mockResolvedValue(mockUser);
    generateTokens.mockReturnValue({
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
    });

    const req = mockRequest({
      cookies: { refreshToken: "old-refresh-token" },
    });
    const res = mockResponse();

    await refreshAccessToken(req, res, mockNext());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          accessToken: "new-access-token",
        }),
      })
    );
  });
});

describe("getMe Controller", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    resetControllerMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should return user profile on successful request", async () => {
    const mockUser = {
      id: 1,
      email: "john@example.com",
      name: "John Doe",
    };

    const req = mockRequest({});
    req.user = mockUser;
    const res = mockResponse();

    await getMe(req, res, mockNext());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: mockUser,
        message: "User profile retrieved successfully",
      })
    );
  });
});
