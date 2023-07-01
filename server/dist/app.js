"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("./utils/connection");
const express = require("express");
const { config } = require("dotenv");
config();
const app = express();
(0, connection_1.connectToDb)().then(() => {
    app.listen(process.env.PORT, () => console.log(`Server started on port ${process.env.PORT}`));
}).catch(err => console.log(err));
//# sourceMappingURL=app.js.map