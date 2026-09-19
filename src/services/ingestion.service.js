import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { v4 as uuidv4 } from "uuid";
import qdrantClient from "../db/qdrant.js";
import { generateDenseVector, generateSparseVector } from "./vector.service.js";
import { QDRANT_COLLECTION_NAME } from "../db/qdrant.js";

// Chunking strategy by content type.
// These values directly impact retrieval quality — change carefully.
// chunkSize: larger = more context per chunk, fewer chunks, faster ingestion, worse precision
// chunkOverlap: ensures sentences split across chunk boundaries are still retrievable
const CHUNK_CONFIG = {
  tweet: { chunkSize: 9999, chunkOverlap: 0 }, // Tweets are ≤280 chars — never split
  note: { chunkSize: 300, chunkOverlap: 50 }, // Notes are short — small chunks for precision
  article: { chunkSize: 500, chunkOverlap: 100 }, // Articles — balanced chunks
  document: { chunkSize: 800, chunkOverlap: 150 }, // PDFs need larger chunks to preserve context
  default: { chunkSize: 500, chunkOverlap: 100 },
};

// Max concurrent embedding API calls per ingestion job.
// Too high: hits rate limits. Too low: slow for large documents.
// Tune based on your embedding provider's rate limit tier.
const EMBEDDING_CONCURRENCY = 2;

// Process chunks in batches of N with controlled concurrency.
// Prevents hammering the embedding API with 100 simultaneous requests.
async function processInBatches(items, batchSize, processFn) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processFn));
    results.push(...batchResults);
  }
  return results;
}

export const processAndEmbedContent = async (contentDoc) => {
  // console.log("I AM HERE ");
  // Use textContent if available (scraped/extracted text).
  // Fall back to title only for short content types like images/audio.
  const textToProcess = contentDoc.textContent || contentDoc.title;

  if (!textToProcess?.trim()) {
    // Re-throw so the caller's .catch() is notified — don't swallow this silently.
    // A content item with no embeddable text will never be searchable.
    throw new Error(
      `[ingestion] No embeddable text for content ${contentDoc._id}. Skipping.`,
    );
  }

  // Select chunking strategy based on content type.
  // Wrong chunk size = poor retrieval quality — this decision matters.
  const config = CHUNK_CONFIG[contentDoc.type] || CHUNK_CONFIG.default;

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: config.chunkSize,
    chunkOverlap: config.chunkOverlap,
  });

  const chunks = await splitter.splitText(textToProcess);

  // Guard against empty split results — can happen with whitespace-only text
  if (chunks.length === 0) {
    throw new Error(
      `[ingestion] Text splitting produced 0 chunks for content ${contentDoc._id}.`,
    );
  }

  const totalChunks = chunks.length;

  // Generate vectors for all chunks with controlled concurrency.
  // Each chunk gets dense (semantic) + sparse (keyword) vectors in parallel.
  // CONCURRENCY_LIMIT=5 means 5 chunks processed simultaneously — 10 API calls at once.
  // Adjust based on your embedding provider's rate limits.
  const indexedChunks = chunks.map((text, i) => ({ text, i }));
  const points = await processInBatches(
    indexedChunks,
    EMBEDDING_CONCURRENCY,
    async ({ text, i }) => {
      const [denseVector, sparseVector] = await Promise.all([
        generateDenseVector(text, "document"),
        generateSparseVector(text),
      ]);
      return {
        id: uuidv4(),
        vector: { "dense-text": denseVector, "sparse-text": sparseVector },
        payload: {
          contentId: contentDoc._id.toString(),
          userId: contentDoc.userId.toString(),
          chunkIndex: i,
          totalChunks,
          text,
          title: contentDoc.title,
          type: contentDoc.type,
        },
      };
    },
  );

  // Upsert all points in one batch.
  // wait: true = Qdrant confirms indexing complete before resolving.
  // Slightly slower than wait: false, but search finds content immediately after ingestion.
  // For very large batches (500+ points), split into sub-batches to avoid timeout.
  await qdrantClient.upsert(QDRANT_COLLECTION_NAME, {
    wait: true,
    points,
  });

  // Return metadata for the caller to log or use — don't log inside the service.
  return { contentId: contentDoc._id.toString(), chunksEmbedded: totalChunks };
};
