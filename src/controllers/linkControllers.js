import { linkModel } from "../db/models/Link.js";
export const createShareableLink = async (req, res) => {
  try {
    const { share } = req.body;
    if (share) {
      // const hash=
      const userId = req.body.userId;
      const newLink = await linkModel.create({
        hash: hash,
        userId: userId,
      });
    } else {
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Server error",
    });
  }
};
