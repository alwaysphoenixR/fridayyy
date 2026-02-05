import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.resolve("C:/Users/rajve/OneDrive/Desktop/friday/.env"),
});
const DB_URL = process.env.DB_URL;
console.log(DB_URL);
export const dbConnect = async () => {
  try {
    await mongoose.connect(DB_URL);
    console.log("DB CONNECTION IS SUCCESSFUL");
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};
