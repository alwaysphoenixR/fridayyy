import { processAndEmbedContent } from "../services/ingestion.service.js";
import { ContentModel } from "../db/models/Content.js";
import { scrapeTweet } from "../services/scrapper.service.js";
import { deleteVectorsByContentId } from "../services/deletion.service.js";
import {
  uploadPdfToCloudinary,
  extractPdfText,
  deleteFromCloudinary,
  extractCloudinaryPublicId,
} from "../services/file.service.js";
import { TagModel } from "../db/models/Tag.js";
import mongoose from "mongoose";

// Types that get sent to the RAG/vector pipeline after creation.
// Images, audio, video have no text to embed — excluded by design.
const RAG_ELIGIBLE_TYPES = ["article", "tweet", "document"];

// Notes under this length aren't worth embedding — too little signal for retrieval.
const MIN_RAG_TEXT_LENGTH = 150;

// Determines if a content item should be vectorized and stored in Qdrant.
// Extracted from the controller — pure logic, easy to unit test.
function isRAGEligible(content) {
  if (RAG_ELIGIBLE_TYPES.includes(content.type)) return true;
  if (
    content.type === "note" &&
    content.textContent?.length > MIN_RAG_TEXT_LENGTH
  )
    return true;
  return false;
}

export const createContent = async (req, res) => {
  try {
    // req.body is already validated by validate(CreateContentSchema) middleware.
    // All fields are trimmed, typed, and conform to the schema at this point.
    let { title, type, link, textContent, isPublic, tags } = req.body;

    // --- TYPE-SPECIFIC ENRICHMENT ---
    // Each content type may need additional processing before storage.
    // Document and tweet types auto-populate fields from their source.

    if (type === "document") {
      // conditionalUpload middleware guarantees req.file exists for document type
      // and has already passed magic byte validation. This check is a safety net.
      if (!req.file) {
        return res
          .status(400)
          .json({ message: "PDF file is required for document type" });
      }

      // Upload to Cloudinary and store both the URL and public ID.
      // public ID is needed for deletion — without it, Cloudinary files are never cleaned up.
      // In createContent controller — pass userId for per-user folder scoping
      const uploadedFile = await uploadPdfToCloudinary(
        req.file.buffer,
        req.user._id.toString(),
      );
      // const uploadedFile = await uploadPdfToCloudinary(req.file.buffer);
      link = uploadedFile.secure_url;

      // Extract text for RAG pipeline — stored in textContent for embedding.
      textContent = await extractPdfText(req.file.buffer);

      // Use filename as title fallback — better UX than forcing title on upload.
      if (!title) title = req.file.originalname.replace(".pdf", "");
    }

    // if (type === "tweet") {
    //   if (!link) {
    //     return res
    //       .status(400)
    //       .json({ message: "Link is required for tweet type" });
    //   }

    //   // Scrape tweet text for storage and RAG embedding.
    //   // If scraping fails entirely, scrapeTweet throws — caught by outer catch.
    //   const tweetData = await scrapeTweet(link);
    //   if (!tweetData?.text) {
    //     return res.status(422).json({
    //       message: "Could not extract tweet content from provided link",
    //     });
    //   }

    //   textContent = tweetData.text;
    //   if (!title) {
    //     title = tweetData.author ? `Tweet by @${tweetData.author}` : "Tweet";
    //   }
    // }

    if (type === "tweet") {
      if (!link) {
        return res
          .status(400)
          .json({ message: "Link is required for tweet type" });
      }
      try {
        const tweetData = await scrapeTweet(link);
        textContent = tweetData.text;
        if (!title) title = `Tweet by @${tweetData.author}`;
      } catch (err) {
        // scrapeTweet threw — URL was invalid, tweet was deleted, or API is down
        // Return 422 Unprocessable Entity — request was valid but content couldn't be fetched
        return res.status(422).json({ message: err.message });
      }
    }

    // --- TAG OWNERSHIP VALIDATION ---
    // Verify every tag ID belongs to this user before attaching.
    // Without this, User A can attach User B's tags to their content — BOLA.
    if (tags && tags.length > 0) {
      const validTags = await TagModel.find({
        _id: { $in: tags },
        userId: req.user._id,
      }).select("_id");

      // Reject if any submitted tag doesn't belong to this user
      if (validTags.length !== tags.length) {
        return res
          .status(403)
          .json({ message: "One or more tags are invalid or unauthorized" });
      }
    }

    const payload = {
      title,
      type,
      link,
      textContent,
      isPublic: isPublic ?? false,
      tags,
      userId: req.user._id,
    };

    // console.log("PAYLOAD:");
    // console.log(payload);

    // const testDoc = new ContentModel(payload);

    // console.log("MONGOOSE DOC:");
    // console.log(testDoc.toObject());

    // const newContent = await ContentModel.create(payload);
    // console.log(link);
    //     const payload = {
    //   title,
    //   type,
    //   link,
    //   textContent,
    //   isPublic: isPublic ?? false,
    //   tags,
    //   userId: req.user._id,
    // };
    // console.log("PAYLOAD:", payload);
    // const newContent = await ContentModel.create(payload);
    // --- PERSIST TO MONGODB ---
    const newContent = await ContentModel.create({
      title,
      type,
      link,
      textContent,
      isPublic: isPublic ?? false,
      tags,
      userId: req.user._id,
    });

    // --- RAG PIPELINE ---
    // Fire and forget — respond to user immediately, embed in background.
    // KNOWN LIMITATION: If embedding fails, content exists in MongoDB but not in Qdrant.
    // Search will silently miss this content until re-embedded.
    // Production fix: use a job queue (BullMQ) with retry logic instead.
    // if (isRAGEligible(newContent)) {
    //   processAndEmbedContent(newContent).catch((err) => {
    //     // Log with content ID so you can identify and re-process failed embeddings.
    //     console.error(
    //       `[RAG] Embedding failed for content ${newContent._id}:`,
    //       err,
    //     );
    //   });
    // }
    if (isRAGEligible(newContent)) {
      processAndEmbedContent(newContent)
        .then(({ chunksEmbedded }) => {
          // Structured log — content ID + chunk count for debugging missing search results
          console.info(
            `[RAG] Embedded content ${newContent._id}: ${chunksEmbedded} chunks`,
          );
        })
        .catch((err) => {
          // Now actually fires — processAndEmbedContent re-throws on failure
          console.error(
            `[RAG] Embedding failed for content ${newContent._id}:`,
            err,
          );
          // Production: enqueue for retry via BullMQ instead of just logging
        });
    }
    // Return content without textContent — can be large (full PDF text).
    // Client can fetch full content via GET /content/:id if needed.
    const { textContent: _, ...contentResponse } = newContent.toObject();

    return res.status(201).json({
      message: "Content created successfully",
      content: contentResponse,
    });
  } catch (error) {
    console.error("[createContent] Error:", error);

    // Mongoose validation error — schema-level rejection
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Server error creating content" });
  }
};

export const getContent = async (req, res) => {
  try {
    const userId = req.user._id;

    // --- PAGINATION ---
    // Never return all content without a limit — users can have thousands of items.
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20); // Cap at 50
    const skip = (page - 1) * limit;

    // Run count and fetch in parallel — single round trip cost instead of two sequential.
    const [totalCount, content] = await Promise.all([
      ContentModel.countDocuments({ userId, isDeleted: false }),
      ContentModel.find({ userId, isDeleted: false })
        .select("-textContent") // Exclude heavy field — use GET /content/:id for full doc
        .populate("tags", "title") // Fixed: was "userId" — frontend needs tag title
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({
      message: "Content fetched successfully",
      pagination: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount,
      },
      content,
    });
  } catch (err) {
    console.error("[getContent] Error:", err);
    return res.status(500).json({ message: "Server error fetching content" });
  }
};

export const getContentById = async (req, res) => {
  try {
    const userId = req.user._id;
    // validateObjectId middleware guarantees req.params.id is a valid ObjectId.
    const { id } = req.params;

    // Ownership enforced in the query — findOne with both _id and userId.
    // If content belongs to another user, this returns null → 404.
    // Never return 403 here — don't reveal that the content exists at all.
    const content = await ContentModel.findOne({
      _id: id,
      userId,
      isDeleted: false,
    })
      .populate("tags", "title") // Fixed: was "userId"
      .lean();

    if (!content) {
      return res.status(404).json({ message: "Content not found" });
    }

    return res.status(200).json({
      message: "Content fetched successfully",
      content,
    });
  } catch (err) {
    console.error("[getContentById] Error:", err);
    return res.status(500).json({ message: "Server error fetching content" });
  }
};

export const deleteContent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Ownership check — findOne with userId scope.
    // Returns null if content doesn't exist OR belongs to another user.
    // Both cases return 404 — don't reveal existence of content to unauthorized users.
    const content = await ContentModel.findOne({ _id: id, userId });

    if (!content) {
      return res.status(404).json({ message: "Content not found" });
    }

    // --- MULTI-SYSTEM CLEANUP ---
    // Order: clean external systems first, delete MongoDB last.
    // If MongoDB delete fails after external cleanup, content is gone from search
    // but still visible in UI — recoverable state. Reverse order is worse.
    //
    // KNOWN LIMITATION: No transaction across systems.
    // If Cloudinary deletion fails, vectors are still deleted but file remains.
    // Production fix: use a cleanup job queue with retry logic.

    // 1. Remove from Qdrant vector store — only for embedded types
    const embeddableTypes = ["note", "tweet", "article", "document"];
    if (embeddableTypes.includes(content.type)) {
      // Pass userId for defense-in-depth ownership scoping in Qdrant
      await deleteVectorsByContentId(id.toString(), userId.toString());
      // await deleteVectorsByContentId(id.toString());
    }

    // 2. Remove from Cloudinary — only for documents
    // Requires cloudinaryPublicId stored on the content document.
    // TODO: Add cloudinaryPublicId field to ContentModel — currently always undefined.
    // Derive from link URL as temporary fix: link.split("/").pop().split(".")[0]
    // if (content.type === "document" && content.cloudinaryPublicId) {
    //   await deleteFromCloudinary(content.cloudinaryPublicId);
    // }

    // if (content.type === "document" && content.link) {
    //   const publicId = extractCloudinaryPublicId(content.link);
    //   if (publicId) {
    //     await deleteFromCloudinary(publicId);
    //   } else {
    //     console.warn(
    //       `[deleteContent] Could not extract public ID from link: ${content.link}`,
    //     );
    //   }
    // }
    if (content.type === "document" && content.link) {
      const publicId = extractCloudinaryPublicId(content.link);
      try {
        await deleteFromCloudinary(publicId);
      } catch (cloudinaryErr) {
        // Log the orphaned file for manual cleanup — don't block MongoDB deletion
        // The content is gone from the user's perspective; the storage cost is manageable
        console.error(
          `[deleteContent] Cloudinary cleanup failed for content ${id}. ` +
            `Public ID: ${publicId}. Manual cleanup required.`,
          cloudinaryErr.message,
        );
      }
    }

    // 3. Delete from MongoDB — scope to userId for safety even though we verified above.
    // Belt-and-suspenders: prevents deleting wrong document in any race condition.
    await ContentModel.deleteOne({ _id: id, userId });

    return res.status(200).json({ message: "Content deleted successfully" });
  } catch (err) {
    console.error("[deleteContent] Error:", err);
    return res.status(500).json({ message: "Server error deleting content" });
  }
};
export const updateContent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // req.body already validated by validate(UpdateContentSchema) middleware.
    // Only allowed fields present, at least one field guaranteed.
    const updates = req.body;

    // --- OWNERSHIP CHECK ---
    // findOne with userId scope — returns null if content doesn't exist
    // OR belongs to another user. Both return 404.
    // Never 403 — don't reveal that the content exists to unauthorized users.
    const content = await ContentModel.findOne({ _id: id, userId });

    if (!content) {
      return res.status(404).json({ message: "Content not found" });
    }

    // --- TAG OWNERSHIP VALIDATION ---
    // Same check as createContent — every tag must belong to this user.
    // Without this, User A can attach User B's private tags. BOLA.
    if (updates.tags && updates.tags.length > 0) {
      const validTags = await TagModel.find({
        _id: { $in: updates.tags },
        userId,
      }).select("_id");

      if (validTags.length !== updates.tags.length) {
        return res.status(403).json({
          message: "One or more tags are invalid or unauthorized",
        });
      }
    }

    // --- APPLY UPDATE ---
    const updatedContent = await ContentModel.findByIdAndUpdate(
      id,
      { $set: updates },
      {
        new: true, // Return updated document, not original
        runValidators: true, // Run schema validators on updated fields
      },
    )
      .select("-textContent") // Don't return heavy field — same as list view
      .populate("tags", "title")
      .lean();

    // --- RE-EMBED IF TEXT CHANGED ---
    // If textContent was updated, the existing Qdrant vectors are now stale.
    // Delete old vectors and re-embed with the new text.
    // Fire and forget — same tradeoff as createContent.
    // Production fix: enqueue a re-embedding job via BullMQ.
    if (updates.textContent) {
      deleteVectorsByContentId(id.toString())
        .then(() =>
          processAndEmbedContent({
            ...content.toObject(),
            textContent: updates.textContent,
          }),
        )
        .catch((err) => {
          // Stale vectors remain in Qdrant — search returns outdated content.
          // Log with ID so you can manually re-process if needed.
          console.error(`[RAG] Re-embedding failed for content ${id}:`, err);
        });
    }

    return res.status(200).json({
      message: "Content updated successfully",
      content: updatedContent,
    });
  } catch (err) {
    console.error("[updateContent] Error:", err);

    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }

    return res.status(500).json({ message: "Server error updating content" });
  }
};
