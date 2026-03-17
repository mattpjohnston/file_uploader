import "dotenv/config";
import path from "node:path";

import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error("Cloudinary environment variables not set.");
}

cloudinary.config({
  api_key: apiKey,
  api_secret: apiSecret,
  cloud_name: cloudName,
  secure: true,
});

export async function uploadToCloudinary(filePath: string) {
  return cloudinary.uploader.upload(filePath, {
    folder: process.env.CLOUDINARY_FOLDER || "file_uploader",
    resource_type: "raw",
  });
}

export async function deleteFromCloudinary(publicId: string) {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: "raw",
  });
}

export function getCloudinaryDownloadUrl(publicId: string, fileName: string) {
  const downloadName = path.parse(fileName).name.replace(/\s+/g, "-");

  return cloudinary.url(publicId, {
    flags: `attachment:${downloadName}`,
    resource_type: "raw",
    secure: true,
  });
}
