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

  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
};
