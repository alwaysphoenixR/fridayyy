import mongoose, { model } from "mongoose";
import { Schema } from "mongoose";

const linkSchema = new Schema({
  hash: {
    type: String,
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "People",
    required: true,
  },
});

export const linkModel = mongoose.model("Link", linkSchema);
