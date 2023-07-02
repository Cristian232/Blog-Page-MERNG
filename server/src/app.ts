import {connectToDb} from "./utils/connection";
import {graphqlHTTP} from "express-graphql";
import schema from "./handlers/handlers";

const express = require("express")
const {config} = require("dotenv")

config();

const app = express();

app.use("/graphql", graphqlHTTP({schema:schema, graphiql:true}))

connectToDb().then(()=> {
app.listen(process.env.PORT , () =>
    console.log(`Server started on port ${process.env.PORT}`)
)}
).catch(err => console.log(err))
