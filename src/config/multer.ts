import fs from "node:fs";
import path from "node:path";

import multer from "multer";

const uploadsDirectory = path.join(process.cwd(), "uploads");
const maxFileSize = 5 * 1024 * 1024;
const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/png", "text/plain"];

fs.mkdirSync(uploadsDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadsDirectory);
  },
  filename: (_req, file, callback) => {
    const originalName = file.originalname.replace(/\s+/g, "-");

    callback(null, `${Date.now()}-${originalName}`);
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, callback) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    callback(null, true);
    return;
  }

  callback(new Error("INVALID_FILE_TYPE"));
};

export const upload = multer({
  fileFilter,
  limits: {
    fileSize: maxFileSize,
  },
  storage,
});
