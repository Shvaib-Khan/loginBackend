// tests/unit/db.test.js
import { jest } from "@jest/globals";

// 1. Mock the db.js file inside the src/config folder
jest.unstable_mockModule("../../src/config/db.js", () => ({
  sequelize: {
    authenticate: jest.fn(),
  },
}));

const { connectWithRetry } = await import("../../src/db/index.js");
const { sequelize } = await import("../../src/config/db.js");

describe("MySQL Database Connection", () => {
  let consoleLogSpy;
  let consoleErrorSpy;
  let exitSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    exitSpy = jest.spyOn(process, "exit").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should connect successfully on the first try", async () => {
    sequelize.authenticate.mockResolvedValueOnce();

    await connectWithRetry();

    expect(sequelize.authenticate).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "Connected to MySQL server successfully",
    );
  });

  it("should retry if the first connection fails due to a Network Error", async () => {
    sequelize.authenticate
      .mockRejectedValueOnce(new Error("Network Error"))
      .mockResolvedValueOnce();

    await connectWithRetry();

    expect(sequelize.authenticate).toHaveBeenCalledTimes(2);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("MySQL is not ready. Retrying in 3 seconds..."),
    );
  });

  it("should log a fatal error and exit if connection fails due to wrong credentials", async () => {
    // 1. Create a fake error and give it the exact ID card code
    const credentialError = new Error("Access denied for user");
    credentialError.code = "ER_ACCESS_DENIED_ERROR";

    // 2. Pass the VIP error on the first try.
    // (We succeed on the 2nd try just to stop the infinite loop, since our spy blocked the app from actually shutting down).
    sequelize.authenticate
      .mockRejectedValueOnce(credentialError)
      .mockResolvedValueOnce();

    await connectWithRetry();

    // 3. Did it pull the fire alarm?
    expect(exitSpy).toHaveBeenCalledWith(1);

    // 4. Did it log the new, custom red alert message?
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "FATAL ERROR: Check your .env database credentials!",
      ),
    );
  });
});
