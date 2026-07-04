import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import crypto from "crypto"
import {sendEmail} from "../utils/sendEmails.js"

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
    
    if(!avatarLocalPath){
        throw new ApiError(400 , "Avatar is required");
    }

    const coverImageLocalPath = Array.isArray(req.files?.coverImage) && req.files.coverImage.length > 0 ? req.files.coverImage[0].path : undefined;


    // 5) Upload files on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(500, "Failed to upload avatar");
    }

    // Create db
    const user = await User.create({
        username,
        email,
        fullName,
        password,
        mobileNumber,
        gender,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
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
        <a href="${process.env.BASE_URL}/api/auth/verify-email?token=${verificationToken}">
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


export {registerUser , loginUser , logoutUser};