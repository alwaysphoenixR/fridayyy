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
// import { QDRANT_COLLECTION_NAME } from "../config/qdrant.config.js";
import { QDRANT_COLLECTION_NAME } from "../db/qdrant.js";

const MAX_QUERY_LENGTH = 1000;

export const searchBrain = async (req, res) => {
  try {
    // Trim before validation — whitespace-only query wastes 2 LLM API calls
    const query = req.body.query?.trim();

    // req.user._id set by tokenValidate middleware.
    // MUST be .toString() — Qdrant filter does string match against stored string payload.
    // req.userId (original) was undefined — broke the entire privacy filter.
    const userId = req.user._id.toString();

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }
    if (query.length > MAX_QUERY_LENGTH) {
      return res.status(400).json({
        message: `Query cannot exceed ${MAX_QUERY_LENGTH} characters`,
      });
    }

    // Stage 1: Query transformation — must be sequential (HyDE depends on rewrite)
    // { result, usedFallback } — lets us track when LLM degradation occurs
    const { result: rewrittenQuery, usedFallback: rewriteFallback } =
      await rewriteQuery(query);
    const { result: hydeText, usedFallback: hydeFallback } =
      await generateHyDE(rewrittenQuery);

    if (rewriteFallback || hydeFallback) {
      // Track LLM degradation — if this fires often, your Groq quota or key has an issue
      console.warn(
        `[searchBrain] LLM fallback used — rewrite: ${rewriteFallback}, hyde: ${hydeFallback}`,
      );
    }

    // Stage 2: Vectorization — dense and sparse take same input, fully independent
    const [denseVector, sparseVector] = await Promise.all([
      generateDenseVector(hydeText),
      generateSparseVector(hydeText),
    ]);

    // Stage 3: Hybrid search — RRF fuses dense (semantic) + sparse (keyword) rankings
    const searchResults = await qdrantClient.query(QDRANT_COLLECTION_NAME, {
      query: { fusion: "rrf" },
      prefetch: [
        { query: denseVector, using: "dense-text", limit: 10 },
        {
          query: { indices: sparseVector.indices, values: sparseVector.values },
          using: "sparse-text",
          limit: 10,
        },
      ],
      // Privacy gatekeeper — userId MUST match exactly (string vs string)
      // Removing or misconfiguring this filter exposes all users' data
      filter: {
        must: [{ key: "userId", match: { value: userId } }],
      },
      limit: 5,
      with_payload: true,
    });

    // Defensive access — unexpected Qdrant response shape won't crash with ??
    const points = searchResults?.points ?? [];

    if (points.length === 0) {
      return res.status(200).json({
        answer:
          "I couldn't find anything related to that in your Second Brain.",
        sources: [],
      });
    }

    // Stage 4: Answer generation — 70B model reads chunks, produces grounded response
    const finalAnswer = await generateFinalAnswer(query, points);

    return res.status(200).json({
      answer: finalAnswer,
      sources: points.map((p) => ({
        title: p.payload.title,
        text: p.payload.text,
        score: p.score,
      })),
    });
  } catch (error) {
    console.error("[searchBrain] Error:", error);
    return res
      .status(500)
      .json({ message: "Search failed. Please try again." });
  }
};
