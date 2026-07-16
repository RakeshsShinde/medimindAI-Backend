import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import * as path from "path";

// Load env variables from root .env file relative to this file's location
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "./.env") });

const isProd = process.env.NODE_ENV === "production";
const dbUrl = isProd 
  ? (process.env.PROD_DATABASE_URL || process.env.DATABASE_URL!) 
  : process.env.DATABASE_URL!;

export default defineConfig({
  schema: "./src/db/schema/*",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
});
