import { jest } from "@jest/globals";

// Set env vars before importing
process.env.ACCESS_TOKEN_SECRET = "test-access-secret-key";

jest.unstable_mockModule("../../src/utils/asyncHandler.js", () => ({
  asyncHandler: (fn) => fn,
}));

jest.unstable_mockModule("../../src/services/token.service.js", () => ({
  verifyAccessToken: jest.fn(),
}));

jest.unstable_mockModule("../../src/models/user.model.js", () => ({
  default: {
    findOne: jest.fn(),
  },
}));

const { verifyJWT } = await import("../../src/middlewares/auth.middleware.js");
const { verifyAccessToken } =
  await import("../../src/services/token.service.js");
const User = (await import("../../src/models/user.model.js")).default;

const mockRequest = (options = {}) => ({
  cookies: options.cookies ?? {},
  headers: options.headers ?? {},
  user: undefined,
  header(name) {
    return this.headers?.[name] ?? this.headers?.[name.toLowerCase()] ?? undefined;
  },
});

const mockResponse = () => ({
  status: jest.fn().mockReturnValue({ json: jest.fn() }),
  json: jest.fn(),
});

const mockNext = jest.fn();

describe("verifyJWT auth middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ACCESS_TOKEN_SECRET = "test-access-secret-key";
    mockNext.mockClear();
  });

  it("should throw ApiError when no token is provided", async () => {
    const { ApiError } = await import("../../src/utils/ApiError.js");

    const req = mockRequest({});
    const res = mockResponse();

    await expect(verifyJWT(req, res, mockNext)).rejects.toThrow(
      expect.objectContaining({
        statusCode: 401,
        message: "Unauthorized request",
      }),
    );
  });

  it("should throw ApiError when token is missing and no Authorization header", async () => {
    const { ApiError } = await import("../../src/utils/ApiError.js");

    const req = mockRequest({
      cookies: {},
      headers: {},
    });
    const res = mockResponse();

    await expect(verifyJWT(req, res, mockNext)).rejects.toThrow(
      expect.objectContaining({
        statusCode: 401,
        message: "Unauthorized request",
      }),
    );
  });

  it("should verify access token from cookie", async () => {
    const decoded = { id: 1, email: "john@example.com" };
    verifyAccessToken.mockReturnValue(decoded);

    const mockUser = {
      id: 1,
      email: "john@example.com",
      name: "John",
      password: "hashed",
      refresh_token: "some-refresh-token",
    };
    User.findOne.mockResolvedValue(mockUser);

    const req = mockRequest({
      cookies: { accessToken: "valid-access-token" },
    });
    const res = mockResponse();

    await verifyJWT(req, res, mockNext);

    expect(verifyAccessToken).toHaveBeenCalledWith("valid-access-token");
    expect(User.findOne).toHaveBeenCalledWith({
      where: { email: "john@example.com" },
    });
    expect(req.user).toEqual(
      expect.objectContaining({
        id: 1,
        email: "john@example.com",
        name: "John",
      })
    );
    expect(req.user).not.toHaveProperty("password");
    expect(req.user).not.toHaveProperty("refresh_token");
    expect(mockNext).toHaveBeenCalled();
  });

  it("should verify access token from Authorization header", async () => {
    const decoded = { id: 1, email: "john@example.com" };
    verifyAccessToken.mockReturnValue(decoded);

    const mockUser = {
      id: 1,
      email: "john@example.com",
      name: "John",
      password: "hashed",
      refresh_token: "some-refresh-token",
    };
    User.findOne.mockResolvedValue(mockUser);

    const req = mockRequest({
      headers: { Authorization: "Bearer valid-access-token" },
    });
    const res = mockResponse();

    await verifyJWT(req, res, mockNext);

    expect(verifyAccessToken).toHaveBeenCalledWith("valid-access-token");
    expect(req.user).toEqual(
      expect.objectContaining({
        email: "john@example.com",
      })
    );
    expect(mockNext).toHaveBeenCalled();
  });

  it("should prefer cookie token over Authorization header when both are present", async () => {
    const decoded = { id: 1, email: "john@example.com" };
    verifyAccessToken.mockReturnValue(decoded);

    const mockUser = {
      id: 1,
      email: "john@example.com",
      name: "John",
      password: "hashed",
      refresh_token: "some-refresh-token",
    };
    User.findOne.mockResolvedValue(mockUser);

    const req = mockRequest({
      cookies: { accessToken: "cookie-token" },
      headers: { Authorization: "Bearer header-token" },
    });
    const res = mockResponse();

    await verifyJWT(req, res, mockNext);

    // Should use the cookie token, not the header token
    expect(verifyAccessToken).toHaveBeenCalledWith("cookie-token");
  });

  it("should throw ApiError when user is not found", async () => {
    const { ApiError } = await import("../../src/utils/ApiError.js");
    const decoded = { id: 1, email: "nonexistent@example.com" };
    verifyAccessToken.mockReturnValue(decoded);
    User.findOne.mockResolvedValue(null);

    const req = mockRequest({
      cookies: { accessToken: "valid-access-token" },
    });
    const res = mockResponse();

    await expect(verifyJWT(req, res, mockNext)).rejects.toThrow(ApiError);
    await expect(verifyJWT(req, res, mockNext)).rejects.toMatchObject({
      statusCode: 401,
      message: "Invalid access token",
    });
  });

  it("should throw ApiError when user has no refresh token (session expired)", async () => {
    const { ApiError } = await import("../../src/utils/ApiError.js");
    const decoded = { id: 1, email: "john@example.com" };
    verifyAccessToken.mockReturnValue(decoded);

    const mockUser = {
      id: 1,
      email: "john@example.com",
      name: "John",
      password: "hashed",
      refresh_token: null,
    };
    User.findOne.mockResolvedValue(mockUser);

    const req = mockRequest({
      cookies: { accessToken: "valid-access-token" },
    });
    const res = mockResponse();

    await expect(verifyJWT(req, res, mockNext)).rejects.toThrow(ApiError);
    await expect(verifyJWT(req, res, mockNext)).rejects.toMatchObject({
      statusCode: 401,
      message: "Session expired. Please login again.",
    });
  });

  it("should throw ApiError when access token is expired", async () => {
    const { ApiError } = await import("../../src/utils/ApiError.js");
    const error = new Error("Token expired");
    error.name = "TokenExpiredError";
    verifyAccessToken.mockImplementation(() => {
      throw error;
    });

    const req = mockRequest({
      cookies: { accessToken: "expired-access-token" },
    });
    const res = mockResponse();

    await expect(verifyJWT(req, res, mockNext)).rejects.toThrow(ApiError);
    await expect(verifyJWT(req, res, mockNext)).rejects.toMatchObject({
      statusCode: 401,
      message: "Access token expired",
    });
  });

  it("should throw ApiError for invalid access token", async () => {
    const { ApiError } = await import("../../src/utils/ApiError.js");
    const error = new Error("Invalid signature");
    error.name = "JsonWebTokenError";
    verifyAccessToken.mockImplementation(() => {
      throw error;
    });

    const req = mockRequest({
      cookies: { accessToken: "invalid-access-token" },
    });
    const res = mockResponse();

    await expect(verifyJWT(req, res, mockNext)).rejects.toThrow(ApiError);
    await expect(verifyJWT(req, res, mockNext)).rejects.toThrow(
      expect.objectContaining({
        statusCode: 401,
        message: "Invalid signature",
      }),
    );
  });

  it("should sanitize user object by removing password and refresh_token before attaching to request", async () => {
    const decoded = { id: 1, email: "john@example.com" };
    verifyAccessToken.mockReturnValue(decoded);

    const mockUser = {
      id: 1,
      email: "john@example.com",
      name: "John",
      password: "hashed-secret",
      refresh_token: "stored-refresh-token",
    };
    User.findOne.mockResolvedValue(mockUser);

    const req = mockRequest({
      cookies: { accessToken: "valid-access-token" },
    });
    const res = mockResponse();

    await verifyJWT(req, res, mockNext);

    expect(req.user).not.toHaveProperty("password");
    expect(req.user).not.toHaveProperty("refresh_token");
    expect(req.user).toHaveProperty("id");
    expect(req.user).toHaveProperty("email");
    expect(req.user).toHaveProperty("name");
  });
});
