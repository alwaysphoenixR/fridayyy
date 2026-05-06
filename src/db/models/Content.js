// import mongoose, { model } from "mongoose";
// import { Schema } from "mongoose";
// const contentTypes = ["image", "video", "article", "audio", "tweet"];
// const contentSchema = new Schema({
//   link: {
//     type: String,
//     required: true,
//   },
//   type: {
//     type: String,
//     enum: contentTypes,
//     required: true,
//   },
//   title: {
//     type: String,
//     required: true,
//   },
//   tags: [
//     {
//       type: Schema.Types.ObjectId,
//       ref: "Tag",
//       required: true,
//     },
//   ],
//   userId: {
//     type: Schema.Types.ObjectId,
//     ref: "People",
//     required: true,
//   },
// });

// export const ContentModel = mongoose.model("Content", contentSchema);
// models/content.js
import mongoose, { Schema } from "mongoose";

// Added "note" to handle text-only thoughts without links
const contentTypes = ["image", "video", "article", "audio", "note", "tweet"];

const contentSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: contentTypes,
      required: true,
    },
    link: {
      type: String,
      required: false, // Made optional so you can just save text notes!
    },
    textContent: {
      type: String,
      required: false, // Stores your raw thoughts OR the scraped text from a link for AI
    },
    isPublic: {
      type: Boolean,
      default: false, // By default, keep your brain private
    },
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: "Tag",
        required: false, // Changed to false so you can save quickly without forcing a tag
      },
    ],
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User", // Note: Change to "People" if you didn't update the User model name!
      required: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  },
);

export const ContentModel = mongoose.model("Content", contentSchema);
