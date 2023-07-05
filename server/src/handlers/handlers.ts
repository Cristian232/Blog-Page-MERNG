import {
    GraphQLObjectType,
    GraphQLList,
    GraphQLSchema,
    GraphQLString, GraphQLNonNull, GraphQLID
} from "graphql";
import {BlogType, CommentType, UserType} from "../schema/schema";
import User from "../models/User";
import Blog from "../models/Blog";
import Comment from "../models/Comment";
import {Document, startSession} from "mongoose";
import {compareSync, hashSync} from "bcryptjs";

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
                let existingUser: Document<any, any, any>;
                try {
                    existingUser = await User.findOne({email});
                    if (existingUser) return new Error("User already exists?!")
                    const encriptedPass = hashSync(password)
                    const user = new User({
                        name,
                        email,
                        password: encriptedPass
                    });
                    return await user.save();
                } catch (err) {
                    return new Error("User signup failed. Try again!")
                }
            }
        },
        login: {
            type: UserType,
            args: {
                email: {type: GraphQLNonNull(GraphQLString)},
                password: {type: GraphQLNonNull(GraphQLString)}
            },
            async resolve(parent, {email, password}) {
                let existingUser: Document<any, any, any>;
                try {
                    existingUser = await User.findOne({email});
                    if (!existingUser) {
                        return new Error("No user found with this email")
                    }
                    const decriptedPass = compareSync(
                        password,
                        // @ts-ignore
                        existingUser?.password
                    );
                    if (!decriptedPass) {
                        return new Error("Incorrect password");
                    }
                    return existingUser;
                } catch (err) {
                    return new Error(err)
                }
            }
        },
        addBlog: {
            type: BlogType,
            args: {
                title: {type: GraphQLNonNull(GraphQLString)},
                content: {type: GraphQLNonNull(GraphQLString)},
                date: {type: GraphQLNonNull(GraphQLString)},
                user: {type: GraphQLNonNull(GraphQLID)}
            },
            async resolve(parent, {title, content, date, user}) {
                let blog: Document<any, any, any>;
                const session = await startSession();
                try {
                    session.startTransaction({session})
                    blog = new Blog({title, content, date, user});
                    const existingUser = await User.findById(user)
                    if (!existingUser) {return new Error("User not found!")}
                    existingUser.blogs.push(blog);
                    await existingUser.save({session})
                    return await blog.save({session});
                } catch (err) {
                    return new Error(err)
                } finally {
                    await session.commitTransaction();
                }
            }
        },
        updateBlog: {
            type: BlogType,
            args: {
                id: {type: GraphQLNonNull(GraphQLID)},
                title: {type: GraphQLNonNull(GraphQLString)},
                content: {type: GraphQLNonNull(GraphQLString)}
            },
            async resolve(parent, {title, content, id}) {
                let existingBlog: Document<any, any, any>
                try {
                    existingBlog = await Blog.findById(id)
                    if (!existingBlog) {
                        return new Error("Blog does not exist")
                    }
                    return await Blog.findByIdAndUpdate(
                        id,
                        {
                            title,
                            content
                        },
                        {
                            new: true
                        }
                    )
                } catch (err) {
                    return new Error(err)
                }
            }
        },
        deleteBlog: {
            type: BlogType,
            args: {
                id: { type: GraphQLNonNull(GraphQLID)}
            },
            async resolve(parent, {id}){
                let deletedBlog: Document<any,any,any>
                try {
                    deletedBlog = await Blog.findById(id);
                    if (!deletedBlog){
                        return new Error("Blog not found")
                    }
                    return await Blog.findByIdAndDelete(id);
                }catch (e) {
                    return new Error(e)
                }
            }
        }
    }
})

export default new GraphQLSchema({query: RootQuery, mutation: mutations})