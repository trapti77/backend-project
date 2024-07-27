import { Router } from "express";
import { loginUser, registerUser ,logoutUser} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
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
]), registerUser)

router.route("/login").post(loginUser)

//secured routes

router.route("/logout").post(verifyJWT,logoutUser)
export default router