import mongoose, { Schema } from "mongoose";

const tagSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Tag title is required"],
      trim: true,
      lowercase: true, // Normalize tags: "React" and "react" are the same tag.
      // Always lowercase query input before searching by title.
      maxlength: [50, "Tag title cannot exceed 50 characters"],

      // DO NOT put unique: true here — that creates a global unique constraint.
      // Two different users must be able to create a tag called "productivity".
      // Uniqueness is enforced at the (userId, title) level via compound index below.
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Soft delete support.
    // Hard-deleting a tag orphans ObjectId references in all Content documents.
    // With soft delete, you can warn the user or clean up gracefully.
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Consistent with Content and Link models.
    // Useful for "recently created tags" features and debugging.
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// --- INDEXES ---

// The real uniqueness constraint: same user cannot have two tags with the same title.
// Different users CAN share tag names — this is the correct behavior.
tagSchema.index({ userId: 1, title: 1 }, { unique: true });

// Standalone userId index for "fetch all tags for this user" queries.
// The compound index above also satisfies this — Mongo can use its left prefix.
// No need to add a separate { userId: 1 } index; the compound index covers it.

export const TagModel = mongoose.model("Tag", tagSchema);
