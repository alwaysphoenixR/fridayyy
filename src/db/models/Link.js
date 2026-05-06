import mongoose, { Schema } from "mongoose";

const linkSchema = new Schema(
  {
    hash: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export const LinkModel = mongoose.model("Link", linkSchema);
