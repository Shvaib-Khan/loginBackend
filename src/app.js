import express from "express"
import cors from "cors"

const app = express()

app.use(cors({
    origin: "*",
    credentials: true
}))

app.use(express.json());


import userRouter from './routes/user.route.js';
app.use("/api/v1/users", userRouter)

app.get('/',(req,res)=>{
    res.send("This is home route")
})


export {app}