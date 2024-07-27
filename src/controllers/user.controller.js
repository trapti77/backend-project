import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/APIError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import {APIResponse} from "../utils/APIResponse.js"

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

export {registerUser}