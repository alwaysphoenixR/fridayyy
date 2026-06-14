// src/db/qdrant.js
import { QdrantClient } from "@qdrant/js-client-rest";

// --- COLLECTION CONFIG ---
// Single source of truth for the collection name.
// Export this — ingestion, search, and deletion all import from here.
// Never hardcode "second_brain" anywhere else in the codebase.
export const QDRANT_COLLECTION_NAME = "second_brain";

// Dense vector dimensions — must match .slice(0, N) in vector.service.js.
// nomic-embed-text produces 768 dims. We use 256 via Matryoshka truncation.
// Matryoshka models preserve ~95% retrieval quality at 1/3 the dimensions.
// CHANGING THIS REQUIRES: dropping and recreating the collection + re-embedding all content.
export const DENSE_VECTOR_DIMENSIONS = 256;

// --- CLIENT INITIALIZATION ---
// Host/port must be env vars — "localhost" breaks in Docker Compose, Kubernetes, cloud.
// In Docker Compose, use the Qdrant service name: QDRANT_HOST=qdrant
// For Qdrant Cloud: use the cluster URL and set QDRANT_API_KEY.
if (!process.env.QDRANT_HOST) {
  console.warn(
    "[qdrant] QDRANT_HOST not set — using localhost. Set this env var for any non-local deployment.",
  );
}

const qdrantClient = new QdrantClient({
  host: process.env.QDRANT_HOST || "localhost",
  port: parseInt(process.env.QDRANT_PORT) || 6333,
  // API key required for Qdrant Cloud and any remotely hosted instance.
  // Leave undefined for local Docker (no auth by default).
  ...(process.env.QDRANT_API_KEY && { apiKey: process.env.QDRANT_API_KEY }),
});

// --- COLLECTION INITIALIZATION ---
// Called once at server startup (in app.js / index.js).
// Idempotent: safe to call on every restart — checks existence before creating.
// FAILURE BEHAVIOR: throws on failure — app cannot function without Qdrant.
// Caller (app.js) should catch and exit the process.
export const initializeQdrant = async () => {
  // Step 1: Verify Qdrant is reachable and check collection existence.
  // If this throws, Qdrant is unreachable — don't swallow, let the process crash.
  const collections = await qdrantClient.getCollections();
  const exists = collections.collections.some(
    (c) => c.name === QDRANT_COLLECTION_NAME,
  );

  if (exists) {
    console.info(`[Qdrant] Collection '${QDRANT_COLLECTION_NAME}' ready.`);
    return;
  }

  console.info(`[Qdrant] Creating collection '${QDRANT_COLLECTION_NAME}'...`);

  // Step 2: Create collection with hybrid vector config.
  // Requires Qdrant >= 1.7.0 for sparse_vectors + modifier: "idf".
  await qdrantClient.createCollection(QDRANT_COLLECTION_NAME, {
    vectors: {
      // Dense vectors: semantic meaning via nomic-embed-text (Ollama).
      // size: 256 = Matryoshka truncation from 768 dims. See DENSE_VECTOR_DIMENSIONS.
      // distance: Cosine = standard for normalized text embeddings.
      // Cosine measures angle between vectors — correct for semantic similarity.
      // Use Dot for unnormalized vectors, Euclidean for geometric distance.
      "dense-text": {
        size: DENSE_VECTOR_DIMENSIONS,
        distance: "Cosine",
      },
    },

    sparse_vectors: {
      // Sparse vectors: keyword/BM25-style matching via custom tokenizer.
      // modifier: "idf" applies Inverse Document Frequency weighting server-side.
      // IDF downweights common terms across documents — improves precision over raw TF.
      "sparse-text": {
        modifier: "idf",
      },
    },

    quantization_config: {
      scalar: {
        // INT8 quantization: reduces vector storage from 4 bytes/dim to 1 byte/dim.
        // 4x storage reduction with ~1-2% retrieval quality loss — favorable tradeoff.
        type: "int8",

        // quantile: 0.99 — clips the top 1% of outlier values before quantizing.
        // Prevents outliers from skewing the quantization range and degrading quality.
        quantile: 0.99,

        // always_ram: true — keeps quantized vectors in RAM for fast access.
        // TRADEOFF: RAM scales with collection size. At 1M vectors × 256 dims = ~256MB.
        // Set to false if RAM is constrained — vectors load from disk on demand.
        always_ram: true,
      },
    },
  });

  // Step 3: Create payload indexes for fast filtering.
  // Without these indexes, every filter is a full collection scan.

  // userId index — required for multi-tenant search privacy filter.
  // Every search query filters by userId — this index is non-negotiable.
  // "keyword" schema = exact string match (correct for IDs).
  await qdrantClient.createPayloadIndex(QDRANT_COLLECTION_NAME, {
    field_name: "userId",
    field_schema: "keyword",
    wait: true, // Block until index is built — don't return before it's usable
  });

  // contentId index — required for fast vector deletion on content delete.
  // deleteVectorsByContentId filters by contentId on every deletion.
  // Without this index, each deletion scans the entire collection.
  await qdrantClient.createPayloadIndex(QDRANT_COLLECTION_NAME, {
    field_name: "contentId",
    field_schema: "keyword",
    wait: true,
  });

  console.info(
    `[Qdrant] Collection '${QDRANT_COLLECTION_NAME}' initialized successfully.`,
  );
  // Note: no try-catch — errors propagate to caller (app.js) which should exit the process.
};

export default qdrantClient;
