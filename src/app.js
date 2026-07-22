<<<<<<< HEAD
import express from "express";
import userRouter from "./routes/user.route.js";
import { errorHandler } from "./middlewares/error.middleware.js";
=======
import express from "express"
import { errorHandler } from "./middlewares/error.middleware.js"
import cors from "cors"
>>>>>>> 2af45b6 (Enhance API reliability by implementing centralized error handling and response formatting)

const app = express();

app.use(express.json());
app.get("/", (req, res) => {
  res.send("This is home route");
});
app.use("/api/v1/users", userRouter);
app.use(errorHandler);

<<<<<<< HEAD
export { app };
=======
app.use(express.json());


import userRouter from './routes/user.route.js';

app.use("/api/v1/users", userRouter)

app.get('/',(req,res)=>{
    res.send("This is home route")
})

//keep this middleware alwways in last
app.use(errorHandler)


export {app}
>>>>>>> c9b6582 (Implement user registration feature with password hashing)
