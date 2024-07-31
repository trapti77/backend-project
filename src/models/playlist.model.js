import mongoose, { mongo, Schema, Types } from "mongoose";

const playlistSchema = Schema({
     name: {
        type: String,
        required:true
    },
    description: {
        type: String,
        required:true
    },
     videos: [//array of object
        {
        type: Schema.Types.ObjectId,
        ref:"Video"
    }
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref:"User"
},
},
    {
    timestamps:true
})

export const Playlist= mongoose.model("Playlist",playlistSchema);