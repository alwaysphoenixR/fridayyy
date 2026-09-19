// const OLLAMA_URL =
// process.env.OLLAMA_URL || "http://localhost:11434/api/embeddings";
// const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "nomic-embed-text";

const JINA_URL = process.env.JINA_URL;
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL;
const JINA_API_KEY = process.env.JINA_API_KEY;
console.log(JINA_API_KEY);

// Dimensions to use from the full embedding vector.
// nomic-embed-text produces 768 dims. We truncate to 256 using Matryoshka principle.
// CRITICAL: This MUST match the vector dimension your Qdrant collection was created with.
// If Qdrant collection has dim=768 and you send 256, Qdrant rejects the vector.
const DENSE_VECTOR_DIMENSIONS = 256;

const OLLAMA_TIMEOUT_MS = 120000; // Embedding can be slow for long text — 30s is generous
const JINA_TIMEOUT_MS = 120000;
// if (!process.env.OLLAMA_URL) {
//   console.warn(
//     "[vector.service] OLLAMA_URL not set — using localhost. Set this env var for deployment.",
//   );
// }
if (!JINA_API_KEY) {
  console.warn("[vector.service] JINA_API_KEY is not set.");
}
// --- STOP WORDS ---
// Common English words with no semantic value for keyword retrieval.
// These inflate sparse vectors with noise and reduce precision.
const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "for",
  "if",
  "in",
  "into",
  "is",
  "it",
  "no",
  "not",
  "of",
  "on",
  "or",
  "such",
  "that",
  "the",
  "their",
  "then",
  "there",
  "these",
  "they",
  "this",
  "to",
  "was",
  "will",
  "with",
  "i",
  "you",
  "he",
  "she",
  "we",
  "my",
  "your",
  "his",
  "her",
  "our",
  "do",
  "does",
  "did",
  "can",
  "could",
  "would",
  "should",
  "what",
  "where",
  "when",
  "why",
  "how",
  "from",
  "about",
]);

// --- HASH FUNCTION ---
// Converts a word to a stable integer index using djb2 hash algorithm.
//
// WHY HASHING INSTEAD OF A VOCABULARY MAP:
// The original globalVocabulary Map had two critical bugs:
// 1. RESTART BUG: Map resets on server restart. "javascript" → tokenId 547 before restart,
//    → tokenId 12 after restart. Old Qdrant vectors now point to wrong words forever.
// 2. RACE CONDITION: Concurrent ingestion jobs share mutable nextTokenId counter.
//    Two words can get the same ID simultaneously.
//
// Hash-based approach: deterministic, stateless, restart-safe.
// "javascript" always hashes to the same integer on any server at any time.
// No stored state. No race conditions. No memory growth.
//
// Tradeoff: ~0.001% hash collision probability (two different words → same index).
// At your scale this is acceptable. Production systems (SPLADE, BM25) use this approach.
function hashWord(word) {
  let hash = 5381;
  for (let i = 0; i < word.length; i++) {
    // djb2: hash * 33 + charCode — fast, low collision rate for text tokens
    hash = (hash << 5) + hash + word.charCodeAt(i);
    hash = hash & 0x7fffffff; // Keep positive 31-bit integer (Qdrant index requirement)
  }
  // Limit to a 100,000-index space — larger space = sparser vectors, better precision
  // Must match the sparse vector index size your Qdrant collection supports
  return (hash % 100000) + 1; // +1 ensures no zero index
}

// --- DENSE VECTOR GENERATION ---
// Calls local Ollama to generate semantic embeddings via nomic-embed-text.
// Dense vectors capture MEANING — "car" and "automobile" are close in dense space.
// Used for semantic similarity search in hybrid RRF fusion.
// export const generateDenseVector = async (text) => {
//   const controller = new AbortController();
//   const timeoutId = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

//   try {
//     const response = await fetch(OLLAMA_URL, {
//       method: "POST",
//       signal: controller.signal,
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ model: EMBEDDING_MODEL, prompt: text }),
//     });

//     if (!response.ok) {
//       const body = await response.text();
//       throw new Error(`Ollama API error ${response.status}: ${body}`);
//     }

//     const data = await response.json();

//     // Defensive access — Ollama can return 200 with error body on model load issues
//     if (!Array.isArray(data?.embedding)) {
//       throw new Error(
//         `Ollama returned invalid embedding shape for model ${EMBEDDING_MODEL}`,
//       );
//     }

//     // Matryoshka truncation: nomic-embed-text supports dimension reduction.
//     // Truncating to 256 from 768 preserves ~95% of retrieval quality at 1/3 the storage.
//     // REQUIREMENT: Qdrant collection must be configured with vectors.dense-text.size = 256
//     return data.embedding.slice(0, DENSE_VECTOR_DIMENSIONS);
//   } catch (error) {
//     if (error.name === "AbortError") {
//       throw new Error(
//         `Ollama embedding timed out after ${OLLAMA_TIMEOUT_MS}ms`,
//       );
//     }
//     console.error("[generateDenseVector] Failed:", error.message);
//     throw error; // Re-throw — ingestion and search both need to know embedding failed
//   } finally {
//     clearTimeout(timeoutId);
//   }
// };
export const generateDenseVector = async (text, type) => {
  const task = type === "query" ? "retrieval.query" : "retrieval.passage";

  const controller = new AbortController();

  const timeoutId = setTimeout(() => controller.abort(), JINA_TIMEOUT_MS);

  try {
    const response = await fetch(JINA_URL, {
      method: "POST",
      signal: controller.signal,

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${JINA_API_KEY}`,
      },

      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        task,
        dimensions: DENSE_VECTOR_DIMENSIONS,
        input: [text],
      }),
    });

    if (!response.ok) {
      const body = await response.text();

      throw new Error(`Jina API error ${response.status}: ${body}`);
    }

    const data = await response.json();

    if (!Array.isArray(data?.data?.[0]?.embedding)) {
      throw new Error(
        `Jina returned invalid embedding shape for model ${EMBEDDING_MODEL}`,
      );
    }

    const embedding = data.data[0].embedding;

    if (embedding.length !== DENSE_VECTOR_DIMENSIONS) {
      throw new Error(
        `Expected ${DENSE_VECTOR_DIMENSIONS} dimensions, got ${embedding.length}`,
      );
    }

    return embedding;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`Jina embedding timed out after ${JINA_TIMEOUT_MS}ms`);
    }

    console.error("[generateDenseVector] Failed:", error.message);

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};
// --- SPARSE VECTOR GENERATION ---
// Produces keyword-frequency vectors for BM25-style exact term matching.
// Sparse vectors capture KEYWORDS — "React hooks" matches "hooks" exactly.
// Complements dense search: dense finds semantically similar content,
// sparse finds exact technical terms that might be semantically distant.
//
// Implementation: term frequency with hash-based indexing.
// No external dependencies, no stored vocabulary, restart-safe.
export const generateSparseVector = (text) => {
  // Note: This function is synchronous — no I/O, pure CPU work.
  // Kept as a named export (not async) — callers use Promise.all anyway.

  const frequencyMap = new Map();

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ") // Normalize: remove punctuation including underscores
    .split(/\s+/)
    .filter((word) => word.length >= 2 && !STOP_WORDS.has(word));

  for (const word of words) {
    const tokenId = hashWord(word);
    frequencyMap.set(tokenId, (frequencyMap.get(tokenId) || 0) + 1);
  }

  // Qdrant sparse vector format requires parallel arrays of indices and values
  return {
    indices: Array.from(frequencyMap.keys()),
    values: Array.from(frequencyMap.values()),
  };
};
