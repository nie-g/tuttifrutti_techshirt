// convex/designReferences.ts
import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

/* -------------------------
   Queries
------------------------- */

// Get all design references for a specific request
export const getByRequestId = query({
  args: { requestId: v.id("design_requests") },
  handler: async (ctx, { requestId }) => {
    const references = await ctx.db
      .query("design_reference")
      .filter((q) => q.eq(q.field("request_id"), requestId))
      .order("desc")
      .collect();

    return references;
  },
});

/* -------------------------
   Mutations
------------------------- */

// Delete a design reference
export const deleteReference = mutation({
  args: { referenceId: v.id("design_reference") },
  handler: async (ctx, { referenceId }) => {
    const reference = await ctx.db.get(referenceId);
    if (!reference) {
      throw new Error("Design reference not found");
    }
    await ctx.db.delete(referenceId);
    return { success: true };
  },
});

// Insert design reference row (with storageId instead of base64 string)
export const insertDesignReferences = mutation({
  args: {
    requestId: v.id("design_requests"),
    description: v.optional(v.string()),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args): Promise<Id<"design_reference">> => {
    const now = Date.now();
    return await ctx.db.insert("design_reference", {
      request_id: args.requestId,
      design_image: args.storageId,
      description: args.description ?? "",
      created_at: now,
    });
  },
});

// Action: upload file bytes to storage, then insert row
export const saveDesignReferences = action({
  args: {
    requestId: v.id("design_requests"),
    fileBytes: v.bytes(), // ArrayBuffer from client
    description: v.optional(v.string()),
  },
  handler: async (ctx, { requestId, fileBytes, description }): Promise<Id<"design_reference">> => {
    // 1. Convert ArrayBuffer -> Blob
    const blob = new Blob([new Uint8Array(fileBytes)], { type: "image/png" });

    // 2. Store in Convex storage
    const storageId = await ctx.storage.store(blob);

    // 3. Save DB record
    return await ctx.runMutation(api.designReferences.insertDesignReferences, {
      requestId,
      storageId,
      description,
    });
  },
});
