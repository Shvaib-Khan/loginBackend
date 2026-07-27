import express from "express"
import { errorHandler } from "./middlewares/error.middleware.js"
import cors from "cors"

const app = express()

app.use(cors({
    origin: "*",
    credentials: true
}))

app.use(express.json());


import userRouter from './routes/user.route.js';

app.use("/api/v1/users", userRouter)
app.use('/api/vi/users', userRouter)

app.get('/',(req,res)=>{
    res.send("This is home route")
})

//keep this middleware alwways in last
app.use(errorHandler)


export {app}