import dotenv from "dotenv";
import { app } from "./app.js";
import { connectWithRetry } from "./db/index.js";
import { redisConnect } from "./redis/index.js";

dotenv.config({
  path: "./.env",
});

async function startServer() {
  try {
    await connectWithRetry();
    await redisConnect();
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Serves at http://localhost:${process.env.PORT}`);
    });
  } catch (error) {
    console.error("Error while starting the server:", error.message);
    process.exit(1);
  }
}

startServer();
