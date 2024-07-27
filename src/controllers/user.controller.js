import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/APIError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { APIResponse } from "../utils/APIResponse.js"
import jwt from "jsonwebtoken"

const generateAccessTokenandRefreshToken = async (userId)=>
{
    try {//find user by userid
        const user = await User.findById(userId);
        if (!user) {
            throw new APIError(404, "User not found");
        }
        //generate access and refresh token
        const accessToken = user.generateAccessToken()
         //console.log(refreshToken)
        const refreshToken =  user.generateRefreshToken()
        //console.log(refreshToken)
        user.refreshToken = refreshToken//put this refresh token into user database
        await user.save({ validateBeforeSave: false })//save the refresh token in user database without validation(password)

        //return kr denge accesstoken and refreshtoken
        return {accessToken,refreshToken}
    } catch (error) {
        console.error("Error generating tokens:", error.message);
        throw new APIError(500,"something went wrong while generating refresh and access token")
    }
}
const registerUser = asyncHandler(async (req, res) => {
    //get user details from frontend
    //validation-not empty
    //check if user already exist by username or email
    //check for images  ,check for avatar
    //upload them to cloudinary ,avatar
    //create user object- create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return res
    //get user details from forntend
    const { fullname, email, username, password } = req.body;
   /* console.log("fullname: ", fullname);
    console.log("email : ", email);
    console.log("username : ", username);
    console.log("password : ",password);*/
   /* if (fullname === "") {
        throw new APIError(400,"fullname is required")
    } OR */
    //validate not empty
    if ([fullname, email, username, password].some((field) =>
        field?.trim() === "")
    ) {
        throw new APIError(400,"all fields are required")
    }

    //check if user already exist
  const existuser= await User.findOne({
        $or:[{username},{email}]
  })
    
    if (existuser) {
        throw new APIError(409,"user with email or username already exist")
    }

   // console.log(req.files);
    //chaeck image or for avatar
    const avatarlocalpath = req.files?.avatar[0]?.path;
    //const coverimagelocalpath = req.files?.coverimage[0]?.path;
    let coverimagelocalpath;
    if (req.files && Array.isArray(req.files.coverimage) && req.files.coverimage.length > 0) {
        coverimagelocalpath=req.files.coverimage[0].path
    }
    if (!avatarlocalpath) {
        throw new APIError(400,"avatar files is required")
    }

    //upload oncloudinary
    const avatar = await uploadOnCloudinary(avatarlocalpath);
   // console.log(avatar)
    const coverimage = await uploadOnCloudinary(coverimagelocalpath);
   // console.log(coverimage)
    
    if (!avatar) {
        throw new APIError(400,"avatar is required")
    }

    //create object and entry in db

   const user=await User.create({
        fullname,
        avatar: avatar.url,
        coverimage: coverimage?.url || "", //if coverimage then url nikal lo yadi nhi hai to empty rhne do
        email,
        password,
        username:username.toLowerCase()
   })
    
    //check user hai ya nhi by id jo bydefault hota hai
    const createduser = await User.findById(user._id).select(
        "-password -refreshToken"//yaha jo jo nhi chaiye hame front end side usse remove kr denge 
    )
    
    if (!createduser) {
        throw new APIError(500, "something went wrong while registering the user");
    }

    //return response
    return res.status(201).json(
        new APIResponse(200,createduser,"user registered successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    //req body->data
    //username or email
    //check find user or not
    //check password
    //access and refresh token
    //send cookie

    //req data from body
    const { email, username, password } = req.body;

    //check find user
    if (!email && !username) {
        throw new APIError(400,"username or email is required")
    }
     
   const user=await User.findOne(
       {
           $or: [{username}, {email}]
       })
    
    if (!user) {
        throw new APIError(400,"user doesn't exist")
    }
    //check password
    const ispassword = await user.isPasswordCorrect(password);

    if (!ispassword) {
        throw new APIError(401,"invalid user credientials")
    }

    //access and refresh token create
  const {accessToken,refreshToken}= await generateAccessTokenandRefreshToken(user._id)//await is used bacaouse kya pta time se token generate hote hai ya nhi
    
    const loggedInUser = await User.findById(user._id).
        select("-password -refreshToken")//password and refreshtoken ko=]
    //send in cookies
    const options = {
        httpOnly: true,
        secure:true
    }

    return res.status(200).cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new APIResponse(200, {
            user:loggedInUser,accessToken,refreshToken
            },
            "user logged in successfully")
    )

})

const logoutUser = asyncHandler(async (req, res) => {
    //find user by id
   await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {//here set is a operator it take an object and update the field that we are give it
               refreshToken:undefined
           }
        }, {
           new:true //in return that response we are get will be new updated
       }
    )
 const options = {
        httpOnly: true,
        secure:true
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
    .json(new APIResponse(200,{},"user logged out"))
}
)

const refreshAccessToken = asyncHandler(async (req, res) => {
    //we are access refresh token from cookies 
    const IncomingRefreshToken = req.cookies.
        refreshToken || req.body.refreshToken
    
    if (!IncomingRefreshToken) {
        throw new APIError(401,"unathorized request")
    }
    try {
        //verify incoming token
        const decodedToken = jwt.verify(
            IncomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new APIError(401, "invalid refresh token")
        }
        //match tokens
        if (IncomingRefreshToken !== user?.refreshToken) {
            throw new APIError(401, "refresh token is expired or used")
        }

        //generate new token or refresh token
        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newrefreshToken } = await generateAccessTokenandRefreshToken(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newrefreshToken, options)
            .json(
                new APIResponse(
                    200,
                    { accessToken, refreshToken: newrefreshToken },
                    "access token refreshed successfully"
                )
            
            )
    }
    catch (error) {
        throw new APIError(401,error?.message||"inavlid refresh token")
    }
})

export {registerUser,loginUser,logoutUser,refreshAccessToken}