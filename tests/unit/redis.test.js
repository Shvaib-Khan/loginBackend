// tests/unit/redis.test.js
import { jest } from "@jest/globals";

// 1. Mock the redis.js configuration file
jest.unstable_mockModule("../../src/config/redis.js", () => ({
  redisClient: {
    connect: jest.fn(),
  },
}));

// 2. Import the functions AFTER the mock is created
const { redisConnect } = await import("../../src/redis/index.js");
const { redisClient } = await import("../../src/config/redis.js");

describe("Redis Connection", () => {
  let exitSpy;
  let consoleSpy;

  beforeEach(() => {
    exitSpy = jest.spyOn(process, "exit").mockImplementation(() => {});
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should connect to Redis successfully", async () => {
    redisClient.connect.mockResolvedValueOnce();

    await redisConnect();

    expect(redisClient.connect).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith("Redis connected successfully");
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it("should exit the process with code 1 if the network connection drops", async () => {
    redisClient.connect.mockRejectedValueOnce(new Error("Connection Refused"));

    await redisConnect();

    expect(redisClient.connect).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to connect redis server",
      "Connection Refused",
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  // NEW EDGE CASE: Wrong Credentials
  it("should log an authentication error and exit if Redis credentials are wrong", async () => {
    // 1. Create a fake Redis authentication error (what Redis throws on a bad password)
    const authError = new Error("WRONGPASS invalid username-password pair");

    // 2. Program our dummy client to throw this specific error
    redisClient.connect.mockRejectedValueOnce(authError);

    // 3. Run the code
    await redisConnect();

    // 4. Assertions
    expect(redisClient.connect).toHaveBeenCalledTimes(1);

    // Check if it grabbed the exact error message your developer needs to see
    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to connect redis server",
      "WRONGPASS invalid username-password pair",
    );

    // Ensure the app shuts itself down securely
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  // NEW EDGE CASE: Error is thrown without a message property
  it("should still exit if the error has no message property", async () => {
    // 1. Some drivers reject with a plain string instead of an Error object
    redisClient.connect.mockRejectedValueOnce("Connection reset");

    // 2. Run the code
    await redisConnect();

    // 3. Even though there is no `.message` to log, the app must still shut down
    //    (error.message is undefined for a string rejection, so it is logged as undefined)
    expect(redisClient.connect).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to connect redis server",
      undefined,
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  // NEW EDGE CASE: Error with an empty message
  it("should still exit if the error message is empty", async () => {
    // 1. An Error with an empty message string
    redisClient.connect.mockRejectedValueOnce(new Error(""));

    // 2. Run the code
    await redisConnect();

    // 3. The connection still failed, so the app must shut down
    expect(redisClient.connect).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith("Failed to connect redis server", "");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
