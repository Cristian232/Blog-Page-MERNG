import {connectToDb} from "./utils/connection";

const express = require("express")
const {config} = require("dotenv")

config();

const app = express();

connectToDb().then(()=> {
app.listen(process.env.PORT , () =>
    console.log(`Server started on port ${process.env.PORT}`)
)}
).catch(err => console.log(err))
