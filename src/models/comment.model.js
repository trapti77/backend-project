import mongoose, { mongo, Schema, Types } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = Schema({
    content: {
        type: String,
        required:true
    },
    video: {
        type: Schema.Types.ObjectId,
        ref:"Video"
    },
    owner: {
        Type: Schema.Types.ObjectId,
        ref: "User"
    }
},
    {
    timestamps:true
})
//plugin give the availity to controle pagenate that from whare to where sending video
commentSchema.plugin(mongooseAggregatePaginate)
export const Comment= mongoose.model("Comment", commentSchema);