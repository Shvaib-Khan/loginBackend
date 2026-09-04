import express from "express";
import userRouter from "./routes/user.route.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("This is home route");
});

app.use("/api/v1/users", userRouter);

export { app };