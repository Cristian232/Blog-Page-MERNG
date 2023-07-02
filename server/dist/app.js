"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("./utils/connection");
const express_graphql_1 = require("express-graphql");
const handlers_1 = __importDefault(require("./handlers/handlers"));
const express = require("express");
const { config } = require("dotenv");
config();
const app = express();
app.use("/graphql", (0, express_graphql_1.graphqlHTTP)({ schema: handlers_1.default, graphiql: true }));
(0, connection_1.connectToDb)().then(() => {
    app.listen(process.env.PORT, () => console.log(`Server started on port ${process.env.PORT}`));
}).catch(err => console.log(err));
//# sourceMappingURL=app.js.map