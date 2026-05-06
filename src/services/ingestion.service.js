// src/services/ingestion.service.js
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { v4 as uuidv4 } from "uuid";
import qdrantClient from "../db/qdrant.js";

import { generateDenseVector, generateSparseVector } from "./vector.service.js";

const COLLECTION_NAME = "second_brain";

export const processAndEmbedContent = async (contentDoc) => {
  try {
    // 1. Extract the text we want the AI to read
    const textToProcess = contentDoc.textContent || contentDoc.title;
    if (!textToProcess) return;

    // 2. Configure the Chunker
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 100,
    });

    // 3. Slice the text into an array of chunks
    const chunks = await splitter.splitText(textToProcess);
    console.log(`Slicing content into ${chunks.length} chunks...`);

    // 4. Prepare the points for Qdrant
    const points = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];

      // Send the chunk to our local Llama.cpp AI to get the math arrays
      const denseVector = await generateDenseVector(chunkText);
      const sparseVector = await generateSparseVector(chunkText);

      points.push({
        id: uuidv4(), // Qdrant requires a UUID for every point
        vector: {
          "dense-text": denseVector,
          "sparse-text": sparseVector,
        },
        payload: {
          contentId: contentDoc._id.toString(),
          userId: contentDoc.userId.toString(),
          chunkIndex: i, // CRITICAL: Used later for Context Windowing
          text: chunkText,
          title: contentDoc.title,
        },
      });
    }

    // 5. Save all chunks into Qdrant in one massive batch
    await qdrantClient.upsert(COLLECTION_NAME, {
      wait: true,
      points: points,
    });

    console.log(
      ` Successfully embedded and saved ${chunks.length} chunks to Qdrant.`,
    );
  } catch (error) {
    console.error(" Error in processAndEmbedContent:", error);
  }
};
