import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.resolve("C:/Users/rajve/OneDrive/Desktop/friday/.env"),
});
// 1. Let dotenv find the .env file naturally in the project root.
// dotenv.config();

// 2. Fail loud and early if the environment is misconfigured.
const DB_URL = process.env.DB_URL;
if (!DB_URL) {
  console.error("FATAL: DB_URL is not defined in the environment.");
  process.exit(1);
}

export const dbConnect = async () => {
  try {
    // 3. Attach listeners BEFORE connecting to catch post-boot drops
    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected! Attempting to reconnect...");
    });

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB runtime error:", err);
    });

    await mongoose.connect(DB_URL);
    console.log("DB CONNECTION IS SUCCESSFUL");
  } catch (err) {
    console.error(" Database connection failed on boot:", err.message);
    process.exit(1);
  }
};
