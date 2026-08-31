import { dbConnection } from "../config/db.js";

const connectWithRetry = async () => {
  while (true) {
    try {
      const connection = await dbConnection.getConnection();
      console.log("Connected to MySQL server successfully");
      connection.release();
      break;
    } catch (error) {
      console.log(`MySQL connection failed: ${error.message}`);
      console.log("MySQL is not ready. Retrying in 3 seconds...");
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
};

export { connectWithRetry };
