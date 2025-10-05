// convex/comments.ts
import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

/* =========================
 *          QUERIES
 * ========================= */
export const listByUser = query({
  args: { user_id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("comments")
      .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
      .order("desc")
      .collect();
  },
});

/* =========================
 *        MUTATIONS
 * ========================= */
export const add = mutation({
  args: {
    preview_id: v.id("design_preview"),
    comment: v.string(),
  },
  handler: async (ctx, { preview_id, comment }) => {
    // Pick any user record for now (or later map to Clerk user)
    const user = await ctx.db.query("users").first();
    if (!user) throw new Error("No users found in DB");

    return await ctx.db.insert("comments", {
      preview_id,
      user_id: user._id,
      comment,
      created_at: Date.now(),
    });
  },
});

export const insertCommentsImages = mutation({
  args: {
    comment_id: v.id("comments"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args): Promise<Id<"comment_images">> => {
    const now = Date.now();
    return await ctx.db.insert("comment_images", {
      comment_id: args.comment_id,
      storage_id: args.storageId,
      created_at: now,
    });
  },
});

// Action: upload file bytes to storage, then insert row
export const saveCommentsImages = action({
  args: {
    comment_id: v.id("comments"),
    fileBytes: v.bytes(), // ArrayBuffer from client
  },
  handler: async (ctx, { comment_id, fileBytes }): Promise<Id<"comment_images">> => {
    // 1. Convert ArrayBuffer -> Blob
    const blob = new Blob([new Uint8Array(fileBytes)], { type: "image/png" });

    // 2. Store in Convex storage
    const storageId = await ctx.storage.store(blob);

    // 3. Save DB record
    return await ctx.runMutation(api.comments.insertCommentsImages, {
      comment_id,
      storageId,
    });
  },
});


// keep your listByPreview query
export const listByPreview = query({
  args: { preview_id: v.id("design_preview") },
  handler: async (ctx, { preview_id }) => {
    return await ctx.db
      .query("comments")
      .filter((q) => q.eq(q.field("preview_id"), preview_id))
      .order("desc")
      .collect();
  },
});


export const getImagesByCommentId = query({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("comment_images")
      .filter((q) => q.eq(q.field("comment_id"), args.commentId))
      .collect();
  },
});

// Get a storage URL for a stored file
export const getCommentImageUrl = action({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});