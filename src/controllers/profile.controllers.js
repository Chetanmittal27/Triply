import {asyncHandler} from "../utils/asyncHandler.js";
import {User} from "../models/user.models.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";

const getProfile = asyncHandler(async(req , res) => {

    const user = await User.findById(req.user._id).select(
        "-refreshToken -password -emailVerificationToken"
    )

    if(!user){
        throw new ApiError(400 , "User Not Found");
    }

    return res.status(200)
    .json(
        new ApiResponse(200 , user , "Profile Fetched Successfully")
    );

});


const updateProfile = asyncHandler(async(req , res) => {

    const {fullName , mobileNumber} = req.body;

    if(!fullName && !mobileNumber){
        throw new ApiError(400 , "At least one field fullName or mobileNumber is required");
    }


    const updateFields = {};

    if(fullName) updateFields.fullName = fullName.trim();
    if(mobileNumber) updateFields.mobileNumber = mobileNumber.trim();


    const user = await User.findByIdAndUpdate(
        req.user._id,
        
        {
            $set: updateFields
        },

        {new: true}

    ).select(
        "-password -refreshToken -emailVerificationToken"
    )

    if(!user){
        throw new ApiError(400 , "User not found");
    }


    return res.status(200)
    .json(
        new ApiResponse(200 , user , "Profile Updated Successfully")
    )

});

export {getProfile , updateProfile};
