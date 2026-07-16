import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT!,
  DATABASE_URL: process.env.DATABASE_URL!,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME!,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY!,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET!,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY!,
  QDRANT_URL: process.env.QDRANT_URL!,
  QDRANT_API_KEY: process.env.QDRANT_API_KEY!,
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL!,
  GROQ_API_KEY: process.env.GROQ_API_KEY!,
  GROQ_MODEL: process.env.GROQ_MODEL!,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
  COHERE_API_KEY: process.env.COHERE_API_KEY!,
  NODE_ENV: process.env.NODE_ENV || "development",
  get COLLECTION() {
    return this.NODE_ENV === "production" ? "production_medical_chunks" : "medical_chunks";
  }
};
