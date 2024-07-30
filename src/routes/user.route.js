import { Router } from "express";
import {
    loginUser,
    registerUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
} from "../controllers/user.controller.js";
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

router.route("/logout").post(verifyJWT, logoutUser)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT, changeCurrentPassword)

router.route("/current-user").get(verifyJWT, getCurrentUser)

router.route("/update-account-details").patch(verifyJWT, updateAccountDetails)

router.route("/change-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)

router.route("/update-coverimage").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("/channel/:username").get(verifyJWT, getUserChannelProfile)

router.route("/history").get(verifyJWT,getWatchHistory)
export default router