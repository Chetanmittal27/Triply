import { v2 as cloudinary } from "cloudinary";
import fs from "fs"

cloudinary.config({ 
  cloud_name: 'process.env.my_cloud_name', 
  api_key: 'process.env.my_key', 
  api_secret: 'process.env.my_secret'
});


const uploadOnCloudinary = async (localFilePath) => {

    try{
        if(!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath , {
            resource_type: "auto"
        });

        console.log("File uploaded on cloudinary Successfully " , response.url);
        fs.unlinkSync(localFilePath);                   // Deletes the temporary file from your server after uploading on cloud
        return response;
    }

    catch(error){
        fs.unlinkSync(localFilePath);
        console.error("Cloudinary upload failed:", error.message);
        return null;
    }
}


export {uploadOnCloudinary}