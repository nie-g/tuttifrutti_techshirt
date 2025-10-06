import { mutation, action, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

// ✅ Mutation to insert a new design sketch
export const insertDesignSketch = mutation({
  args: {
    requestId: v.id("design_requests"), // should reference design_requests, not request_sketches
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args): Promise<Id<"request_sketches">> => {
    const now = Date.now();
    console.log("📦 Inserting sketch for request:", args.requestId);


    return await ctx.db.insert("request_sketches", {
      request_id: args.requestId, // foreign key to design_requests
      sketch_image: args.storageId,
      created_at: now,
    });
  },
});


// ✅ Action to handle uploading and saving a sketch
export const saveDesignSketch = action({
  args: {
    requestId: v.id("design_requests"), // same here
    fileBytes: v.bytes(),
  },
  handler: async (ctx, { requestId, fileBytes }): Promise<Id<"request_sketches">> => {
    // 1. Convert ArrayBuffer → Blob
    const blob = new Blob([new Uint8Array(fileBytes)], { type: "image/png" });
    console.log("💾 saveDesignSketch action called with", requestId);
    console.log("💾 file size:", fileBytes.byteLength);

    // 2. Store the blob in Convex storage
    const storageId = await ctx.storage.store(blob);

    // 3. Save to request_sketches table
    return await ctx.runMutation(api.designSketch.insertDesignSketch, {
      requestId,
      storageId,
    });
  },
});

export const getByRequestId = query({
  args: { requestId: v.id("design_requests") },
  handler: async (ctx, { requestId }) => {
    return await ctx.db
      .query("request_sketches")
      .withIndex("by_request", (q) => q.eq("request_id", requestId))
      .collect();
  },
});