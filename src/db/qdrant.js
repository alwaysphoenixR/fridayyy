// src/db/qdrant.js
import { QdrantClient } from "@qdrant/js-client-rest";

// Connect to the local Docker container
const qdrantClient = new QdrantClient({ host: "localhost", port: 6333 });
const COLLECTION_NAME = "second_brain";

export const initializeQdrant = async () => {
  try {
    const collections = await qdrantClient.getCollections();
    const exists = collections.collections.some(
      (c) => c.name === COLLECTION_NAME,
    );

    if (exists) {
      console.log(`Qdrant Collection '${COLLECTION_NAME}' is ready.`);
      return;
    }

    console.log(` Creating Qdrant Collection: '${COLLECTION_NAME}'...`);

    await qdrantClient.createCollection(COLLECTION_NAME, {
      // 1. Semantic Vectors (Jina-v5 Matryoshka Truncated)
      vectors: {
        "dense-text": {
          size: 256,
          distance: "Cosine",
        },
      },
      // 2. Keyword Vectors (BM25)
      sparse_vectors: {
        "sparse-text": {
          modifier: "idf",
        },
      },
      // 3. RAM Compression (INT8)
      quantization_config: {
        scalar: {
          type: "int8",
          quantile: 0.99,
          always_ram: true,
        },
      },
    });

    // Create a payload index on userId so tenant filtering is lightning fast
    await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
      field_name: "userId",
      field_schema: "keyword",
      wait: true,
    });

    console.log(` Qdrant Collection '${COLLECTION_NAME}' initialized!`);
  } catch (error) {
    console.error(" Qdrant Initialization Error:", error);
  }
};

export default qdrantClient;
