import {asyncHandler} from "../utils/asyncHandler.js";
import User from "../models/user.models.js";
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


export {getProfile};
