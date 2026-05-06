import { LinkModel } from "../db/models/Link.js";
import { userModel } from "../db/models/User.js";
import { ContentModel } from "../db/models/Content.js";
import crypto from "crypto";

export const createShareableLink = async (req, res) => {
  try {
    const { share } = req.body;
    const userId = req.userId;

    // If the user wants to turn ON sharing
    if (share === true || share === "true") {
      const existingLink = await LinkModel.findOne({ userId });

      if (existingLink) {
        // If it exists but was turned off, turn it back on
        existingLink.isActive = true;
        await existingLink.save();

        return res.status(200).json({
          link: existingLink.hash,
          message: "Link reactivated",
        });
      }
      const hash = crypto.randomBytes(6).toString("hex");
      const newLink = await LinkModel.create({
        hash,
        userId,
        isActive: true,
      });

      return res.status(201).json({
        link: hash,
        message: "Shareable link generated",
      });
    }
    if (share === false || share === "false") {
      const existingLink = await LinkModel.findOne({ userId });

      if (!existingLink) {
        return res.status(404).json({ message: "No active link found" });
      }
      // We toggle it off instead of deleting, so the URL remains reserved
      existingLink.isActive = false;
      await existingLink.save();

      return res.status(200).json({
        message: "Link deactivated. Profile is now private.",
      });
    }
  } catch (err) {
    console.error("Link Creation Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getBrainlink = async (req, res) => {
  try {
    const hash = req.params.brainLink;

    // 1. Find the link and ensure it is currently active
    const brain = await LinkModel.findOne({ hash: hash, isActive: true });

    if (!brain) {
      return res.status(404).json({
        message: "Profile not found or is currently private",
      });
    }

    // 2. Get the user's basic info for the profile header
    const user = await userModel.findOne({ _id: brain.userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 3. PRIVACY FIX: Only fetch content explicitly marked as public!
    const publicContent = await ContentModel.find({
      userId: brain.userId,
      isPublic: true,
    })
      .populate("tags", "title") // Populate tags so visitors can filter the public view
      .sort({ createdAt: -1 }); // Show newest public posts first

    return res.status(200).json({
      username: user.username,
      content: publicContent,
    });
  } catch (err) {
    console.error("Fetch Brainlink Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
