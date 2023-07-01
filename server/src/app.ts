const express = require("express")
const {config} = require("dotenv")

config();

const app = express();

app.listen(process.env.PORT , () =>
    console.log(`Server started on port ${process.env.PORT}`)
)
