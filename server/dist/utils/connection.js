"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDb = void 0;
const mongoose_1 = require("mongoose");
const connectToDb = async () => {
    try {
        await (0, mongoose_1.connect)(`mongodb+srv://admin_me:${process.env.MONGODB_PASSWORD}@cluster0.ctogugp.mongodb.net/?retryWrites=true&w=majority`);
    }
    catch (err) {
        console.log(err);
        return err;
    }
};
exports.connectToDb = connectToDb;
//# sourceMappingURL=connection.js.map