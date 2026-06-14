import multer from "multer";

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

// Every valid PDF starts with "%PDF-" (hex: 25 50 44 46 2D).
// Checking actual file signature prevents MIME spoofing —
// a client can label any file as application/pdf. Magic bytes cannot be faked.
const PDF_MAGIC_BYTES = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]);

export function isPDF(buffer) {
  if (!buffer || buffer.length < PDF_MAGIC_BYTES.length) return false;
  return buffer.slice(0, PDF_MAGIC_BYTES.length).equals(PDF_MAGIC_BYTES);
}

// memoryStorage: file lives in RAM as req.file.buffer until processing completes.
// TRADEOFF: Fast (no disk I/O), but RAM scales with concurrent uploads.
// At production scale, stream directly to S3/GCS and process asynchronously.
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1, // Reject multi-file requests
  },
  fileFilter: (req, file, cb) => {
    // Gate 1 (weak): MIME type check — filters accidental wrong uploads.
    // Cannot be relied on for security — clients control this header.
    if (file.mimetype !== "application/pdf") {
      const error = new Error("Only PDF files are allowed");
      error.status = 415;
      return cb(error, false);
    }
    cb(null, true);
  },
});

// Gate 2 (strong): Only invokes Multer when content type is "document".
// All other types (note, tweet, article) skip file processing entirely —
// no RAM allocation, no MIME check, no pipeline overhead.
// Magic byte validation runs here after buffer is available.
// export function conditionalUpload(req, res, next) {
//   const contentType = req.body?.type || req.query?.type;

//   if (contentType === "document") {
//     return upload.single("file")(req, res, (err) => {
//       if (err) {
//         return res.status(err.status || 400).json({
//           message: err.message || "File upload failed",
//         });
//       }

//       // Gate 2: magic byte check — buffer is available here.
//       // Rejects files that declare application/pdf but aren't actually PDFs.
//       if (req.file && !isPDF(req.file.buffer)) {
//         return res.status(415).json({
//           message: "File content is not a valid PDF",
//         });
//       }

//       next();
//     });
//   }

//   next();
// }

export function conditionalUpload(req, res, next) {
  return upload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(err.status || 400).json({
        message: err.message || "File upload failed",
      });
    }

    if (req.file && !isPDF(req.file.buffer)) {
      return res.status(415).json({
        message: "File content is not a valid PDF",
      });
    }

    next();
  });
}

export default upload; // Keep only if a route needs raw Multer access directly
