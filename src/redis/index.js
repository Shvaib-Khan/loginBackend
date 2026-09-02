import { redisClient } from "../config/redis.js";

const redisConnect = async () => {
  try {
    await redisClient.connect();
    console.log("Redis connected successfully");
  } catch (error) {
    console.log("Failed to connect redis server", error.message);
    process.exit(1);
  }
};

export { redisConnect };
