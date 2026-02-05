import mongoose, { model } from "mongoose";
import { Schema } from "mongoose";
const contentTypes = ["image", "video", "article", "audio"];
const contentSchema = new Schema({
  link: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: contentTypes,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  tags: [
    {
      type: Schema.Types.ObjectId,
      ref: "Tag",
      required: true,
    },
  ],
  userId: {
    type: Schema.Types.ObjectId,
    ref: "People",
    required: true,
  },
});

export const ContentModel = mongoose.model("Content", contentSchema);
