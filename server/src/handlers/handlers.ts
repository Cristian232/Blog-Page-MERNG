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
import mongoose, {Document, Schema, startSession, Types} from "mongoose";
import {compareSync, hashSync} from "bcryptjs";
import { ObjectId } from 'mongodb';


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
                id: { type: GraphQLNonNull(GraphQLID) },
            },
            async resolve(parent, { id }) {
                let deletedBlog;
                const session = await startSession();
                try {
                    session.startTransaction();
                    deletedBlog = await Blog.findById(id).populate("user");
                    if (!deletedBlog) {
                        throw new Error("Blog not found");
                    }
                    const existingUser = deletedBlog.user;
                    if (!existingUser) {
                        throw new Error("User not found");
                    }
                    existingUser.blogs.pull(deletedBlog);
                    await existingUser.save({ session });
                    const deletedBlogResult = await deletedBlog.deleteOne({ _id: id });
                    return deletedBlogResult;
                } catch (e) {
                    throw new Error(e);
                } finally {
                    await session.endSession();
                }
            },
        },
        addCommentToBlog: {
            type: CommentType,
            args: {
                user: {type: GraphQLNonNull(GraphQLID)},
                blog: {type: GraphQLNonNull(GraphQLID)},
                text: {type: GraphQLNonNull(GraphQLString)},
                date: {type: GraphQLNonNull(GraphQLString)}
            },
            async resolve(parent, {user, blog, text, date}){
                const session = await startSession();
                let comment : Document<any,any,any>
                try {
                    session.startTransaction({session});
                    const existingUser = await User.findById(user)
                    const existingBlog = await Blog.findById(blog)
                    if(!existingUser || !existingBlog) {return new Error("Not found User or Blog")}
                    comment = new Comment({
                        text,
                        date,
                        blog,
                        user
                    })
                    existingUser.comments.push(comment)
                    existingBlog.comments.push(comment)
                    await existingBlog.save({ session })
                    await existingUser.save({ session })
                    return await comment.save({ session })
                } catch (err) {
                    return new Error(err)
                } finally {
                    await session.commitTransaction()
                }
            }
        },
        deleteComment: {
            type: CommentType,
            args: {
                id: {type: GraphQLNonNull(GraphQLID)}
            },
            async resolve(parent, {id}){
                let deleteComment : Document<any, any, any>;
                const commentId = new ObjectId(id);
                const session = await startSession();
                try {
                    session.startTransaction({ session });
                    deleteComment = await Comment.findById(commentId);
                    if (!deleteComment) {return new Error("Comment not found")}
                    //@ts-ignore
                    const existingUser = await User.findById(deleteComment?.user)
                    if (!existingUser) {return new Error("User not found")}
                    //@ts-ignore
                    const existingBlog = await Blog.findById(deleteComment?.blog)
                    if (!existingBlog) {return new Error("Blog not found")}
                    existingUser.comments.pull(deleteComment);
                    existingBlog.comments.pull(deleteComment);
                    await existingUser.save({session})
                    await existingBlog.save({session})
                    return await deleteComment.deleteOne(commentId)
                }catch (err) {
                    return new Error(err)
                }finally {
                    await session.commitTransaction()
                }
            }
        }
    }
})

export default new GraphQLSchema({query: RootQuery, mutation: mutations})