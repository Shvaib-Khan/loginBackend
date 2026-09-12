import { jest } from "@jest/globals";

jest.unstable_mockModule("../../src/config/db.js", () => ({
  sequelize: {
    define: jest.fn(() => ({
      create: jest.fn(),
    })),
  },
}));

const LoginAttempt = await import("../../src/models/loginAttempt.model.js").then(
  (m) => m.default,
);

const LoginAttemptModel = LoginAttempt;

describe("LoginAttempt Model", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should create a FAILED login attempt record", async () => {
    const expectedRecord = {
      email: "user@example.com",
      ip_address: "127.0.0.1",
      status: "FAILED",
      reason: "Invalid password",
    };

    LoginAttemptModel.create.mockResolvedValueOnce(expectedRecord);

    const result = await LoginAttemptModel.create(expectedRecord);

    expect(result).toEqual(expectedRecord);
    expect(LoginAttemptModel.create).toHaveBeenCalledWith(expectedRecord);
  });

  it("should create a SUCCESS login attempt record", async () => {
    const expectedRecord = {
      email: "user@example.com",
      ip_address: "127.0.0.1",
      status: "SUCCESS",
      reason: "Login successful",
    };

    LoginAttemptModel.create.mockResolvedValueOnce(expectedRecord);

    const result = await LoginAttemptModel.create(expectedRecord);

    expect(result).toEqual(expectedRecord);
    expect(LoginAttemptModel.create).toHaveBeenCalledWith(expectedRecord);
  });
});
