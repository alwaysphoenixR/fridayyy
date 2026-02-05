import mongoose, { model } from "mongoose";
import { Schema } from "mongoose";

const tagSchema = new Schema({
  title: {
    type: String,
    required: true,
    unique: true,
  },
});

const tagModel = mongoose.model("Tag", tagSchema);
