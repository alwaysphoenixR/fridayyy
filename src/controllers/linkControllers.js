import { linkModel } from "../db/models/Link.js";
import crypto from "crypto";
import { userModel } from "../db/models/User.js";
import { ContentModel } from "../db/models/Content.js";

export const createShareableLink = async (req, res) => {
  try {
    const { share, userId } = req.body;

    if (share) {
      const existingLink = await linkModel.findOne({ userId });
      if (existingLink) {
        return res.status(200).json({
          // link: existingLink.hash,
          message: "Link already exists",
        });
      }

      const hash = crypto.randomBytes(6).toString("hex");

      const newLink = await linkModel.create({
        hash,
        userId,
      });

      return res.status(200).json({
        // link: `${process.env.BASE_URL}/share/${hash}`,
        message: "Success",
      });
    } else {
      const deleted = await linkModel.deleteOne({ userId });

      if (deleted.deletedCount === 0) {
        return res.status(404).json({
          message: "No active link found",
        });
      }

      return res.status(200).json({
        message: "Link deactivated",
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Server error",
    });
  }
};
export const getBrainlink = async (req, res) => {
  const hash = req.params.brainlink;
  const brain = await linkModel.findOne({ hash: hash });
  if (!brain) {
    return res.status(400).json({
      message: "please check the link once",
    });
  }
  const user = await userModel.findOne({ _id: brain.userId });
  const content = await ContentModel.find({ userId: brain.userId });
  return res.status(200).json({
    username: user.username,
    content: content,
  });
};
