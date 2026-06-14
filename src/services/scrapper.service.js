import axios from "axios";
// vxTwitter — unofficial public API that wraps Twitter/X data.
// No API key required, no SLA, no guaranteed uptime.
// RISK: Twitter/X actively tries to shut down these wrappers.
// If this breaks, tweet-saving breaks entirely. Have a contingency.
const VXTWITTER_BASE = "https://api.vxtwitter.com";
const SCRAPER_TIMEOUT_MS = 8000; // 8 seconds — vxTwitter can be slow

// Validates that a URL is a Twitter/X status URL and extracts the pathname.
// Prevents: non-Twitter URLs, path traversal, SSRF via malformed paths.
// Expected format: /{username}/status/{tweetId}
function extractTwitterPathname(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid URL format");
  }

  // Allowlist Twitter/X domains — reject anything else
  const allowedDomains = ["twitter.com", "x.com", "mobile.twitter.com"];
  if (!allowedDomains.includes(parsed.hostname)) {
    throw new Error(`URL must be a Twitter/X link. Got: ${parsed.hostname}`);
  }

  // Validate pathname matches /user/status/ID format
  // Prevents path traversal: /../../../ or /admin or random paths
  const twitterStatusPattern = /^\/[^/]+\/status\/\d+$/;
  if (!twitterStatusPattern.test(parsed.pathname)) {
    throw new Error(
      `URL does not appear to be a tweet. Path: ${parsed.pathname}`,
    );
  }

  return parsed.pathname;
}

export const scrapeTweet = async (url) => {
  // Validate and extract pathname before constructing the API URL.
  // Throws on invalid input — caller (createContent) handles the error.
  // We throw here instead of returning fallback — fallback would silently
  // save "Failed to fetch tweet" as content and embed it in Qdrant.
  const pathname = extractTwitterPathname(url);
  const apiUrl = `${VXTWITTER_BASE}${pathname}`;

  try {
    const response = await axios.get(apiUrl, {
      timeout: SCRAPER_TIMEOUT_MS, // Never let a hung vxTwitter request stall createContent
      headers: {
        // Some APIs return different data based on Accept header
        Accept: "application/json",
      },
    });

    const data = response.data;

    if (!data?.text) {
      // Tweet exists but has no text — video-only tweet, deleted, or API change
      throw new Error("vxTwitter returned no text content for this tweet");
    }

    // Safely handle missing author fields — vxTwitter schema is not guaranteed stable
    const authorName = data.user_name || "Unknown";
    const authorHandle = data.user_screen_name || "unknown";

    // Format for both MongoDB storage and RAG embedding.
    // Author context improves retrieval — "tweet from @naval about..." is more searchable.
    // WARNING: Changing this format invalidates existing Qdrant embeddings —
    // old tweets won't match new format queries until re-embedded.
    const formattedText = [
      `SOURCE: ${url}`,
      `AUTHOR: ${authorName} (@${authorHandle})`,
      `CONTENT: ${data.text}`,
    ].join("\n");

    return {
      text: formattedText,
      author: authorName,
      source: "vxTwitter",
    };
  } catch (error) {
    // Re-throw — let the controller decide how to handle failure.
    // Do NOT return fallback text here — it gets stored in MongoDB and embedded in Qdrant.
    // "Failed to fetch tweet" as a searchable document is worse than a failed request.
    if (error.code === "ECONNABORTED") {
      throw new Error(`Tweet scraping timed out after ${SCRAPER_TIMEOUT_MS}ms`);
    }
    if (error.response?.status === 404) {
      throw new Error(
        "Tweet not found — it may be deleted or the account may be private",
      );
    }
    // Log the real error server-side, throw a clean message to the controller
    console.error("[scrapeTweet] vxTwitter error:", error.message);
    throw new Error("Failed to fetch tweet content");
  }
};
