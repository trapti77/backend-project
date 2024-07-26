//require('dotenv').config({ path: './env' })// APROACH 1
import dotenv from "dotenv"
import connectDB from "./db/index.js"
import {app} from './app.js'

dotenv.config({
    path:'./env'
})

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 1400, () => {
            console.log(`server is running at port : ${process.env.PORT}`)
        })
    })
    .catch((err) => {
    console.log("mongodb connection failed !!!",err)
})
