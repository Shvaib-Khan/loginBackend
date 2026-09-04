<<<<<<< HEAD
import {createClient} from "redis"

const redisClient = createClient({
    socket:{
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

export {redisClient}
=======
import { createClient } from "redis";

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

export { redisClient };
>>>>>>> main
