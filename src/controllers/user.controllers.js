import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.models.js";
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import crypto from "crypto"
import {sendEmail} from "../utils/sendEmails.js"
import jwt from "jsonwebtoken";

const registerUser = asyncHandler(async(req , res) => {

    // 1) Access Data entered by user
    let {username , email , fullName, password , mobileNumber , gender} = req.body
    username = username?.trim().toLowerCase(); email = email?.trim().toLowerCase(); fullName = fullName?.trim(); mobileNumber = mobileNumber?.trim(); gender = gender?.trim();

    // 2) validate data entered by user
    if(
        [username, email, fullName, password , mobileNumber , gender].some((field) => 
            !field || field.trim() === "")
        ){
            throw new ApiError(400 , "All Fields are Required");
        }

    if (password.length < 8) throw new ApiError(400, "Password must be at least 8 characters");

    // 3) check db already exists or not with the entered username and email
    const existedUser = await User.findOne(
        {
            $or: [username ? { username } : null, email ? { email } : null].filter(Boolean)
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
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save({validateBeforeSave: false});

    
    // verifying email
    sendEmail({
        to: user.email,
        subject: "Verify your Triply Account",
        html: `
        <h2>Welcome To Triply!</h2>
        <p>Click below to verify your Triply Account</p>
        <a href="${process.env.BASE_URL}/api/auth/verify-email?token=${verificationToken}">
        Verify Email
        </a>
        `
    }).catch((err) => console.error("Failed to send verification email:", err.message));



    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken"
    );


    return res.status(201)
    .json(
        new ApiResponse(201 , createdUser , "User Registered Successfully")
    );
});


const loginUser = asyncHandler(async(req , res) => {

    let {username , email , password} = req.body;
    username = username?.trim().toLowerCase(); email = email?.trim().toLowerCase();

    if(!username && !email){
        throw new ApiError(400 , "Either Username or Email is Required");
    }

    if(!password){
        throw new ApiError(400 , "Password is Required");
    }


    const existedUser = await User.findOne(
        {
            $or: [username ? { username } : null, email ? { email } : null].filter(Boolean)
        }
    );

    if(!existedUser){
        throw new ApiError(404 , "No account found for that email or username. Register first or check the spelling."); 
    }


    // add this after finding user
    if(!existedUser.isVerified){
        throw new ApiError(403, "Please verify your email first. Check your inbox for the verification link.")
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
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    };

    return res.status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken" , refreshToken , options)
    .json(
        new ApiResponse(200 , { user, accessToken, refreshToken } , "User LoggedIn Successfully")
    )
});


const logoutUser = asyncHandler(async(req , res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        { $set: { refreshToken: null } },
        { returnDocument: 'after' }   // ✅ updated
    );

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    };

    return res.status(200)
    .clearCookie("accessToken" , options)
    .clearCookie("refreshToken" , options)
    .json(new ApiResponse(200 , {} , "User Logout Successfully"));
});

const RefreshAccessToken = asyncHandler(async(req , res) => {

    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(400 , "Unauthorised Request");
    }

    let decodedRefreshToken;
    try {
        decodedRefreshToken = jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET);
    } catch {
        throw new ApiError(401, "Refresh token is invalid or expired");
    }


    const user = await User.findById(decodedRefreshToken._id);

    if(!user){
        throw new ApiError(401 , "Refresh Token is Invalid");
    }


    if(incomingRefreshToken !== user.refreshToken){
        throw new ApiError(401 , "Refresh Token is not latest or Expired");
    }


    const newAccessToken = await user.createAccessToken();
    const newRefreshToken = await user.createRefreshToken();
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    }

    
    return res.status(200)
    .cookie("accessToken" , newAccessToken , options)
    .cookie("refreshToken" , newRefreshToken , options)
    .json(
        new ApiResponse(200 , { newAccessToken, refreshToken: newRefreshToken } , "Access Token Refreshed")
    );


});


const verifyEmail = asyncHandler(async(req , res) => {

    const {token} = req.query;
    const frontend = process.env.FRONTEND_URL || process.env.BASE_URL || "http://localhost:5173";

    if(!token){
        return res.redirect(`${frontend}/email-verified?status=error&message=${encodeURIComponent("Verification token is required")}`);
    }

    const user = await User.findOne({ emailVerificationToken: token, emailVerificationExpires: { $gt: new Date() } });

    if(!user){
        return res.redirect(`${frontend}/email-verified?status=error&message=${encodeURIComponent("Verification link is invalid or expired")}`);
    }

    if(user.isVerified){
        return res.redirect(`${frontend}/email-verified?status=already`);
    }

    user.isVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save({validateBeforeSave: false});

    return res.redirect(`${frontend}/login?verified=success`);
});


const resendVerifyEmail = asyncHandler(async(req , res) => {

    const {email} = req.body;

    if(!email){
        throw new ApiError(400 , "Email is Required");
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
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save({validateBeforeSave: false});

    sendEmail({
        to: user.email,
        subject: "Verify your Triply Account",
        html: `
        <h2>Welcome To Triply!</h2>
        <p>Click below to verify your Triply Account</p>
        <a href="${process.env.BASE_URL}/api/auth/verify-email?token=${verificationToken}">
        Verify Email
        </a>
        `
    }).catch((err) => console.error("Failed to send verification email:", err.message));


    return res.status(200)
    .json(
        new ApiResponse(200 , {} , "Verification Mail again sent successfully")
    );
});



export {registerUser , loginUser , logoutUser , RefreshAccessToken , verifyEmail , resendVerifyEmail};


const updateAvatar = asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, "Avatar image is required");
    const current = await User.findById(req.user._id);
    const uploaded = await uploadOnCloudinary(req.file.path);
    if (!uploaded) throw new ApiError(502, "Avatar upload failed");
    const oldPublicId = current.avatar?.public_id;
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { avatar: { url: uploaded.secure_url || uploaded.url, public_id: uploaded.public_id || "" } },
        { returnDocument: "after" }
    ).select("-password -refreshToken -emailVerificationToken");
    if (oldPublicId) await deleteFromCloudinary(oldPublicId, "image");
    res.json(new ApiResponse(200, user, "Avatar updated successfully"));
});


const updateCoverImage = asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, "Cover image is required");
    const current = await User.findById(req.user._id);
    const uploaded = await uploadOnCloudinary(req.file.path);
    if (!uploaded) throw new ApiError(502, "Cover image upload failed");
    const oldPublicId = current.coverImage?.public_id;
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { coverImage: { url: uploaded.secure_url || uploaded.url, public_id: uploaded.public_id || "" } },
        { returnDocument: "after" }
    ).select("-password -refreshToken -emailVerificationToken");
    if (oldPublicId) await deleteFromCloudinary(oldPublicId, "image");
    res.json(new ApiResponse(200, user, "Cover image updated successfully"));
});


const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) throw new ApiError(400, "currentPassword and newPassword are required");
    if (newPassword.length < 8) throw new ApiError(400, "New password must be at least 8 characters");
    const user = await User.findById(req.user._id);
    if (!(await user.isPasswordCorrect(currentPassword))) throw new ApiError(401, "Current password is incorrect");
    user.password = newPassword; user.refreshToken = null; await user.save();
    res.json(new ApiResponse(200, {}, "Password changed successfully; please sign in again"));
});


const getProfile = asyncHandler(async (req, res) => res.json(new ApiResponse(200, req.user, "Profile fetched successfully")));
const updateProfile = asyncHandler(async (req, res) => {
    const allowed = ["fullName", "mobileNumber", "gender"];
    const update = Object.fromEntries(allowed.filter((key) => req.body[key] !== undefined).map((key) => [key, req.body[key]]));
    const user = await User.findByIdAndUpdate(req.user._id, update, { returnDocument: 'aftern', runValidators: true }).select("-password -refreshToken -emailVerificationToken");
    res.json(new ApiResponse(200, user, "Profile updated successfully"));
});
export { updateAvatar, updateCoverImage, changePassword, getProfile, updateProfile };


const forgotPassword = asyncHandler(async (req, res) => {
    const email = req.body.email?.trim().toLowerCase();
    if (!email) throw new ApiError(400, "Email is required");
    const user = await User.findOne({ email });
    if (user) {
        const token = crypto.randomBytes(32).toString("hex");
        user.passwordResetToken = token;
        user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
        await user.save({ validateBeforeSave: false });
        sendEmail({ to: user.email, subject: "Reset your Triply password", html: `<p>Reset your password within one hour:</p><a href="${process.env.FRONTEND_URL || process.env.BASE_URL}/reset-password?token=${token}">Reset password</a>` }).catch((err) => console.error("Failed to send password reset email:", err.message));
    }
    res.json(new ApiResponse(200, {}, "If an account exists for that email, a reset link has been sent."));
});

const resetPassword = asyncHandler(async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) throw new ApiError(400, "Token and password are required");
    if (password.length < 8) throw new ApiError(400, "Password must be at least 8 characters");
    const user = await User.findOne({ passwordResetToken: token, passwordResetExpires: { $gt: new Date() } });
    if (!user) throw new ApiError(400, "Reset link is invalid or expired");
    user.password = password; user.passwordResetToken = null; user.passwordResetExpires = null; user.refreshToken = null;
    await user.save();
    res.json(new ApiResponse(200, {}, "Password reset successfully. Please sign in."));
});

export { forgotPassword, resetPassword };
