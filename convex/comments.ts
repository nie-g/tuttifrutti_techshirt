import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/* =========================
 *          QUERIES
 * ========================= */

// Get comments by preview_id
export const listByPreview = query({
  args: { preview_id: v.id("design_preview") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("comments")
      .withIndex("by_preview", (q) => q.eq("preview_id", args.preview_id))
      .collect();
  },
});

// Get comments by user
export const listByUser = query({
  args: { user_id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("comments")
      .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
      .collect();
  },
});

/* =========================
 *        MUTATIONS
 * ========================= */

// Add a comment (linked to design_preview)
export const add = mutation({
  args: {
    preview_id: v.id("design_preview"),
    user_id: v.id("users"),
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("comments", {
      preview_id: args.preview_id,
      user_id: args.user_id,
      comment: args.comment,
      created_at: Date.now(),
    });
  },
});
