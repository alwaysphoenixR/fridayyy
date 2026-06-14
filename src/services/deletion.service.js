import qdrantClient from "../db/qdrant.js";
// import { QDRANT_COLLECTION_NAME } from "../config/qdrant.config.js";
import { QDRANT_COLLECTION_NAME } from "../db/qdrant.js";

// Deletes ALL vector chunks associated with a content item from Qdrant.
// A single content item produces multiple chunks during ingestion —
// this filter delete removes all of them in one operation.
//
// Called during content deletion BEFORE MongoDB document removal.
// If this fails, throw to the controller — don't delete MongoDB record
// while vectors remain (content would be deleted from UI but still searchable).
export const deleteVectorsByContentId = async (contentId, userId) => {
  // Guard: undefined/null contentId produces an undefined filter value.
  // Qdrant behavior with undefined filter is unpredictable — could match nothing
  // or throw an API error. Catch this explicitly with a clean message.
  if (!contentId) {
    throw new Error("[deleteVectorsByContentId] contentId is required");
  }

  try {
    // Filter delete: removes all points where payload.contentId matches.
    // One content item = N chunks in Qdrant = N points deleted here.
    //
    // userId added as second filter condition — defense in depth.
    // The controller already verifies ownership before calling this,
    // but scoping the Qdrant delete to userId prevents cross-user
    // vector deletion if this function is ever called from another path.
    //
    // wait: true — block until Qdrant confirms deletion is complete.
    // Without this, the controller may delete the MongoDB document
    // while vectors are still being removed (brief window of ghost search results).
    const filter = {
      must: [
        { key: "contentId", match: { value: contentId } },
        // Include userId filter if provided — belt-and-suspenders ownership check
        ...(userId ? [{ key: "userId", match: { value: userId } }] : []),
      ],
    };

    const result = await qdrantClient.delete(QDRANT_COLLECTION_NAME, {
      wait: true, // Consistent with ingestion upsert — confirm before returning
      filter,
    });

    // Qdrant returns { operation_id, status } — check status explicitly.
    // "acknowledged" = deletion queued. "completed" = deletion confirmed.
    // With wait: true, status should always be "completed".
    if (result?.status !== "completed") {
      console.warn(
        `[deleteVectorsByContentId] Unexpected Qdrant status for contentId ${contentId}:`,
        result?.status,
      );
    }

    // Note: Qdrant doesn't return a count of deleted points in filter deletes.
    // If content was never embedded (short note, failed ingestion), this is a no-op.
    // That's correct behavior — not an error.
    console.info(
      `[deleteVectorsByContentId] Vectors deleted for contentId: ${contentId}`,
    );

    return result;
  } catch (error) {
    console.error(
      `[deleteVectorsByContentId] Failed for contentId "${contentId}":`,
      error.message,
    );

    // Preserve original error with cause chain — don't discard the real failure reason.
    // Controller receives a meaningful error, original stack trace is preserved via 'cause'.
    throw new Error(
      `Failed to delete vectors for content ${contentId}: ${error.message}`,
      { cause: error },
    );
  }
};
