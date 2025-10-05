// convex/design_preview.ts
import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// ✅ Action: accepts ArrayBuffer, converts to Blob, stores file, then updates DB
export const savePreview = action({
  args: {
    designId: v.id("design"),
    previewImage: v.bytes(), // ArrayBuffer coming from client
  },
  handler: async (ctx, args): Promise<string> => {
    // 1. Convert ArrayBuffer -> Blob (Convex requires Blob/File)
    const blob = new Blob([new Uint8Array(args.previewImage)], { type: "image/png" });

    // 2. Store in Convex storage
    const storageId = await ctx.storage.store(blob);

    // 3. Save DB record (always insert)
    const docId = await ctx.runMutation(api.design_preview.insertPreview, {
      designId: args.designId,
      storageId,
    });

    return docId;
  },
});

// ✅ Mutation: always inserts a new row
export const insertPreview = mutation({
  args: {
    designId: v.id("design"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args): Promise<string> => {
    const now = Date.now();

    return await ctx.db.insert("design_preview", {
      design_id: args.designId,
      preview_image: args.storageId,
      created_at: now,
    });
  },
});

// ✅ Query to fetch preview by design
export const getByDesign = query({
  args: { designId: v.id("design") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("design_preview")
      .withIndex("by_design", (q) => q.eq("design_id", args.designId))
      .first();
  },
});

export const getLatestByDesign = query({
  args: { designId: v.id("design") },
  handler: async (ctx, args) => {
    const previews = await ctx.db
      .query("design_preview")
      .withIndex("by_design", (q) => q.eq("design_id", args.designId))
      .order("desc") // newest first
      .take(1);

    return previews[0] || null;
  },
});

export const listByDesign = query({
  args: { designId: v.id("design") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("design_preview")
      .withIndex("by_design", (q) => q.eq("design_id", args.designId))
      .order("desc") // newest first
      .collect();
  },
});

