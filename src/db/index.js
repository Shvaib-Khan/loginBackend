import { sequelize } from "../config/db.js";

// 1. Create a list of errors that will NEVER be fixed by retrying
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
      console.log("MySQL is not ready. Retrying in 3 seconds...");

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
};

export { connectWithRetry };
