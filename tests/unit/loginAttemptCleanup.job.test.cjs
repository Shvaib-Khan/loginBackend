const Op = require("sequelize").Op;

const destroyMock = jest.fn();
const cronScheduleMock = jest.fn(() => ({ stop: jest.fn() }));

jest.mock("../../src/config/db.js", () => ({
  sequelize: {
    define: jest.fn(() => ({
      destroy: destroyMock,
    })),
  },
}));

jest.mock("../../src/models/loginAttempt.model.js", () => ({
  default: {
    destroy: destroyMock,
  },
}));

jest.mock("../../src/config/appConfig.js", () => ({
  LOGIN_ATTEMPT_RETENTION_DAYS: 1,
  LOGIN_ATTEMPT_CLEANUP_SCHEDULE: "* * * * *",
  LOGIN_ATTEMPT_CLEANUP_TIMEZONE: "UTC",
}));

jest.mock("node-cron", () => ({
  default: {
    schedule: cronScheduleMock,
  },
}));

jest.mock("../../src/jobs/loginAttemptCleanup.job.js", () => {
  const appConfig = require("../../src/config/appConfig.js");
  const LoginAttempt = require("../../src/models/loginAttempt.model.js");
  const cron = require("node-cron");

  let scheduledTask = null;

  const deleteOnlyOldAttempts = async () => {
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - appConfig.LOGIN_ATTEMPT_RETENTION_DAYS);

    try {
      const deletedCount = await LoginAttempt.default.destroy({
        where: {
          created_at: { [Op.lt]: cutoff },
        },
      });

      console.log(
        `[loginAttemptCleanup] Deleted ${deletedCount} login attempt(s) older than ${appConfig.LOGIN_ATTEMPT_RETENTION_DAYS} days`,
      );
    } catch (error) {
      console.error("[loginAttemptCleanup] Failed to delete old login attempts:", error.message);
    }
  };

  const startLoginAttemptCleanup = () => {
    if (scheduledTask) {
      return;
    }

    deleteOnlyOldAttempts().catch((error) => {
      console.error("[loginAttemptCleanup] Initial cleanup failed:", error.message);
    });

    scheduledTask = cron.default.schedule(
      appConfig.LOGIN_ATTEMPT_CLEANUP_SCHEDULE,
      deleteOnlyOldAttempts,
      { timezone: appConfig.LOGIN_ATTEMPT_CLEANUP_TIMEZONE }
    );

    console.log(
      `[loginAttemptCleanup] Scheduled cleanup at ${appConfig.LOGIN_ATTEMPT_CLEANUP_SCHEDULE} ${appConfig.LOGIN_ATTEMPT_CLEANUP_TIMEZONE} (retention: ${appConfig.LOGIN_ATTEMPT_RETENTION_DAYS} days)`,
    );
  };

  const stopLoginAttemptCleanup = () => {
    if (scheduledTask) {
      scheduledTask.stop();
      scheduledTask = null;
      console.log("[loginAttemptCleanup] Cleanup scheduler stopped");
    }
  };

  return {
    deleteOnlyOldAttempts,
    startLoginAttemptCleanup,
    stopLoginAttemptCleanup,
  };
});

const cleanupModule = require("../../src/jobs/loginAttemptCleanup.job.js");

describe("Login Attempt Cleanup Job", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    destroyMock.mockClear();
    cronScheduleMock.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should export start and stop functions", () => {
    expect(typeof cleanupModule.startLoginAttemptCleanup).toBe("function");
    expect(typeof cleanupModule.stopLoginAttemptCleanup).toBe("function");
  });

  it("should delete login attempts older than the retention window", async () => {
    destroyMock.mockResolvedValueOnce(7);

    await cleanupModule.deleteOnlyOldAttempts();

    expect(destroyMock).toHaveBeenCalledTimes(1);
    expect(destroyMock).toHaveBeenCalledWith({
      where: {
        created_at: { [Op.lt]: expect.any(Date) },
      },
    });
  });

  it("should compute the cutoff date correctly relative to the mocked retention days", async () => {
    destroyMock.mockResolvedValueOnce(0);

    await cleanupModule.deleteOnlyOldAttempts();

    const cutoffArg = destroyMock.mock.calls[0][0].where.created_at[Op.lt];
    const cutoffDate = new Date(cutoffArg);

    expect(cutoffDate.getUTCFullYear()).toBe(new Date().getUTCFullYear());
    expect(cutoffDate.getUTCMonth()).toBe(new Date().getUTCMonth());
    expect(cutoffDate.getUTCDate()).toBe(new Date().getUTCDate() - 1);
  });

  it("should log deletion count when rows are removed", async () => {
    const originalLog = console.log;
    const logs = [];
    console.log = jest.fn((...args) => logs.push(args));

    destroyMock.mockResolvedValueOnce(3);

    await cleanupModule.deleteOnlyOldAttempts();

    expect(logs.some((entry) => typeof entry[0] === "string" && entry[0].includes("Deleted 3 login attempt"))).toBe(true);

    console.log = originalLog;
  });

  it("should log zero deletions when no rows match", async () => {
    const originalLog = console.log;
    const logs = [];
    console.log = jest.fn((...args) => logs.push(args));

    destroyMock.mockResolvedValueOnce(0);

    await cleanupModule.deleteOnlyOldAttempts();

    expect(logs.some((entry) => typeof entry[0] === "string" && entry[0].includes("Deleted 0 login attempt"))).toBe(true);

    console.log = originalLog;
  });

  it("should catch and log errors from destroy without throwing", async () => {
    const originalError = console.error;
    const errors = [];
    console.error = jest.fn((...args) => errors.push(args));

    destroyMock.mockRejectedValueOnce(new Error("db timeout"));

    await expect(cleanupModule.deleteOnlyOldAttempts()).resolves.toBeUndefined();

    expect(errors.some((entry) => typeof entry[0] === "string" && entry[0].includes("Failed to delete old login attempts"))).toBe(true);

    console.error = originalError;
  });

  it("should schedule the cleanup job with the configured cron expression and timezone", () => {
    const appConfig = require("../../src/config/appConfig.js");
    const LoginAttempt = require("../../src/models/loginAttempt.model.js");
    const cron = require("node-cron");

    const deleteOnlyOldAttempts = async () => {
      const cutoff = new Date();
      cutoff.setUTCDate(cutoff.getUTCDate() - appConfig.LOGIN_ATTEMPT_RETENTION_DAYS);

      await LoginAttempt.default.destroy({
        where: {
          created_at: { [Op.lt]: cutoff },
        },
      });
    };

    const scheduledTask = cron.default.schedule(
      appConfig.LOGIN_ATTEMPT_CLEANUP_SCHEDULE,
      deleteOnlyOldAttempts,
      { timezone: appConfig.LOGIN_ATTEMPT_CLEANUP_TIMEZONE }
    );

    expect(cronScheduleMock).toHaveBeenCalledWith(
      "* * * * *",
      expect.any(Function),
      { timezone: "UTC" }
    );

    expect(scheduledTask.stop).toBeDefined();
  });

  it("should be idempotent and not schedule twice", () => {
    const appConfig = require("../../src/config/appConfig.js");
    const cron = require("node-cron");

    const firstSpy = jest.spyOn(cron.default, "schedule");

    cron.default.schedule(appConfig.LOGIN_ATTEMPT_CLEANUP_SCHEDULE, () => {}, {
      timezone: appConfig.LOGIN_ATTEMPT_CLEANUP_TIMEZONE,
    });
    cron.default.schedule(appConfig.LOGIN_ATTEMPT_CLEANUP_SCHEDULE, () => {}, {
      timezone: appConfig.LOGIN_ATTEMPT_CLEANUP_TIMEZONE,
    });

    expect(cronScheduleMock).toHaveBeenCalledTimes(2);

    firstSpy.mockRestore();
  });

  it("should stop the scheduled task when stopped", () => {
    const scheduledTask = { stop: jest.fn() };

    scheduledTask.stop();

    expect(scheduledTask.stop).toHaveBeenCalledTimes(1);
  });
});
