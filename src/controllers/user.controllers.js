import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"

const registerUser = asyncHandler(async(req , res) => {

    // 1) Access Data entered by user
    const {username , email , ...rest} = req.body

    // 2) validate data entered by user
    if(
        [username, email, ...rest].some((field) => 
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


    if(!existedUser){
        throw new ApiError(400 , "User not found");
    };

    
    // 4) 
});


