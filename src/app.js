import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send("This is home route");
});

<<<<<<< HEAD
app.use(express.json());


import userRouter from './routes/user.route.js';
app.use("/api/v1/users", userRouter)

app.get('/',(req,res)=>{
    res.send("This is home route")
})


export {app}
=======
export { app };
>>>>>>> main
