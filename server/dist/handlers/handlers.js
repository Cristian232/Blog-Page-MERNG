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
const mongoose_1 = require("mongoose");
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
                    const user = new User_1.default({
                        name,
                        email,
                        password: encriptedPass
                    });
                    return await user.save();
                }
                catch (err) {
                    return new Error("User signup failed. Try again!");
                }
            }
        },
        login: {
            type: schema_1.UserType,
            args: {
                email: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                password: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
            },
            async resolve(parent, { email, password }) {
                let existingUser;
                try {
                    existingUser = await User_1.default.findOne({ email });
                    if (!existingUser) {
                        return new Error("No user found with this email");
                    }
                    const decriptedPass = (0, bcryptjs_1.compareSync)(password, 
                    // @ts-ignore
                    existingUser?.password);
                    if (!decriptedPass) {
                        return new Error("Incorrect password");
                    }
                    return existingUser;
                }
                catch (err) {
                    return new Error(err);
                }
            }
        },
        addBlog: {
            type: schema_1.BlogType,
            args: {
                title: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                content: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                date: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                user: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }
            },
            async resolve(parent, { title, content, date, user }) {
                let blog;
                const session = await (0, mongoose_1.startSession)();
                try {
                    session.startTransaction({ session });
                    blog = new Blog_1.default({ title, content, date, user });
                    const existingUser = await User_1.default.findById(user);
                    if (!existingUser) {
                        return new Error("User not found!");
                    }
                    existingUser.blogs.push(blog);
                    await existingUser.save({ session });
                    return await blog.save({ session });
                }
                catch (err) {
                    return new Error(err);
                }
                finally {
                    await session.commitTransaction();
                }
            }
        },
        updateBlog: {
            type: schema_1.BlogType,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                title: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                content: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
            },
            async resolve(parent, { title, content, id }) {
                let existingBlog;
                try {
                    existingBlog = await Blog_1.default.findById(id);
                    if (!existingBlog) {
                        return new Error("Blog does not exist");
                    }
                    return await Blog_1.default.findByIdAndUpdate(id, {
                        title,
                        content
                    }, {
                        new: true
                    });
                }
                catch (err) {
                    return new Error(err);
                }
            }
        },
        deleteBlog: {
            type: schema_1.BlogType,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }
            },
            async resolve(parent, { id }) {
                let deletedBlog;
                const session = await (0, mongoose_1.startSession)();
                try {
                    session.startTransaction({ session });
                    deletedBlog = await Blog_1.default.findById(id).populate("user");
                    //@ts-ignore
                    const existingUser = deletedBlog?.user;
                    if (!existingUser) {
                        return new Error("User not found");
                    }
                    if (!deletedBlog) {
                        return new Error("Blog not found");
                    }
                    existingUser.blogs.pull(deletedBlog);
                    await existingUser.save({ session });
                    return await Blog_1.default.findByIdAndDelete(id);
                }
                catch (e) {
                    return new Error(e);
                }
                finally {
                    await session.commitTransaction();
                }
            }
        },
        addCommentToBlog: {
            type: schema_1.CommentType,
            args: {
                user: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                blog: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                text: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                date: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
            },
            async resolve(parent, { user, blog, text, date }) {
                const session = await (0, mongoose_1.startSession)();
                let comment;
                try {
                    session.startTransaction({ session });
                    const existingUser = await User_1.default.findById(user);
                    const existingBlog = await Blog_1.default.findById(blog);
                    if (!existingUser || !existingBlog) {
                        return new Error("Not found User or Blog");
                    }
                    comment = new Comment_1.default({
                        text,
                        date,
                        blog,
                        user
                    });
                    existingUser.comments.push(comment);
                    existingBlog.comments.push(comment);
                    await existingBlog.save({ session });
                    await existingUser.save({ session });
                    return await comment.save({ session });
                }
                catch (err) {
                    return new Error(err);
                }
                finally {
                    await session.commitTransaction();
                }
            }
        },
        deleteComment: {
            type: schema_1.CommentType,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }
            },
            async resolve(parent, { id }) {
                let deleteComment;
                const session = await (0, mongoose_1.startSession)();
                try {
                    session.startTransaction({ session });
                    deleteComment = await Comment_1.default.findById(id).populate("user");
                    if (!deleteComment) {
                        return new Error("Comment not found");
                    }
                    //@ts-ignore
                    const existingUser = await User_1.default.findById(comment?.user);
                    if (!existingUser) {
                        return new Error("User not found");
                    }
                    //@ts-ignore
                    const existingBlog = await Blog_1.default.findById(comment?.blog);
                    if (!existingBlog) {
                        return new Error("Blog not found");
                    }
                    existingUser.comments.pull(deleteComment);
                    existingBlog.comments.pull(deleteComment);
                    await existingUser.save({ session });
                    await existingBlog.save({ session });
                    return await Comment_1.default.findByIdAndDelete(id);
                }
                catch (err) {
                    return new Error(err);
                }
                finally {
                    await session.commitTransaction();
                }
            }
        }
    }
});
exports.default = new graphql_1.GraphQLSchema({ query: RootQuery, mutation: mutations });
//# sourceMappingURL=handlers.js.map