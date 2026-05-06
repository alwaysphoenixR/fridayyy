const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Query Rewriting
 * Converts vague user questions into retrieval-optimized technical search queries.
 */
export const rewriteQuery = async (userQuery) => {
  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `
You are an expert search query optimizer for a software engineering knowledge base.

Rewrite the user's query into a dense, keyword-rich technical search query.

Rules:
1. Preserve the original intent.
2. Expand vague terms into technical terminology.
3. Remove filler words.
4. Output ONLY the rewritten query.
5. Do not answer the question.
            `,
          },
          {
            role: "user",
            content: userQuery,
          },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      throw new Error("Query rewrite failed");
    }

    const data = await response.json();

    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Rewrite failed:", error);

    // Fallback
    return userQuery;
  }
};

/**
 * 1. Fast HyDE (Hypothetical Document Embeddings)
 * We ask Llama 3 to write a fake code snippet that answers the user's question.
 */
export const generateHyDE = async (userQuery) => {
  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", // Using the smaller 8B model because it's blindingly fast
        messages: [
          {
            role: "system",
            content:
              "You are a technical writer. The user will ask a programming question. Write a very brief, hypothetical code snippet and explanation that perfectly answers it. Do not use conversational filler. Just write the technical answer.",
          },
          { role: "user", content: userQuery },
        ],
        temperature: 0.3, // Low temperature for factual consistency
      }),
    });

    if (!response.ok) throw new Error("Groq HyDE API failed");
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error(" HyDE generation failed:", error);
    return userQuery; // Fallback: If HyDE fails, just use the original question
  }
};

/**
 * 2. The Final Answer (Senior Staff Engineer Persona)
 */
export const generateFinalAnswer = async (userQuery, contextChunks) => {
  try {
    // Stitch the retrieved chunks into one big string
    const assembledContext = contextChunks
      .map(
        (chunk, index) => `\n--- Chunk ${index + 1} ---\n${chunk.payload.text}`,
      )
      .join("\n");
    const systemPrompt = `
You are the user's "Second Brain" retrieval assistant.

Your job is to retrieve, synthesize, and explain information ONLY from the provided context.

========================
CORE DIRECTIVE
========================
You MUST answer ONLY using the provided context chunks.

Do NOT use prior knowledge.
Do NOT assume.
Do NOT hallucinate.
Do NOT fill gaps with general knowledge.

If the answer cannot be found in the provided context, respond EXACTLY:

"I do not have notes on this in your Second Brain."

========================
REASONING RULES
========================

1. GROUNDING
Every factual statement must be traceable to one or more context chunks.

2. SYNTHESIS
If the answer requires combining multiple chunks:
- Connect them logically.
- Preserve original meaning.
- Never invent missing links.

3. CONFLICT RESOLUTION
If chunks contain conflicting information:
- Explicitly mention the conflict.
- Show both versions.
- Cite both sources.

Example:
"Chunk 2 states X, while Chunk 5 states Y."

4. UNCERTAINTY
If context is incomplete, ambiguous, or partial:
- Clearly say the notes are incomplete.
- Only state what is supported.

5. DOMAIN AGNOSTIC
The notes may include:
- Programming
- Machine Learning
- Research Papers
- Mathematics
- System Design
- Personal Notes
- Documentation
- Product Ideas
- Books
- Career Notes

Adapt your explanation style to the domain.

========================
OUTPUT FORMAT
========================

Always structure responses like this:

## Answer
[Direct answer]

## Supporting Notes
[List the evidence used]

## Sources
[Chunk citations with metadata]

Example:

## Answer
Redis uses in-memory storage for low-latency caching.

## Supporting Notes
- Stores key-value pairs in RAM.
- Supports persistence mechanisms.

## Sources
- Chunk 1 (Title: Redis Notes, Type: Documentation)
- Chunk 4 (Title: System Design Interview Notes)

========================
CITATION RULES
========================

Every important claim MUST cite its source.

Use this format:

[Chunk X | title="<title>" | source="<source>" | type="<type>"]

If metadata is missing, use:

[Chunk X]

Never cite chunks you did not use.

========================
FORMATTING RULES
========================

- Use Markdown.
- Use bullet points when helpful.
- Use code blocks for code.
- Use equations for math if relevant.
- Keep answers dense and useful.
- No filler.
- No phrases like:
  "Based on the context..."
  "According to the provided information..."
  "From the retrieved chunks..."

Just answer directly.

<context>
${assembledContext}
</context>
`;

    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Using the massive 70B model for deep reasoning
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userQuery },
        ],
        temperature: 0.1, // Strict grounding
      }),
    });

    if (!response.ok) throw new Error("Groq Final Answer API failed");
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error(" Final Answer generation failed:", error);
    throw error;
  }
};
