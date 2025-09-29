import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const addRating = mutation({
  args: {
    portfolioId: v.id("portfolios"),
    designId: v.id("design"),
    reviewerId: v.id("users"),
    rating: v.number(),
    feedback: v.optional(v.string()),
  },
  handler: async ({ db }, { portfolioId, designId, reviewerId, rating, feedback }) => {
    return await db.insert("ratings_feedback", {
      portfolio_id: portfolioId,
      design_id: designId,
      reviewer_id: reviewerId,
      rating,
      feedback: feedback || "",
      created_at: Date.now(),
    });
  },
});