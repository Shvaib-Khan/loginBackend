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

  // NEW EDGE CASE: Database does not exist
  it("should log a fatal error and exit if the database does not exist", async () => {
    // 1. MySQL throws ER_BAD_DB_ERROR when the database name is wrong
    const dbError = new Error("Unknown database 'login_db'");
    dbError.code = "ER_BAD_DB_ERROR";

    sequelize.authenticate
      .mockRejectedValueOnce(dbError)
      .mockResolvedValueOnce();

    await connectWithRetry();

    // 2. Retrying will never fix a missing database, so we exit immediately
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "FATAL ERROR: Check your .env database credentials!",
      ),
    );
  });

  // NEW EDGE CASE: Wrong host in .env
  it("should log a fatal error and exit if the host cannot be resolved", async () => {
    // 1. Node throws ENOTFOUND when the hostname does not resolve
    const hostError = new Error("getaddrinfo ENOTFOUND db.example.com");
    hostError.code = "ENOTFOUND";

    sequelize.authenticate
      .mockRejectedValueOnce(hostError)
      .mockResolvedValueOnce();

    await connectWithRetry();

    // 2. A wrong host is fatal too, so the app must shut down
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "FATAL ERROR: Check your .env database credentials!",
      ),
    );
  });

  // NEW EDGE CASE: Generic error without a fatal code
  it("should keep retrying (not exit) on a generic error without a fatal code", async () => {
    // 1. A plain error with no `code` is assumed to be a temporary outage
    sequelize.authenticate
      .mockRejectedValueOnce(new Error("Connection refused"))
      .mockResolvedValueOnce();

    await connectWithRetry();

    // 2. It retried and recovered, and never pulled the fire alarm
    expect(sequelize.authenticate).toHaveBeenCalledTimes(2);
    expect(exitSpy).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "Connected to MySQL server successfully",
    );
  });

  // NEW EDGE CASE: Multiple failures before recovery
  // (two retries mean two 3-second waits, so this test needs a longer timeout)
  it(
    "should retry multiple times until the database becomes available",
    async () => {
      // 1. The database is down twice, then comes back up
      sequelize.authenticate
        .mockRejectedValueOnce(new Error("timeout"))
        .mockRejectedValueOnce(new Error("timeout"))
        .mockResolvedValueOnce();

      await connectWithRetry();

      // 2. Three attempts in total: two failures + one success
      expect(sequelize.authenticate).toHaveBeenCalledTimes(3);
      expect(exitSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "MySQL is not ready. Retrying in 3 seconds...",
        ),
      );
    },
    10000,
  );
});
