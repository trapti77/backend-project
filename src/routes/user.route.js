import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
const router = Router()

router.route("/register").post(upload.fields([//upload is a middle ware
    {
        name: "avatar",
        maxCount:1//number of files
    },
    {
        name: "coverimage",
        maxCount:1//numer of files
    }
]),registerUser)
export default router