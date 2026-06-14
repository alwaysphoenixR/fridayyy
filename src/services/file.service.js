import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import { extractText } from "unpdf";
import { v4 as uuidv4 } from "uuid"; // Already a dependency from ingestion service

// Cloudinary folder for all PDF uploads.
// Scoped per-user in the upload call for better organization and access isolation.
const CLOUDINARY_PDF_FOLDER = "second-brain-pdfs";

// Cloudinary upload timeout — prevents hung uploads from holding server connections open.
const UPLOAD_TIMEOUT_MS = 60000; // 60 seconds — generous for large PDFs on slow connections

// --- PDF TEXT EXTRACTION ---

// Extracts raw text from a PDF buffer using unpdf (pdf.js under the hood).
// CPU-intensive — blocks the event loop for large PDFs.
// At scale: offload to a worker thread or BullMQ job queue.
//
// Returns: joined text string ready for MongoDB storage and RAG chunking.
// Throws: on extraction failure — caller (createContent) handles the error.
export const extractPdfText = async (buffer) => {
  try {
    // unpdf requires Uint8Array — convert from Node Buffer
    const uint8Array = new Uint8Array(buffer);
    const result = await extractText(uint8Array);

    // result.text is string[] — one string per page.
    // Defensive check: corrupted PDF, encrypted PDF, or API change can cause undefined.
    if (!Array.isArray(result?.text)) {
      throw new Error(
        "unpdf returned unexpected shape — PDF may be corrupted or encrypted",
      );
    }

    const extractedText = result.text
      .join("\n") // Join pages with newline separator
      .trim(); // Remove leading/trailing whitespace

    // Scanned PDFs (image-only) return empty strings per page.
    // Catch this explicitly so the user gets a meaningful error, not silent empty content.
    if (!extractedText) {
      throw new Error(
        "No text could be extracted. The PDF may be a scanned image or password-protected.",
      );
    }

    return extractedText;
  } catch (error) {
    console.error("[extractPdfText] Failed:", error.message);
    // Re-throw the original error — preserve the meaningful message for the controller
    throw error;
  }
};

// --- CLOUDINARY UPLOAD ---

// Uploads a PDF buffer to Cloudinary and returns the upload result.
// result.secure_url → stored as content.link in MongoDB
// result.public_id  → used for deletion (extractCloudinaryPublicId derives it from URL)
//
// Uses stream upload — Cloudinary's recommended approach for server-side uploads.
export const uploadPdfToCloudinary = (buffer, userId) => {
  return new Promise((resolve, reject) => {
    // Timeout: if Cloudinary doesn't respond within UPLOAD_TIMEOUT_MS, reject.
    // Without this, a hung upload holds the createContent request open indefinitely.
    const timeoutId = setTimeout(() => {
      reject(
        new Error(`Cloudinary upload timed out after ${UPLOAD_TIMEOUT_MS}ms`),
      );
    }, UPLOAD_TIMEOUT_MS);

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw", // PDFs must be "raw" — not "image" or "auto"
        // Mismatched resource_type on delete silently fails deletion

        // Scope by userId for per-user organization and access isolation.
        // Without userId scoping, all users' PDFs are in one flat folder.
        folder: userId
          ? `${CLOUDINARY_PDF_FOLDER}/${userId}`
          : CLOUDINARY_PDF_FOLDER,

        // UUID public_id — prevents collision on concurrent uploads.
        // Date.now() collides if two uploads happen in the same millisecond.
        public_id: `pdf-${uuidv4()}`,
      },
      (error, result) => {
        clearTimeout(timeoutId); // Always clear — prevents memory leak
        if (error) {
          console.error("[uploadPdfToCloudinary] Cloudinary error:", error);
          reject(error);
        } else {
          resolve(result);
        }
      },
    );

    // Handle stream-level errors — separate from the Cloudinary callback error.
    // If streamifier throws before piping completes, the Promise would otherwise hang.
    stream.on("error", (err) => {
      clearTimeout(timeoutId);
      reject(err);
    });

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// --- CLOUDINARY DELETION ---

// Deletes a PDF from Cloudinary by its public ID.
// Called during content deletion to prevent orphaned files accumulating storage costs.
//
// publicId is derived from content.link via extractCloudinaryPublicId —
// not stored separately on the Content model.
export const deleteFromCloudinary = async (publicId) => {
  // Guard: extractCloudinaryPublicId returns null for non-Cloudinary URLs.
  // Calling destroy(null) either throws cryptically or silently no-ops.
  if (!publicId) {
    console.warn(
      "[deleteFromCloudinary] Called with null/undefined publicId — skipping",
    );
    return null;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "raw", // Must match the resource_type used during upload
    });

    // Cloudinary returns { result: "ok" } on success, { result: "not found" } on missing file.
    // "not found" is not an error — file may have been manually deleted or already cleaned up.
    if (result.result !== "ok" && result.result !== "not found") {
      console.warn(
        `[deleteFromCloudinary] Unexpected result for ${publicId}:`,
        result,
      );
    }

    return result;
  } catch (error) {
    // Re-throw — let the caller (deleteContent controller) decide whether to:
    // (a) abort the entire delete operation, or
    // (b) continue with MongoDB deletion and log the Cloudinary orphan for manual cleanup.
    // Swallowing this error means you pay for storage you think you deleted.
    console.error(
      `[deleteFromCloudinary] Failed for publicId "${publicId}":`,
      error.message,
    );
    throw error;
  }
};

// --- CLOUDINARY URL UTILITIES ---

// Derives the Cloudinary public_id from a stored URL.
// Avoids storing public_id as a redundant field on the Content model —
// the URL is the single source of truth.
//
// Cloudinary URL format:
// https://res.cloudinary.com/<cloud>/raw/upload/v<version>/<public_id>.<ext>
//
// Returns null if URL is not a valid Cloudinary upload URL.
export function extractCloudinaryPublicId(url) {
  if (!url || typeof url !== "string") return null;

  const uploadMarker = "/upload/";
  const uploadIndex = url.indexOf(uploadMarker);
  if (uploadIndex === -1) return null;

  const afterUpload = url.slice(uploadIndex + uploadMarker.length);

  // Strip version prefix (v1234567890/)
  const withoutVersion = afterUpload.replace(/^v\d+\//, "");

  // Strip file extension — Cloudinary public IDs don't include the extension
  const publicId = withoutVersion.replace(/\.[^/.]+$/, "");

  return publicId || null; // Return null rather than empty string on edge cases
}
