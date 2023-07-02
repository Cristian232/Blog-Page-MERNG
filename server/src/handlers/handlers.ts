import {
    GraphQLObjectType,
    GraphQLList,
    GraphQLSchema,
    GraphQLString
} from "graphql";
import {BlogType, CommentType, UserType} from "../schema/schema";
import User from "../models/User";
import Blog from "../models/Blog";
import Comment from "../models/Comment";
import {Document} from "mongoose";
import {hashSync} from "bcryptjs";

const RootQuery = new GraphQLObjectType({
    name: "RootQuery",
    fields: {
        users: {
            type: GraphQLList(UserType),
            async resolve() {
                return await User.find();
            }
        },
        blogs: {
            type: GraphQLList(BlogType),
            async resolve() {
                return await Blog.find();
            }
        },
        comments: {
            type: GraphQLList(CommentType),
            async resolve() {
                return await Comment.find();
            }
        }
    }
})

const mutations = new GraphQLObjectType({
    name: "mutations",
    fields: {
        signup: {
            type: UserType,
            args: {
                name: {type: GraphQLString},
                email: {type: GraphQLString},
                password: {type: GraphQLString}
            },
            async resolve(parent, {name, email, password}) {
                let existingUser : Document<any,any,any>;
                try {
                    existingUser = await User.findOne({email});
                    if (existingUser) return new Error("User already exists?!")
                    const encriptedPass = hashSync(password)
                    const user = new User({name, email, password: encriptedPass});
                    return await user.save();
                } catch (err) {
                    return new Error("User signup failed. Try again!")
                }
            }
        }
    }
})

export default new GraphQLSchema({query: RootQuery, mutation: mutations})