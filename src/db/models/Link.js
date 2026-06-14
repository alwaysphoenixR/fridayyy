import mongoose, { Schema } from "mongoose";

const linkSchema = new Schema(
  {
    hash: {
      type: String,
      required: true,
      unique: true, // Primary lookup key — must be fast and unique
      trim: true,

      // Enforce minimum entropy at schema level.
      // A short hash is brute-forceable. 32+ chars = 128 bits of entropy minimum.
      minlength: [32, "Hash must be at least 32 characters"],
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One active share identity per user.
      // IMPORTANT: service layer must use findOneAndUpdate,
      // never create a new doc on re-enable — will throw duplicate key error.
    },

    isActive: {
      type: Boolean,
      default: true, // Link is live immediately on creation.
      // If you want explicit activation, change default to false.
    },

    // Optional: add expiry support for time-limited sharing in future.
    // Leaving this as a comment so the schema is extensible without migration pain.
    // expiresAt: { type: Date, default: null },
  },
  {
    timestamps: true, // createdAt tells you when sharing was first enabled

    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Compound index for the most critical query:
// "Does this hash exist AND is it active?"
// Avoids fetching the document and checking isActive in app memory.
linkSchema.index({ hash: 1, isActive: 1 });

export const LinkModel = mongoose.model("Link", linkSchema);
