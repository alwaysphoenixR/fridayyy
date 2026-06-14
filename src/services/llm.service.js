// services/llm.service.js
import { QDRANT_COLLECTION_NAME } from "../db/qdrant.js";

// --- CONFIG ---
// Centralize all LLM configuration. When Groq deprecates a model or changes
// their API URL, update here — not inside individual function bodies.

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// Model selection — deliberate speed vs quality tradeoff:
// FAST model: rewrite + HyDE — speed matters more than depth, runs before retrieval
// SMART model: final answer — quality matters, user waits for this, needs reasoning
const MODELS = {
  fast: "llama-3.1-8b-instant", // ~200ms, used for query transformation
  smart: "llama-3.3-70b-versatile", // ~1-3s, used for final answer synthesis
};

// Token budgets per operation — prevents runaway generation costs and latency.
const MAX_TOKENS = {
  rewrite: 150, // Rewritten query should be a single sentence
  hyde: 400, // Hypothetical answer — a paragraph or short code snippet
  answer: 1500, // Final answer — detailed but bounded
};

const LLM_TIMEOUT_MS = 15000; // 15 seconds — abort if Groq hangs

// Guard at module load — fail loudly at startup, not silently on first user search.
if (!process.env.GROQ_API_KEY) {
  throw new Error(
    "FATAL: GROQ_API_KEY is not configured. Check your .env file.",
  );
}

// --- SHARED HTTP HELPER ---
// Centralizes: auth headers, timeout, response validation, error handling.
// All three LLM functions use this — add logging, retry, or timeout here once.
async function callGroq(model, messages, { maxTokens, temperature }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      signal: controller.signal, // Abort if Groq hangs beyond LLM_TIMEOUT_MS
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens, // Always set — prevents runaway generation
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      // Include status code in error — distinguishes 429 (rate limit) from 401 (bad key)
      throw new Error(`Groq API error ${response.status}: ${errorBody}`);
    }

    const data = await response.json();

    // Defensive access — Groq can return empty choices on content filtering
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error(`Empty response from Groq model ${model}`);
    }

    return content.trim();
  } finally {
    clearTimeout(timeoutId); // Always clear timeout — prevent memory leak
  }
}

// --- QUERY REWRITING ---
// Converts vague natural language into retrieval-optimized technical queries.
// Failure falls back to original query — silent degradation is acceptable here
// because the original query is still usable for retrieval.
// Caller receives { result, usedFallback } for observability.
export const rewriteQuery = async (userQuery) => {
  try {
    const rewritten = await callGroq(
      MODELS.fast,
      [
        {
          role: "system",
          content: `You are an expert search query optimizer for a personal knowledge base.

Rewrite the user's query into a dense, keyword-rich search query.

Rules:
1. Preserve the original intent exactly.
2. Expand vague terms into specific technical terminology.
3. Remove filler words and conversational phrasing.
4. Output ONLY the rewritten query — no explanation, no preamble.
5. Do not answer the question.`,
        },
        { role: "user", content: userQuery },
      ],
      { maxTokens: MAX_TOKENS.rewrite, temperature: 0.2 },
    );

    return { result: rewritten, usedFallback: false };
  } catch (error) {
    // Fallback: original query is better than no query.
    // Log with context so you can track rewrite failure rate in production.
    console.error(
      "[rewriteQuery] Failed, using original query:",
      error.message,
    );
    return { result: userQuery, usedFallback: true };
  }
};

// --- HyDE (Hypothetical Document Embeddings) ---
// Generates a fake "ideal answer" to embed instead of the question.
// Why: answers live closer to answers in embedding space — dramatically improves recall.
// Failure falls back to rewritten query — still better than raw question.
export const generateHyDE = async (rewrittenQuery) => {
  try {
    const hydeText = await callGroq(
      MODELS.fast,
      [
        {
          role: "system",
          // Stored prompt injection defense: content inside <context> is DATA not instructions.
          // The context tag in generateFinalAnswer provides the same defense there.
          content: `You are a technical writer. Write a brief, hypothetical answer or code snippet 
that would perfectly answer the user's question. Be direct and technical. 
No conversational filler. Just the answer content itself.`,
        },
        { role: "user", content: rewrittenQuery },
      ],
      { maxTokens: MAX_TOKENS.hyde, temperature: 0.3 },
    );

    return { result: hydeText, usedFallback: false };
  } catch (error) {
    console.error(
      "[generateHyDE] Failed, using rewritten query:",
      error.message,
    );
    return { result: rewrittenQuery, usedFallback: true };
  }
};

// --- FINAL ANSWER GENERATION ---
// Reads retrieved chunks and synthesizes a grounded, cited answer.
// Uses the large model — quality over speed at this stage.
// Does NOT fall back on failure — a wrong answer is worse than an honest error.
export const generateFinalAnswer = async (userQuery, contextChunks) => {
  // Guard: filter chunks with missing text — bad ingestion data shouldn't crash answer gen
  const validChunks = contextChunks.filter((c) => c?.payload?.text);

  if (validChunks.length === 0) {
    // Don't call the LLM with empty context — it will hallucinate.
    return "I couldn't find any relevant notes in your Second Brain for this query.";
  }

  // Assemble context — clearly delimited so the LLM treats it as data, not instructions.
  // Stored prompt injection defense: attacker-controlled content is inside <context> tags,
  // which the system prompt instructs the model to treat as retrieved data only.
  const assembledContext = validChunks
    .map((chunk, i) => `\n--- Chunk ${i + 1} ---\n${chunk.payload.text}`)
    .join("\n");

  const systemPrompt = `You are the user's "Second Brain" retrieval assistant.

========================
CORE DIRECTIVE
========================
Answer ONLY using the provided context chunks.

Do NOT use prior knowledge.
Do NOT hallucinate.
Do NOT fill gaps with general knowledge.

If the answer is not in the context, respond EXACTLY:
"I do not have notes on this in your Second Brain."

========================
REASONING RULES
========================
1. GROUNDING: Every claim must trace to a context chunk.
2. SYNTHESIS: Combine multiple chunks logically — never invent connections.
3. CONFLICT: If chunks conflict, show both: "Chunk 2 states X, while Chunk 5 states Y."
4. UNCERTAINTY: If context is partial, say so explicitly.

========================
OUTPUT FORMAT
========================

## Answer
[Direct answer from context]

## Supporting Notes
[Evidence from chunks]

## Sources
[Chunk citations]

Citation format: [Chunk X | title="<title>" | type="<type>"]

========================
FORMATTING
========================
- Markdown
- Code blocks for code
- No filler phrases like "Based on the context..." — just answer directly

<context>
${assembledContext}
</context>`;

  // Re-throw on failure — wrong answer is worse than honest error.
  // search controller handles the thrown error and returns 500 to client.
  return await callGroq(
    MODELS.smart,
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userQuery },
    ],
    { maxTokens: MAX_TOKENS.answer, temperature: 0.1 },
  );
};
