import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"


const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String,//cloudnary url
        required: true,
    },
    coverimage: {
        type: String
    },
    watchHistory: [{
        type: Schema.Types.ObjectId,
        ref: "Video"
    }],
    password:{
    type: String,
    required:[true,'password is required']
},
    refreshToken: {
        type:String,
    }
},
    {
    timestamps:true
})
userSchema.pre("save", async function (next) {
    this.password = await bcrypt.hash(this.password, 10)
    next()
})//herewhen data is saved before that we have to encrypt password
userSchema.methods.isPasswordCorrect = async function (password)//customemethod created name ispasscorrect
{
    return await bcrypt.compare(password, this.password)
}

//generate access token
userSchema.methods.generateAccessToken = function () {//in jwt has sign method that generate tokens
   return  jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullname:this.fullname,
    },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
)
}
userSchema.methods.generateRefreshToken = function () {
     return  jwt.sign({
        _id: this._id,
    },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
)
}
export const User = mongoose.model("User", userSchema);