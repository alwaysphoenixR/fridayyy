import mongoose, { Schema } from "mongoose";
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
      required: false,
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
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  },
);

export const ContentModel = mongoose.model("Content", contentSchema);
