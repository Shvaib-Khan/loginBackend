// tests/unit/db.test.js
import { jest } from "@jest/globals";

// 1. Mock the db.js file inside the src/config folder
jest.unstable_mockModule("../../src/config/db.js", () => ({
  dbConnection: {
    getConnection: jest.fn(),
  },
}));

// 2. Dynamically import the files from the src folder AFTER the mock is created
const { connectWithRetry } = await import("../../src/db/index.js");
const { dbConnection } = await import("../../src/config/db.js");

describe("MySQL Database Connection", () => {
  let consoleLogSpy;
  let consoleErrorSpy;
  let exitSpy;

  beforeEach(() => {
    // Set up our security cameras
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    exitSpy = jest.spyOn(process, "exit").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks(); // Wipe the camera tapes
  });

  it("should connect successfully on the first try", async () => {
    const mockRelease = jest.fn();
    dbConnection.getConnection.mockResolvedValueOnce({ release: mockRelease });

    await connectWithRetry();

    expect(dbConnection.getConnection).toHaveBeenCalledTimes(1);
    expect(mockRelease).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "Connected to MySQL server successfully",
    );
  });

  it("should retry if the first connection fails due to a Network Error", async () => {
    const mockRelease = jest.fn();
    dbConnection.getConnection
      .mockRejectedValueOnce(new Error("Network Error")) // No .code property, so it retries
      .mockResolvedValueOnce({ release: mockRelease });

    await connectWithRetry();

    expect(dbConnection.getConnection).toHaveBeenCalledTimes(2);
    expect(mockRelease).toHaveBeenCalledTimes(1);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "MySQL is not ready (Server down or booting up). Retrying in 3 seconds...",
      ),
    );
  });

  it("should log a fatal error and exit if connection fails due to wrong credentials", async () => {
    const mockRelease = jest.fn();

    // 1. Create a fake error and give it the exact ID card code
    const credentialError = new Error("Access denied for user");
    credentialError.code = "ER_ACCESS_DENIED_ERROR";

    // 2. Pass the VIP error on the first try.
    // (We succeed on the 2nd try just to stop the infinite loop, since our spy blocked the app from actually shutting down).
    dbConnection.getConnection
      .mockRejectedValueOnce(credentialError)
      .mockResolvedValueOnce({ release: mockRelease });

    await connectWithRetry();

    // 3. Did it pull the fire alarm?
    expect(exitSpy).toHaveBeenCalledWith(1);

    // 4. Did it log the new, custom red alert message?
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "FATAL ERROR: Check your .env database credentials! (Code: ER_ACCESS_DENIED_ERROR)",
      ),
    );
  });
});
