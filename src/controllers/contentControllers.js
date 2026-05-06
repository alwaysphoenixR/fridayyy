// import { ContentModel } from "../db/models/Content.js";

// export const createContent = async (req, res) => {
//   try {
//     // console.log("entry");

//     const { link, type, title } = req.body || {};

//     if (!link || !type || !title) {
//       return res.status(400).json({
//         message: "please enter all the fields",
//       });
//     }

//     const newContent = await ContentModel.create({
//       link,
//       type,
//       title,
//       tags: [],
//       userId: req.userId, // match your auth middleware
//     });

//     return res.status(201).json({
//       message: "SUCCESSFULLY CREATED",
//       content: newContent,
//     });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({
//       message: "Server error",
//     });
//   }
// };

import { processAndEmbedContent } from "../services/ingestion.service.js";
import { ContentModel } from "../db/models/Content.js";

export const createContent = async (req, res) => {
  try {
    const { title, type, link, textContent, isPublic, tags } = req.body;

    const newContent = await ContentModel.create({
      title,
      type,
      link,
      textContent,
      isPublic,
      tags,
      userId: req.userId,
    });

    // --- THE RAG GATEKEEPER ---

    // 1. Define what types of content automatically qualify for RAG
    const ragEligibleTypes = ["article", "tweet"];

    // 2. Define a minimum character count for raw notes to be worth embedding
    const MIN_RAG_LENGTH = 150; // Roughly 2-3 sentences

    // 3. The Logic:
    // Is it an article? OR (Is it a note AND is it long enough?)
    const isEligibleType = ragEligibleTypes.includes(newContent.type);
    const isLongEnoughNote =
      newContent.type === "note" &&
      newContent.textContent &&
      newContent.textContent.length > MIN_RAG_LENGTH;

    if (isEligibleType || isLongEnoughNote) {
      console.log(
        ` Content approved for RAG Pipeline. Sending to ingestion...`,
      );
      // Fire and forget
      processAndEmbedContent(newContent);
    } else {
      console.log(
        ` Content too short or wrong type for RAG. Skipping vectorization.`,
      );
    }

    return res
      .status(201)
      .json({ message: "Content created", content: newContent });
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
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
