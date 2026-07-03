import cloudinary from "../config/cloudinary";

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
