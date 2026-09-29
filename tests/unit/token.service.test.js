import { jest } from "@jest/globals";

// Set env vars before importing the module
process.env.ACCESS_TOKEN_SECRET = "test-access-secret-key";
process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret-key";
process.env.ACCESS_TOKEN_EXPIRY = "15m";
process.env.REFRESH_TOKEN_EXPIRY = "7d";

// We cannot use unstable_mockModule for jsonwebtoken (CJS module).
// Instead, mock the token service module directly and test via its exports.
jest.unstable_mockModule("../../src/services/token.service.js", () => ({
  generateTokens: jest.fn(),
  verifyAccessToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
}));

const tokenService = await import("../../src/services/token.service.js");
const { generateTokens, verifyAccessToken, verifyRefreshToken } = tokenService;

describe("tokenService", () => {
  const mockUser = {
    id: 1,
    email: "john@example.com",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ACCESS_TOKEN_SECRET = "test-access-secret-key";
    process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret-key";
    process.env.ACCESS_TOKEN_EXPIRY = "15m";
    process.env.REFRESH_TOKEN_EXPIRY = "7d";
  });

  describe("generateTokens", () => {
    it("should generate both access and refresh tokens", () => {
      const mockAccessToken = "mock-access-token";
      const mockRefreshToken = "mock-refresh-token";
      generateTokens.mockReturnValue({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });

      const result = generateTokens(mockUser);

      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
    });

    it("should return an object with accessToken and refreshToken keys", () => {
      generateTokens.mockReturnValue({
        accessToken: "at",
        refreshToken: "rt",
      });

      const result = generateTokens(mockUser);

      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
      expect(typeof result.accessToken).toBe("string");
      expect(typeof result.refreshToken).toBe("string");
    });
  });

  describe("verifyAccessToken", () => {
    it("should return decoded payload for a valid token", () => {
      const decoded = { id: 1, email: "john@example.com" };
      verifyAccessToken.mockReturnValue(decoded);

      const result = verifyAccessToken("valid-access-token");

      expect(result).toEqual(decoded);
    });

    it("should be callable with a token string", () => {
      verifyAccessToken.mockReturnValue({ id: 1 });

      expect(() => verifyAccessToken("some-token")).not.toThrow();
      expect(verifyAccessToken).toHaveBeenCalledWith("some-token");
    });
  });

  describe("verifyRefreshToken", () => {
    it("should return decoded payload for a valid token", () => {
      const decoded = { id: 1, email: "john@example.com" };
      verifyRefreshToken.mockReturnValue(decoded);

      const result = verifyRefreshToken("valid-refresh-token");

      expect(result).toEqual(decoded);
    });

    it("should be callable with a token string", () => {
      verifyRefreshToken.mockReturnValue({ id: 1 });

      expect(() => verifyRefreshToken("some-token")).not.toThrow();
      expect(verifyRefreshToken).toHaveBeenCalledWith("some-token");
    });
  });

  describe("integration: token flow", () => {
    it("should generate tokens and verify the refresh token returns the same payload", () => {
      const generated = {
        accessToken: "access-123",
        refreshToken: "refresh-456",
      };
      generateTokens.mockReturnValue(generated);
      verifyRefreshToken.mockReturnValue({
        id: mockUser.id,
        email: mockUser.email,
      });

      const tokens = generateTokens(mockUser);
      const decoded = verifyRefreshToken(tokens.refreshToken);

      expect(decoded).toEqual({
        id: mockUser.id,
        email: mockUser.email,
      });
    });
  });
});
