import express from "express";
import upload, {
  isPDF,
  conditionalUpload,
} from "../middlewares/multer.middleware.js";
import {
  createContent,
  deleteContent,
  getContent,
  getContentById,
  updateContent,
} from "../controllers/contentControllers.js";
import { tokenValidate } from "../middlewares/authmiddlewares.js";
import { validate, validateObjectId } from "../middlewares/validate.js";
import { CreateContentSchema, UpdateContentSchema } from "../utils/types.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

// --- RATE LIMITERS ---
// Content creation feeds the RAG pipeline — each item triggers embedding and vector storage.
// Uncapped creation = DB abuse, vector DB quota exhaustion, and storage costs.
const contentCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 content items per hour per IP — generous for real use
  message: { message: "Too many content creation requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- MIDDLEWARE ORDER RULE ---
// ALWAYS: tokenValidate → domain middleware (upload, validate) → controller
// tokenValidate MUST come first — unauthenticated users must never reach multer
// (file upload consumes RAM) or controllers (DB operations).
// Changing this order is a security vulnerability — do not reorder.

// --- ROUTES ---

// GET /content — List all content for the authenticated user.
// REQUIRED: Pagination via ?page and ?limit query params.
// Without pagination, a user with 10,000 items gets everything in one response.
// Returns summary fields only — full textContent is not returned in list view.
// Use GET /content/:id for full document including textContent.
router.get("/content", tokenValidate, getContent);

// GET /content/:id — Fetch a single content item by ID.
// validateObjectId checks that :id is a valid MongoDB ObjectId before hitting the DB.
// Without this, Mongoose throws a CastError on invalid IDs → unhandled 500.
// CRITICAL: Controller must verify content.userId === req.user._id (BOLA prevention).
router.get(
  "/content/:id",
  tokenValidate,
  validateObjectId("id"),
  getContentById,
);

// POST /content — Create a new content item.
// Middleware chain (ORDER MATTERS):
// 1. tokenValidate   — verify identity first, before any resource consumption
// 2. contentCreateLimiter — rate limit authenticated users (prevent pipeline abuse)
// 3. conditionalUpload — only parse multipart/form-data if type === "document"
// 4. validate        — validate body shape and required fields
// 5. createContent   — controller handles business logic
router.post(
  "/content",
  tokenValidate,
  contentCreateLimiter,
  conditionalUpload, // Defined below — only runs multer for document type
  validate(CreateContentSchema),
  createContent,
);

// PATCH /content/:id — Partial update of a content item.
// PATCH (not PUT) — you're updating specific fields, not replacing the whole document.
// CRITICAL: Controller must verify content.userId === req.user._id (BOLA prevention).
router.patch(
  "/content/:id",
  tokenValidate,
  validateObjectId("id"),
  validate(UpdateContentSchema),
  updateContent,
);

// DELETE /content/:id — Soft delete a content item.
// validateObjectId prevents CastError from malformed IDs.
// CRITICAL: Controller must verify content.userId === req.user._id (BOLA prevention).
// Should be a soft delete (isDeleted: true) — hard delete loses RAG embeddings
// and makes recovery impossible. See ContentModel for isDeleted field.
router.delete(
  "/content/:id",
  tokenValidate,
  validateObjectId("id"),
  deleteContent,
);

export default router;
