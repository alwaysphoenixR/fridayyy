import { ContentModel } from "../db/models/Content.js";

export const createContent = async (req, res) => {
  try {
    // console.log("entry");

    const { link, type, title } = req.body || {};

    if (!link || !type || !title) {
      return res.status(400).json({
        message: "please enter all the fields",
      });
    }

    const newContent = await ContentModel.create({
      link,
      type,
      title,
      tags: [],
      userId: req.userId, // match your auth middleware
    });

    return res.status(201).json({
      message: "SUCCESSFULLY CREATED",
      content: newContent,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const getContent = async (req, res) => {
  try {
    // console.log("entry");

    // const { link, type, title } = req.body || {};

    // if (!link || !type || !title) {
    //   return res.status(400).json({
    //     message: "please enter all the fields",
    //   });
    // }
    const userId = req.userId;
    console.log(typeof userId);
    const allContent = await ContentModel.find({
      userId: userId,
    }).populate("userId", "username");
    return res.status(201).json({
      message: "SUCCESSFULLY fetched",
      content: allContent,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Server error",
    });
  }
};
export const deleteContent = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({
        message: "please enter the title for the content to be deleted",
      });
    }
    const delcontent = await ContentModel.deleteMany({
      title: title,
      userId: req.userId,
    });
    return res.status(200).json({
      message: "SUCCESSFULLY DELETED",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "INTERNAL SERVER ERROR",
    });
  }
};
