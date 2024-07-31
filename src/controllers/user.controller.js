import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/APIError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { APIResponse } from "../utils/APIResponse.js"
import jwt from "jsonwebtoken"
import mongoose, { syncIndexes } from "mongoose";

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
    const avatarlocalpath = req.files?.avatar?.[0]?.path;
    //const coverimagelocalpath = req.files?.coverimage[0]?.path;
    let coverimagelocalpath;
    if (req.files && Array.isArray(req.files.coverimage) && req.files.coverimage.length > 0) {
        coverimagelocalpath=req.files.coverimage?.[0]?.path
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
   // console.log(ispassword);

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
            $unset: {//here set is a operator it take an object and update the field that we are give it
               refreshToken:1//this removes the field from the document
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

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confPassword } = req.body
    if (newPassword !== confPassword) {
        throw new APIError(400,"password not match") 
    }
    //find user id from the middleware when login 
    const user = await User.findById(req.user?._id)
    //check password correct
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new APIError(400, "invalid password")
    }
//set new password
    user.password = newPassword
    await user.save({ validateBeforeSave: true })
    
    return res.status(200)
    .json(new APIResponse(200,"password change successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.
        status(200)
    .json(200,req.user,"current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body;
    
    if (!fullname || !email) {
        throw new APIError(400, "all fields are requiered");
    }

    const user = User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                fullname,
                email: email
            }
        },
        {new:true}
    ).select("-password")

    return res.
        status(200)
    .json(new APIResponse(200,user,"account details updated successfully"))

})


const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarPath = req.files?.path;
    if (!avatarPath) {
        throw new APIError(400,"Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarPath);
    
    if (!avatar.url) {
        throw new APIError(400,"Error while uploading on cloudinary")
    }

  const user=  await User.findById(req.user?._id,
        {
        $set:{
        avatar:avatar.url
    }
    },
        { new: true }
    ).select("-password")

     return res.
        status(200)
    .json(200,"avatar updated successfully")
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const converimagepath = req.files?.body;
    if (!converimagepath) {
        throw new APIError(400, "cover image missing ");
    }

    const  coverimage = await uploadOnCloudinary(converimagepath);
    if (! coverimage.url) {
        throw new APIError(400,"error while uploading file on cloudinary")
    }

   const user= await User.findById(req.user?._id,
        {
            $set: {
                 coverimage: coverimage.url
            }
        },
        {
            new:true
        }
    )

    return res.
        status(200)
    .json(200,user,"coverimage updated successfully")
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params
    if (!username?.trim()) {
        throw new APIError(400,'username is missing')
    }
//1. matching user
   const channel = await  User.aggregate([
        {//match is used to match like username mtch with username it is a pipeline
            $match: {
                username:username?.toLowerCase()
            }
       },
       //2. count subscribers through cahnnel
       {//lookup is also a pipeline that is used for to see detail
           $lookup: {
               from: "subscriptions",//Subscription in database loook like this in lowercase and
               //at the end of the word s is added
               
               localField: "_id",
               foreignField: "channel",
               as:"subscribers"
           }
       },
       //3. subscribed to (kis channel ko subscribe kiya gya hai user dwara) through subscriber
       {
           $lookup: {
               from: "subscriptions",
               localField: "_id",
               foreignField: "subscriber",
               as:"subscribedTo"
           }
       },
       //4. add additional field to user
       {//addfield is used to add current value as well additional field
           $addFields: {
               subcribersCount: {
                   $size:"$subscribers"
               },
               channelSubscribedToCount: {
                   $size:"$subscribedTo"
               },
               isSubscribed: {//here we are check that cahnnel subscribed  or not by the user
                   $cond: {//condition pipeline
                       if: { $in: [req.user?._id, "$subscribers.subscriber"] },//in check user peresent or not it can used in array as well in object
                       then: true,
                       else:false
                   }
               }
           }
       },
       {//it give the projection that mai sari value ko nhi dunga to frontend only selected value dunga
           $project: {
               fullname: 1,//1 means flag on
               username: 1,
               subcribersCount: 1,
               channelSubscribedToCount: 1,
               isSubscribed: 1,
               avatar: 1,
               coverImage: 1,
               email:1
           }
       }
   ])
     if(!channel?.length) {
           throw new APIError(400,"channel doesnt exists")
    }
    
    return res.status(200)
    .json(new APIResponse(200,channel[0],"user channel fetched sucessfully"))
    //console.log(channel);
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate(
        [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(req.user._id)
                    //here we are changing the mongoDB id into mongoose id
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistory",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",
                                pipeline: 
                                    [
                                        {
                                            $project: {
                                                fullname: 1,
                                                username: 1,
                                                avatar: 1,
                                                
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $addFields:{
                            owner: {
                                $first:"$owner"
                            }
                       }
                        }
                    ]
                }
            }
        ]
    )
    return res.status(200)
        .json(
        new APIResponse(200,user[0].watchHistory,"watch history fetched successfully")
    )
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
      getWatchHistory
}