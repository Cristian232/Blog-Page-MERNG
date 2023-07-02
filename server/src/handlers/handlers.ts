import {GraphQLObjectType, GraphQLList, GraphQLSchema} from "graphql";
import {BlogType, CommentType, UserType} from "../schema/schema";
import User from "../models/User";
import Blog from "../models/Blog";
import Comment from "../models/Comment";


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

export default new GraphQLSchema({query: RootQuery})