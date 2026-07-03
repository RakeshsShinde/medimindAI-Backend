import multer from "multer";
import { ApiError } from "../utils/ApiError";

const storage = multer.memoryStorage();

export const imageUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter(req, file, cb) {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new ApiError(400, "Only jpg, jpeg, png and webp files are allowed"),
      );
    }

    cb(null, true);
  },
});

export const documentUpload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
  fileFilter(req, file, cb) {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new ApiError(400, "Only PDF and DOCX files are allowed"));
    }

    cb(null, true);
  },
});
