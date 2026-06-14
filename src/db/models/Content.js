import mongoose, { Schema } from "mongoose";

// Single source of truth for content types.
// Export this so controllers, validators, and tests all use the same list.
// Adding a new type here automatically updates enum validation.
export const CONTENT_TYPES = [
  "image",
  "video",
  "article",
  "audio",
  "note",
  "tweet",
  "document",
];

const contentSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [500, "Title cannot exceed 500 characters"], // Prevent abuse & UI overflow
    },

    type: {
      type: String,
      enum: CONTENT_TYPES,
      required: [true, "Content type is required"],
    },

    link: {
      type: String,
      trim: true,
      // Validate URL format if provided.
      // 'note' type won't have a link; article/tweet/video typically will.
      validate: {
        validator: function (v) {
          if (!v) return true; // Optional field — skip if empty
          try {
            new URL(v);
            return true;
          } catch {
            return false;
          }
        },
        message: "Link must be a valid URL",
      },
    },

    textContent: {
      type: String,
      trim: true,
      maxlength: [50000, "Text content cannot exceed 50,000 characters"], // Guard against massive payloads hitting your RAG pipeline
    },

    isPublic: {
      type: Boolean,
      default: false, // Privacy by default — never accidentally expose content
    },

    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Soft delete — never hard-delete user data in production.
    // Enables trash/restore, audit logs, and safer data recovery.
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,

    // Strip __v from all API responses.
    // Clients don't need Mongoose's internal version key.
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);
contentSchema.pre("validate", function (next) {
  if (!this.link && !this.textContent) {
    this.invalidate(
      "content",
      "A document must have either a link to scrape or direct text content.",
    );
  }
  next();
});

// --- INDEXES ---
// Critical for query performance. Without these, every query is a full collection scan.

// Most common query: "fetch all content for this user"
contentSchema.index({ userId: 1 });

// Public brain feature: "fetch all public content"
contentSchema.index({ isPublic: 1 });

// Filter by type within a user's content
contentSchema.index({ userId: 1, type: 1 });

// Prevent duplicate URLs per user.
// sparse: true allows multiple documents with no link (notes, etc.)
contentSchema.index(
  { userId: 1, link: 1 },
  {
    unique: true,
    partialFilterExpression: {
      link: { $exists: true },
    },
  },
);
// contentSchema.index({ userId: 1, link: 1 }, { unique: true, sparse: true });

// Soft delete — always exclude deleted content in queries
contentSchema.index({ isDeleted: 1 });

export const ContentModel = mongoose.model("Content", contentSchema);
