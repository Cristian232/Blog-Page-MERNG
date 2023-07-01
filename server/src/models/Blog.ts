import {model, Schema} from "mongoose";


const blogSchema: Schema = new Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    }
})

export default model("Blog", blogSchema)