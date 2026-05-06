// src/controllers/search.controller.js
import qdrantClient from "../db/qdrant.js";
import {
  generateDenseVector,
  generateSparseVector,
} from "../services/vector.service.js";
import {
  rewriteQuery,
  generateHyDE,
  generateFinalAnswer,
} from "../services/llm.service.js";

const COLLECTION_NAME = "second_brain";

export const searchBrain = async (req, res) => {
  try {
    const { query } = req.body;
    const userId = req.userId; // From your auth middleware

    if (!query) {
      return res.status(400).json({ error: "Search query is required." });
    }

    console.log(`🔍 Searching Brain for: "${query}"`);

    // 1. Fast HyDE: Rewrite the question into a fake answer
    const rewritetext = await rewriteQuery(query);
    const hydeText = await generateHyDE(rewritetext);
    console.log(`🧠 HyDE Generated: bridging semantic gap...`);

    // 2. Vectorize the HyDE text
    const denseVector = await generateDenseVector(hydeText);
    const sparseVector = await generateSparseVector(hydeText);

    // 3. Native Hybrid Search using Reciprocal Rank Fusion (RRF)
    // This perfectly merges Keyword matching and Semantic Meaning.
    const searchResults = await qdrantClient.query(COLLECTION_NAME, {
      // The Fusion algorithm to merge both searches
      query: { fusion: "rrf" },

      // The two parallel searches to run
      prefetch: [
        {
          query: denseVector,
          using: "dense-text",
          limit: 10,
        },
        {
          query: { indices: sparseVector.indices, values: sparseVector.values },
          using: "sparse-text",
          limit: 10,
        },
      ],

      // The strict Privacy Gatekeeper
      filter: {
        must: [{ key: "userId", match: { value: userId } }],
      },

      // The final number of merged chunks we want back
      limit: 5,
      with_payload: true,
    });

    console.log(
      `🎯 Found ${searchResults.points.length} highly relevant chunks.`,
    );

    // If the database has absolutely nothing on this topic
    if (searchResults.points.length === 0) {
      return res.status(200).json({
        answer:
          "I couldn't find any notes related to this in your Second Brain.",
        sources: [],
      });
    }

    // 4. Send the perfectly curated chunks to Llama 3 for the final answer
    console.log(`🤖 Sending to Groq Llama 3 (70B)...`);
    const finalAnswer = await generateFinalAnswer(query, searchResults.points);

    // 5. Return the AI answer along with the source chunks to the frontend
    return res.status(200).json({
      answer: finalAnswer,
      sources: searchResults.points.map((p) => ({
        title: p.payload.title,
        text: p.payload.text,
        score: p.score, // Shows how confident the vector DB was
      })),
    });
  } catch (error) {
    console.error("❌ Search Controller Error:", error);
    return res
      .status(500)
      .json({ error: "Failed to search the Second Brain." });
  }
};
