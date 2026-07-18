import express from "express"
import cors from "cors"

const app = express()

app.use(cors({
    origin: "*",
    credentials: true
}))




app.get('/',(req,res)=>{
    res.send("This is home route")
})

app.get('/greet', (req,res)=>{
    res.send("How are you buddy")
})

app.get('/welcome', (req,res)=>{
    res.send("Welcome to nodejs")
})

export {app}