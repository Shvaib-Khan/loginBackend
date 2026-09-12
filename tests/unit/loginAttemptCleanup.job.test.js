import { jest } from "@jest/globals";

jest.unstable_mockModule("../../src/config/db.js", () => ({
  sequelize: {
    define: jest.fn(() => ({
      destroy: jest.fn(),
    })),
  },
}));

jest.unstable_mockModule("node-cron", () => ({
  default: {
    schedule: jest.fn(() => ({ stop: jest.fn() })),
  },
}));

jest.unstable_mockModule("../../src/jobs/loginAttemptCleanup.job.js", () => {
  return {
    startLoginAttemptCleanup: jest.fn(),
    stopLoginAttemptCleanup: jest.fn(),
  };
});

const cleanupModule = await import("../../src/jobs/loginAttemptCleanup.job.js");

describe("Login Attempt Cleanup Job", () => {
  it("should export start and stop functions", () => {
    expect(typeof cleanupModule.startLoginAttemptCleanup).toBe("function");
    expect(typeof cleanupModule.stopLoginAttemptCleanup).toBe("function");
  });
});
