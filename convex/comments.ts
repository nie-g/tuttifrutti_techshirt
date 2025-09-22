// convex/comments.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
