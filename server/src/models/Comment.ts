import {model, Schema} from "mongoose";


const commentSchema: Schema = new Schema({
    text: {
        type: String,
        required: true
    },
    date: {
        type:String,
        required: true
    }
})

export default model("Comment", commentSchema)