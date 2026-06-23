import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            lowercase: true,
            unique: true
        },

        fullName: {
            type: String,
            required: true
        },

        email: {
            type: String,
            required: true,
            lowercase: true,
            unique: true
        },

        mobileNumber: {
            type: String,
            required: true
        },

        password: {
            type: String,
            required: true,
        },

        avatar: {
            type: String,
            default: ""
        },

        coverImage: {
            type: String
        },

        isVerified: {
            type: Boolean,
            default: false
        },

        gender: {
            type: String,
            enum: ["Male" , "Female" , "Prefer Not To Say"]
        },

        emailVerificationToken: {
            type: String,
            default: null
        },

        refreshToken: {
            type: String,
            default: null
        }

    },{timestamps: true}

);


export const User = mongoose.model("User" , userSchema);