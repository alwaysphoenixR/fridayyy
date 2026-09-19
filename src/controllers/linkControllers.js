import { LinkModel } from "../db/models/Link.js";
import { UserModel } from "../db/models/User.js"; 
import { ContentModel } from "../db/models/Content.js";
import crypto from "crypto";

// 32 bytes = 64 hex characters = 256 bits of entropy.
// Cryptographic standard for unguessable tokens.
// Your current randomBytes(6) = 48 bits — upgrade immediately.
const HASH_BYTES = 32;

export const createShareableLink = async (req, res) => {
  try {
    const userId = req.user._id;

    // validate(ShareLinkSchema) middleware should guarantee share is boolean.
    // Explicit check here as a safety net.
    const { share } = req.body;

    if (typeof share !== "boolean") {
      return res.status(400).json({ message: "'share' must be a boolean" });
    }

    if (share === true) {
      // Use findOneAndUpdate with upsert instead of findOne + conditional create.
      // Handles both "reactivate existing" and "create new" in a single atomic operation.
      // Prevents race condition where two simultaneous enable requests create two documents
      // (second would hit the unique index on userId and throw E11000).
      const existingLink = await LinkModel.findOne({ userId });

      if (existingLink) {
        // Reactivate — use findByIdAndUpdate, not .save(), to avoid triggering hooks.
        await LinkModel.findByIdAndUpdate(existingLink._id, { isActive: true });

        return res.status(200).json({
          link: existingLink.hash,
          message: "Sharing enabled",
        });
      }

      // Generate new hash — 256 bits, cryptographically secure.
      // If collision occurs (astronomically unlikely), the unique index throws E11000.
      // Caught below and returned as 500 — acceptable given collision probability.
      const hash = crypto.randomBytes(HASH_BYTES).toString("hex");

      const newLink = await LinkModel.create({ hash, userId, isActive: true });

      return res.status(201).json({
        link: newLink.hash,
        message: "Shareable link created",
      });
    }

    if (share === false) {
      // findOneAndUpdate — single round trip, no need to fetch then save.
      const deactivated = await LinkModel.findOneAndUpdate(
        { userId },
        { isActive: false },
        { new: true },
      );

      if (!deactivated) {
        return res.status(404).json({ message: "No shareable link found" });
      }

      return res.status(200).json({
        message: "Sharing disabled. Your brain is now private.",
      });
    }

    // Should never reach here if validate middleware is applied.
    // Belt-and-suspenders against middleware being accidentally removed.
    return res.status(400).json({ message: "'share' must be true or false" });
  } catch (err) {
    // Handle hash collision — astronomically unlikely but handle cleanly.
    if (err.code === 11000) {
      return res
        .status(500)
        .json({ message: "Hash collision — please try again" });
    }
    console.error("[createShareableLink] Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getBrainLink = async (req, res) => {
  try {
    const { brainLink: hash } = req.params;

    // 1. Verify the hash exists and sharing is active.
    const brain = await LinkModel.findOne({ hash, isActive: true });

    if (!brain) {
      // Same message for "not found" and "deactivated" —
      // don't reveal whether a hash exists but is private. Prevents enumeration.
      return res.status(404).json({
        message: "Brain not found or is currently private",
      });
    }

    // 2. Fetch user info and public content in PARALLEL — not sequential.
    // Queries are independent after brain lookup — no reason to wait on each other.
    // Parallel cuts response time roughly in half.
    const [user, publicContent] = await Promise.all([
      UserModel.findById(brain.userId)
        .select("username") // Only fetch what we return — never pull full user doc for one field
        .lean(),

      ContentModel.find({ userId: brain.userId, isPublic: true })
        .select("-textContent") // Exclude heavy field — visitors see metadata, not full scraped text
        .populate("tags", "title")
        .sort({ createdAt: -1 })
        .limit(20) // Pagination gate — never return unbounded results on a public endpoint
        .lean(),
    ]);

    // Orphaned link — user was deleted but link document remains.
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      username: user.username,
      content: publicContent,
      // Let the client know if there's more content to paginate
      hasMore: publicContent.length === 20,
    });
  } catch (err) {
    console.error("[getBrainLink] Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
