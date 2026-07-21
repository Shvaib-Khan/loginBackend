import express from "express";
import userRouter from "./routes/user.route.js";
import { errorHandler } from "./middlewares/error.middleware.js";

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


export {app}
>>>>>>> c9b6582 (Implement user registration feature with password hashing)
