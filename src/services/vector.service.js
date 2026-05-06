const OLLAMA_URL = "http://localhost:11434/api/embeddings";
const EMBEDDING_MODEL = "nomic-embed-text";

const globalVocabulary = new Map();
let nextTokenId = 1;

// Zero-dependency Stop Word list (The most common useless words in English)
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

/**
 * 1. Generate Dense Vectors (Semantic Meaning via Ollama)
 */
export const generateDenseVector = async (text) => {
  try {
    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: EMBEDDING_MODEL, prompt: text }),
    });

    if (!response.ok) throw new Error("Ollama API failed");
    const data = await response.json();
    return data.embedding.slice(0, 256); // Matryoshka Truncation
  } catch (error) {
    console.error("❌ Dense vector generation failed:", error);
    throw error;
  }
};

/**
 * 2. Generate Sparse Vectors (Zero-Dependency Keyword Matches)
 */
export const generateSparseVector = async (text) => {
  try {
    // 1. Clean & Tokenize: Lowercase, keep only alphanumeric and underscores, split by spaces
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, " ")
      .split(/\s+/);

    const frequencyMap = {};

    // 2. Filter out stop words and empty strings
    words.forEach((word) => {
      // Skip empty strings, single letters, or stop words
      if (!word || word.length < 2 || STOP_WORDS.has(word)) return;

      // 3. Reliable Vocabulary Mapping (Assign unique integer ID to each word)
      if (!globalVocabulary.has(word)) {
        globalVocabulary.set(word, nextTokenId++);
      }

      const tokenId = globalVocabulary.get(word);
      frequencyMap[tokenId] = (frequencyMap[tokenId] || 0) + 1;
    });

    return {
      indices: Object.keys(frequencyMap).map(Number),
      values: Object.values(frequencyMap),
    };
  } catch (error) {
    console.error("❌ Native Sparse vector generation failed:", error);
    throw error;
  }
};
