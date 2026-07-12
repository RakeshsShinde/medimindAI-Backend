import cloudinary from "../config/cloudinary";
import * as path from "path";

export const uploadToCloudinary = (fileBuffer: Buffer) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "medical-chat/profile",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        },
      )
      .end(fileBuffer);
  });
};

export const uploadDocumentToCloudinary = (fileBuffer: Buffer, fileName: string): Promise<any> => {
  const fileBaseName = path.parse(fileName).name;
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "medical-chat/documents",
          resource_type: "auto",
          public_id: `${fileBaseName}-${Date.now()}`,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        },
      )
      .end(fileBuffer);
  });
};

