import { sequelize } from "../config/db.js";
import { DB_RETRY_DELAY_SECONDS } from "../config/appConfig.js";

const FATAL_ERRORS = [
  "ER_ACCESS_DENIED_ERROR", // Wrong username or password
  "ER_BAD_DB_ERROR", // Database name doesn't exist
  "ER_DBACCESS_DENIED_ERROR", // User doesn't have permission for this DB
  "ENOTFOUND", // Wrong host URL in .env
];

const connectWithRetry = async () => {
  while (true) {
    try {
      await sequelize.authenticate();

      console.log("Connected to MySQL server successfully");
      break;
    } catch (error) {
      console.log(`MySQL connection failed: ${error.message}`);
      if (FATAL_ERRORS.includes(error.code)) {
        console.error(`FATAL ERROR: Check your .env database credentials!`);
        process.exit(1);
      }
      console.log(`MySQL is not ready. Retrying in ${DB_RETRY_DELAY_SECONDS} seconds...`);

      await new Promise((resolve) => setTimeout(resolve, DB_RETRY_DELAY_SECONDS * 1000));
    }
  }
};

export { connectWithRetry };
