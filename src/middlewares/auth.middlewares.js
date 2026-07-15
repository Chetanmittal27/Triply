import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";


export const verifyJWT = asyncHandler(async(req , res , next) => {

    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer" , "").trim();

    if(!token){
        throw new ApiError(401 , "Unauthorized Request");
    }

    // give the object of payload that is originally signed
    let decodedToken;
    try {
        decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET);
    } catch {
        throw new ApiError(401 , "Access token is invalid or expired");
    }

    const user = await User.findById(decodedToken._id).select(
        "-password -refreshToken -emailVerificationToken"
    );

    if(!user){
        throw new ApiError(401 , "Invalid Token");
    }

    req.user = user;

    next();
});