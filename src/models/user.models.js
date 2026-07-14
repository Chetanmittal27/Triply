import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv"; 
dotenv.config();

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
            url: { type: String, default: "" },
            public_id: { type: String, default: "" }
        },

        coverImage: {
            url: { type: String, default: "" },
            public_id: { type: String, default: "" }
        },

        isVerified: {
            type: Boolean,
            default: false
        },

        gender: {
            type: String,
            enum: ["Male" , "Female" , "Prefer Not To Say"]
        },

        emailVerificationToken: { type: String, default: null },
        emailVerificationExpires: { type: Date, default: null },
        passwordResetToken: { type: String, default: null },
        passwordResetExpires: { type: Date, default: null },

        refreshToken: {
            type: String,
            default: null
        }

    },{timestamps: true}

);


userSchema.pre("save" , async function(){
    if(!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password , 10);
});


userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password , this.password);
};

userSchema.methods.createAccessToken = function(){
    return jwt.sign(

        {
            _id: this._id,
            username: this.username,
            email: this.email
        },

        process.env.ACCESS_TOKEN_SECRET,

        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
};


userSchema.methods.createRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id
        },

        process.env.REFRESH_TOKEN_SECRET,

        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY 
        }
    )
};


export const User = mongoose.model("User" , userSchema);