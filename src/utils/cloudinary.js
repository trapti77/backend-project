
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import { response } from "express";

const uploadOnCloudinary = async function (localFilePath) {
try {
     if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
        resource_type:"auto"
    })
    //file has been uploaded
    console.log("file has been successfullyuploaded on cloudinary", response.url);
    return response;//to the user
} catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
}
}
export {uploadOnCloudinary}