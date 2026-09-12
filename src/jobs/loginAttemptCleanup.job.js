import cron from "node-cron";
import { Op } from "sequelize";
import LoginAttempt from "../models/loginAttempt.model.js";

const RETENTION_DAYS = 90;
const SCHEDULED_TIMEZONE = "UTC";
const SCHEDULE = "0 2 * * *";

let scheduledTask = null;

const deleteOldLoginAttempts = async () => {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - RETENTION_DAYS);

  try {
    const deletedCount = await LoginAttempt.destroy({
      where: {
        created_at: { [Op.lt]: cutoff },
      },
    });

    console.log(
      `[loginAttemptCleanup] Deleted ${deletedCount} login attempt(s) older than ${RETENTION_DAYS} days`,
    );
  } catch (error) {
    console.error("[loginAttemptCleanup] Failed to delete old login attempts:", error.message);
  }
};

export const startLoginAttemptCleanup = () => {
  if (scheduledTask) {
    return;
  }

  deleteOldLoginAttempts().catch((error) => {
    console.error("[loginAttemptCleanup] Initial cleanup failed:", error.message);
  });

  scheduledTask = cron.schedule(SCHEDULE, deleteOldLoginAttempts, {
    timezone: SCHEDULED_TIMEZONE,
  });

  console.log(
    `[loginAttemptCleanup] Scheduled daily cleanup at 02:00 ${SCHEDULED_TIMEZONE} (retention: ${RETENTION_DAYS} days)`,
  );
};

export const stopLoginAttemptCleanup = () => {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log("[loginAttemptCleanup] Cleanup scheduler stopped");
  }
};
