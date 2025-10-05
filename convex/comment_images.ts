import { query } from "./_generated/server";
import { v } from "convex/values";

// ✅ Fetch all comment_images for a given design preview
export const listAll = query({
  args: { preview_id: v.id("design_preview") },
  handler: async (ctx, { preview_id }) => {
    // 1️⃣ Get all comments under this preview
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_preview", (q) => q.eq("preview_id", preview_id)) // fixed index name
      .collect();

    // 2️⃣ Collect comment IDs
    const commentIds = comments.map((c) => c._id);

    // 3️⃣ Fetch all images whose comment_id is in that list
    const images = [];
    for (const commentId of commentIds) {
      const imgs = await ctx.db
        .query("comment_images")
        .withIndex("by_comment", (q) => q.eq("comment_id", commentId))
        .collect();
      images.push(...imgs);
    }

    return images;
  },
});
