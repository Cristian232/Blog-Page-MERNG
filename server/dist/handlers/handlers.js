"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const schema_1 = require("../schema/schema");
const User_1 = __importDefault(require("../models/User"));
const Blog_1 = __importDefault(require("../models/Blog"));
const Comment_1 = __importDefault(require("../models/Comment"));
const bcryptjs_1 = require("bcryptjs");
const RootQuery = new graphql_1.GraphQLObjectType({
    name: "RootQuery",
    fields: {
        users: {
            type: (0, graphql_1.GraphQLList)(schema_1.UserType),
            async resolve() {
                return await User_1.default.find();
            }
        },
        blogs: {
            type: (0, graphql_1.GraphQLList)(schema_1.BlogType),
            async resolve() {
                return await Blog_1.default.find();
            }
        },
        comments: {
            type: (0, graphql_1.GraphQLList)(schema_1.CommentType),
            async resolve() {
                return await Comment_1.default.find();
            }
        }
    }
});
const mutations = new graphql_1.GraphQLObjectType({
    name: "mutations",
    fields: {
        signup: {
            type: schema_1.UserType,
            args: {
                name: { type: graphql_1.GraphQLString },
                email: { type: graphql_1.GraphQLString },
                password: { type: graphql_1.GraphQLString }
            },
            async resolve(parent, { name, email, password }) {
                let existingUser;
                try {
                    existingUser = await User_1.default.findOne({ email });
                    if (existingUser)
                        return new Error("User already exists?!");
                    const encriptedPass = (0, bcryptjs_1.hashSync)(password);
                    const user = new User_1.default({ name, email, password: encriptedPass });
                    return await user.save();
                }
                catch (err) {
                    return new Error("User signup failed. Try again!");
                }
            }
        }
    }
});
exports.default = new graphql_1.GraphQLSchema({ query: RootQuery, mutation: mutations });
//# sourceMappingURL=handlers.js.map