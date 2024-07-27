
//this middleware is used to verify  user (means user hai ya nhi hai)

import { APIError } from "../utils/APIError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt, { decode } from "jsonwebtoken"
import { User } from "../models/user.model";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Athorization")?.replace("Bearer ", "");
        //above access token from cookies and accesstoke or from  header athorization
        //yeadi athorization true hai then ham bearer and uske baad ek space lagayenge beacuse 
        //syntax  Athorization:Bearer <Token>
        if (!token) {
            throw new APIError(401,"unathorized request")
        }
        //yadi token hai 
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);//verify current token and decoded token
        //inside the finbyid we are checking that if tokn is present in the user database then we are
        //finding the is of that token and then select the property that we dont take
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        //check if user idsnot find 
        if (!user) {
            throw new APIError(401,"invalid access token")
        }
    
        req.user = user //new object is created inside the req
        next()
    } catch (error) {
        throw new APIError(401,error?.message||"invalid access token")
    }
})