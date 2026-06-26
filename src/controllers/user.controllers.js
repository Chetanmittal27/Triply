import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";

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
    
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );


    return res.status(201)
    .json(
        new ApiResponse(201 , createdUser , "User Registered Successfully")
    );
});


