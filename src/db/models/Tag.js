// import mongoose, { model } from "mongoose";
// import { Schema } from "mongoose";

// const tagSchema = new Schema({
//   title: {
//     type: String,
//     required: true,
//     unique: true,
//   },
// });

// const tagModel = mongoose.model("Tag", tagSchema);
// models/tag.js
import mongoose, { Schema } from "mongoose";

const tagSchema = new Schema({
  title: {
    type: String,
    required: true,
    unique: true,
    lowercase: true, // Automatically converts "React" to "react" before saving
    trim: true, // Removes accidental spaces like " react " -> "react"
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User", // Ensures your tags belong only to your brain!
    required: true,
  },
});

export const TagModel = mongoose.model("Tag", tagSchema);
