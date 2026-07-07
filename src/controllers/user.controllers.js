import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import crypto from "crypto"
import {sendEmail} from "../utils/sendEmails.js"
import jwt from "jsonwebtoken";

const registerUser = asyncHandler(async(req , res) => {

    // 1) Access Data entered by user
    const {username , email , fullName, password , mobileNumber , gender} = req.body

    // 2) validate data entered by user
    if(
        [username, email, fullName, password , mobileNumber , gender].some((field) => 
            field?.trim() === "")
        ){
            throw new ApiError(400 , "All Fields are Required");
        }

    // 3) check db already exists or not with the entered username and email
    const existedUser = await User.findOne(
        {
            $or: [{username} , {email}]
        }
    );


    if(existedUser){
        throw new ApiError(409, "User with this Email or Username already exists");
    };

    
    // 4) Check for files
    const avatarLocalPath = Array.isArray(req.files?.avatar) && req.files.avatar.length > 0 ? req.files.avatar[0].path : undefined;
    
    const coverImageLocalPath = Array.isArray(req.files?.coverImage) && req.files.coverImage.length > 0 ? req.files.coverImage[0].path : undefined;


    // 5) Upload files on cloudinary
    const avatar = avatarLocalPath? await uploadOnCloudinary(avatarLocalPath) : null;
    const coverImage = coverImageLocalPath? await uploadOnCloudinary(coverImageLocalPath) : null;

    if(avatarLocalPath && !avatar.url){
        throw new ApiError(500, "Failed to upload avatar");
    }

    if(coverImageLocalPath && !coverImage.url){
        throw new ApiError(500 , "Failed to upload cover image");
    }

    // Create db
    const user = await User.create({
        username,
        email,
        fullName,
        password,
        mobileNumber,
        gender,
        avatar: {
            url: avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}`,
            public_id: avatar?.public_id || ""
        },
        coverImage: {
            url: coverImage?.url || "",
            public_id: coverImage?.public_id || ""
        }
    });

    if(!user){
        throw new ApiError(500 , "User Not Created");
    }


    // create a verfication token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = verificationToken;
    await user.save({validateBeforeSave: false});

    
    // verifying email
    await sendEmail({
        to: user.email,
        subject: "Verify your Triply Account",
        html: `
        <h2>Welcome To Triply!</h2>
        <p>Click below to verify your Triply Account</p>
        <a href="${process.env.BASE_URL}/api/users/verify-email?token=${verificationToken}">
        Verify Email
        </a>
        `
    });



    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken"
    );


    return res.status(201)
    .json(
        new ApiResponse(201 , createdUser , "User Registered Successfully")
    );
});


const loginUser = asyncHandler(async(req , res) => {

    const {username , email , password} = req.body;

    if(!username && !email){
        throw new ApiError(400 , "Either Username or Email is Required");
    }

    if(!password){
        throw new ApiError(400 , "Password is Required");
    }


    const existedUser = await User.findOne(
        {
            $or: [{username} , {email}]
        }
    );

    if(!existedUser){
        throw new ApiError(404 , "User with entered email or username does not exist"); 
    }


    // add this after finding user
    if(!existedUser.isVerified){
        throw new ApiError(403, "Please verify your email first")
    } 

    const isPasswordCorrect = await existedUser.isPasswordCorrect(password);

    if(!isPasswordCorrect){
        throw new ApiError(401 , "Password is Incorrect");
    }


    // Create access and refresh token
    const accessToken = await existedUser.createAccessToken();
    const refreshToken = await existedUser.createRefreshToken();

    existedUser.refreshToken = refreshToken;
    await existedUser.save({validateBeforeSave: false});


    const user = await User.findById(existedUser._id).select(
        "-password -refreshToken -emailVerificationToken"
    );

    const options = {
        httpOnly: true,
        secure: true
    };

    return res.status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken" , refreshToken , options)
    .json(
        new ApiResponse(200 , user , "User LoggedIn Successfully")
    )
});


const logoutUser = asyncHandler(async(req , res) => {

    await User.findByIdAndUpdate(
        req.user._id,

        {
            $set: {
                refreshToken: null
            }
        },

        {
            new: true
        }
    );

    const options = {
        httpOnly: true,
        secure: true
    }


    return res.status(200)
    .clearCookie("accessToken" , options)
    .clearCookie("refreshToken" , options)
    .json(
        new ApiResponse(200 , {} , "User Logout Successfully")
    )
});


const RefreshAccessToken = asyncHandler(async(req , res) => {

    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(400 , "Unauthorised Request");
    }

    const decodedRefreshToken = jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET);


    const user = await User.findById(decodedRefreshToken._id);

    if(!user){
        throw new ApiError(401 , "Refresh Token is Invalid");
    }


    if(incomingRefreshToken !== user.refreshToken){
        throw new ApiError(401 , "Refresh Token is not latest or Expired");
    }


    const newAccessToken = await user.createAccessToken();

    const options = {
        httpOnly: true,
        secure: true
    }

    
    return res.status(200)
    .cookie("accessToken" , newAccessToken , options)
    .cookie("refreshToken" , incomingRefreshToken , options)
    .json(
        new ApiResponse(200 , {newAccessToken , incomingRefreshToken} , "Access Token Refreshed")
    );


});


const verifyEmail = asyncHandler(async(req , res) => {

    // User clicks link in email
    //     ↓
    // Browser hits this URL:
    // GET /api/auth/verify-email?token=abc123
    //     ↓
    // Your verifyEmail controller runs
    //     ↓
    // Find user with that token in DB
    //     ↓
    // Mark as verified + clear token
    //     ↓
    // Return success


    // Get verification token when link is clicked
    const {token} = req.query;

    if(!token){
        throw new ApiError(400, "Verification Token is Required")
    }

    const user = await User.findOne({emailVerificationToken: token});

    if(!user){
        throw new ApiError(404 , "User not found");
    }

    const isVerified = user.isVerified;

    if(isVerified){
        throw new ApiError(401 , "User Already Verified");
    }


    user.isVerified = true;

    user.emailVerificationToken = null;

    await user.save({validateBeforeSave: false});

    return res.status(200)
    .json(
        new ApiResponse(200 , {} , "User Verified Successfully")
    );
});


const resendVerifyEmail = asyncHandler(async(req , res) => {

    const {email} = req.body;

    if(!email){
        throw new ApiError(401 , "Email is Required");
    }

    const user = await User.findOne({email});

    if(!user){
        throw new ApiError(404 , "User does not exist with this email");
    }


    if(user.isVerified){
        throw new ApiError(400 , "User already verified, No need to resend verfication email");
    }


    const verificationToken = crypto.randomBytes(32).toString("hex");

    user.emailVerificationToken = verificationToken;
    await user.save({validateBeforeSave: false});

    await sendEmail(
        {
            to: user.email,
            subject: "Verify Your Triply Account",
            html: `
            <h2>Welcome to Triply!</h2>
            <p>Click the link below to verify your Triply Account</p>
            <a href="${process.env.BASE_URL}/api/users/verify-email?token=${verificationToken}">
            Verify Email
            </a>
            `
        }
    );


    return res.status(200)
    .json(
        new ApiResponse(200 , {} , "Verification Mail again sent successfully")
    );
});



export {registerUser , loginUser , logoutUser , RefreshAccessToken , verifyEmail , resendVerifyEmail};