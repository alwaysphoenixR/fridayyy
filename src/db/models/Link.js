// import mongoose, { model } from "mongoose";
// import { Schema } from "mongoose";

// const linkSchema = new Schema({
//   hash: {
//     type: String,
//     required: true,
//   },
//   userId: {
//     type: Schema.Types.ObjectId,
//     ref: "People",
//     required: true,
//     unique: true,
//   },
// });

// export const linkModel = mongoose.model("Link", linkSchema);
// models/link.js
import mongoose, { Schema } from "mongoose";

const linkSchema = new Schema(
  {
    hash: {
      type: String,
      required: true,
      unique: true, // Ensures no two users accidentally get the same share link
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User", // Note: Ensure this matches exactly what you named your User model!
      required: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true, // Allows you to temporarily disable your public profile
    },
  },
  {
    timestamps: true,
  },
);

export const LinkModel = mongoose.model("Link", linkSchema);
