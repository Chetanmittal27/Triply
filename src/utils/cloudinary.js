import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.my_cloud_name,
  api_key: process.env.my_key,
  api_secret: process.env.my_secret
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto" });
        if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        if (localFilePath && fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
        console.error("Cloudinary upload failed:", error.message);
        return null;
    }
};

const deleteFromCloudinary = async (publicId, resourceType = "image") => { if (!publicId) return; try { await cloudinary.uploader.destroy(publicId, { resource_type: resourceType }); } catch (error) { console.error("Cloudinary delete failed:", error.message); } };

export { uploadOnCloudinary, deleteFromCloudinary };
