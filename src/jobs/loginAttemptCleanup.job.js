import cron from "node-cron";
import { Op } from "sequelize";
import LoginAttempt from "../models/loginAttempt.model.js";
import {
  LOGIN_ATTEMPT_RETENTION_DAYS,
  LOGIN_ATTEMPT_CLEANUP_SCHEDULE,
  LOGIN_ATTEMPT_CLEANUP_TIMEZONE,
} from "../config/appConfig.js";

let scheduledTask = null;

const deleteOldLoginAttempts = async () => {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - LOGIN_ATTEMPT_RETENTION_DAYS);

  try {
    const deletedCount = await LoginAttempt.destroy({
      where: {
        created_at: { [Op.lt]: cutoff },
      },
    });

    console.log(
      `[loginAttemptCleanup] Deleted ${deletedCount} login attempt(s) older than ${LOGIN_ATTEMPT_RETENTION_DAYS} days`,
    );
  } catch (error) {
    console.error(
      "[loginAttemptCleanup] Failed to delete old login attempts:",
      error.message,
    );
  }
};

export const startLoginAttemptCleanup = () => {
  if (scheduledTask) {
    return;
  }

  deleteOldLoginAttempts().catch((error) => {
    console.error(
      "[loginAttemptCleanup] Initial cleanup failed:",
      error.message,
    );
  });

  scheduledTask = cron.schedule(
    LOGIN_ATTEMPT_CLEANUP_SCHEDULE,
    deleteOldLoginAttempts,
    {
      timezone: LOGIN_ATTEMPT_CLEANUP_TIMEZONE,
    },
  );

  console.log(
    `[loginAttemptCleanup] Scheduled cleanup at ${LOGIN_ATTEMPT_CLEANUP_SCHEDULE} ${LOGIN_ATTEMPT_CLEANUP_TIMEZONE} (retention: ${LOGIN_ATTEMPT_RETENTION_DAYS} days)`,
  );
};

export const stopLoginAttemptCleanup = () => {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log("[loginAttemptCleanup] Cleanup scheduler stopped");
  }
};
