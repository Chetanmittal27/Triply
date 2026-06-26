import mongoose from "mongoose";
import bcrypt from "bcrypt"

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
            type: String,
            default: ""
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


userSchema.pre("save" , async function(next){
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password , 10);

    next();
});

export const User = mongoose.model("User" , userSchema);