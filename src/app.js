import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({//it is used to resolve error when our app run or diffent server
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({ limit: "16kb" }))

app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

//routesimport
import userRouter from './routes/user.route.js'

//routes declaration
//app.use("/users",userRouter)
app.use("/api/v1/users", userRouter); //http://localhost:800/api/v1/users/registratio or login
export {app}