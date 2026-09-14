import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

// Ensure env variables are loaded
dotenv.config();

let cloudName = process.env.CLOUDINARY_CLOUD_NAME;
let apiKey = process.env.CLOUDINARY_API_KEY;
let apiSecret = process.env.CLOUDINARY_API_SECRET;

// If CLOUDINARY_URL is present, parse it if individual credentials are missing
if (process.env.CLOUDINARY_URL) {
  const match = process.env.CLOUDINARY_URL.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
  if (match) {
    apiKey = apiKey || match[1];
    apiSecret = apiSecret || match[2];
    cloudName = cloudName || match[3];
  }
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

export default cloudinary;
