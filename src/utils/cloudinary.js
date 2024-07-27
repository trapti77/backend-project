
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import { response } from "express";

 // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret:process.env.CLOUDINARY_API_SECRET 
    });
const uploadOnCloudinary = async function (localFilePath) {
try {
     if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
        resource_type:"auto"
    })
    //file has been uploaded
    //console.log("file has been successfullyuploaded on cloudinary", response.url);
    //fs.unlinkSync()//synchronously means file remove hone ke baad hi ange rsponse milega
   // console.log(response)
    return response;//to the user\
} catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
}
}
export { uploadOnCloudinary }

    
    