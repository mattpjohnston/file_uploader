import fs from "node:fs";
import path from "node:path";

import multer from "multer";

const uploadsDirectory = path.join(process.cwd(), "uploads");

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

export const upload = multer({ storage });
