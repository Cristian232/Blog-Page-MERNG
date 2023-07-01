import { connect } from "mongoose";

export const connectToDb = async () => {
    try {
        await connect(`mongodb+srv://admin_me:${process.env.MONGODB_PASSWORD}@cluster0.ctogugp.mongodb.net/?retryWrites=true&w=majority`)
    }catch (err){
        console.log(err)
        return err
    }
}