import { File } from "../models/file.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { getTripForMember } from "../utils/tripAccess.js";
export const uploadFile = asyncHandler(async(req,res)=>{await getTripForMember(req.params.tripId,req.user._id);if(!req.file) throw new ApiError(400,"A file is required");const result=await uploadOnCloudinary(req.file.path);if(!result)throw new ApiError(502,"File upload failed");const file=await File.create({tripId:req.params.tripId,uploadedBy:req.user._id,name:req.file.originalname,publicId: result.public_id || "",url:result.secure_url||result.url,type:req.file.mimetype==="application/pdf"?"pdf":"image",size:req.file.size});res.status(201).json(new ApiResponse(201,file,"File uploaded successfully"));});
export const getFiles=asyncHandler(async(req,res)=>{await getTripForMember(req.params.tripId,req.user._id);const files=await File.find({tripId:req.params.tripId}).populate("uploadedBy","username fullName avatar");res.json(new ApiResponse(200,files,"Files fetched successfully"));});
export const deleteFile=asyncHandler(async(req,res)=>{await getTripForMember(req.params.tripId,req.user._id);const file=await File.findOneAndDelete({_id:req.params.fileId,tripId:req.params.tripId});if(!file)throw new ApiError(404,"File not found");await deleteFromCloudinary(file.publicId, file.type === "pdf" ? "raw" : "image");res.json(new ApiResponse(200,{},"File deleted successfully"));});
