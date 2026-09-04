import dotenv from "dotenv";
import { app } from "./app.js";
import { connectWithRetry } from "./db/index.js";
import { redisConnect } from "./redis/index.js";

dotenv.config({
<<<<<<< HEAD
    path: './.env'
})


async function startServer() {
    try {
        // Connect MySQL
        await connectWithRetry()
       
        // Connect Redis
        await redisConnect()

        // Start Express
        app.listen(process.env.PORT  || 3000, () => {
            console.log(`Server is running at port: ${process.env.PORT}`)
            console.log(`Serves at http://localhost:${process.env.PORT}`)
        });

    } catch (error) {
        console.error("Error while starting the server:", error);
        process.exit(1);
    }
}


startServer();

=======
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
>>>>>>> main
