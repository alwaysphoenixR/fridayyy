import mongoose, { Schema } from "mongoose";

const tagSchema = new Schema({
  title: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

export const TagModel = mongoose.model("Tag", tagSchema);
