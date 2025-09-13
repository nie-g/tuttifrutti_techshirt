import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Save a selected color for a design request
export const saveSelectedColors = mutation({
  args: {
    requestId: v.id("design_requests"),
    hex: v.string(),
    createdAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { requestId, hex, createdAt } = args;

    // Check if the design request exists
    const request = await ctx.db.get(requestId);
    if (!request) {
      throw new Error("Design request not found");
    }

    // Create the selected color entry
    const colorId = await ctx.db.insert("selected_colors", {
      request_id: requestId,
      hex: hex,
      created_at: createdAt || Date.now(),
    });

    return colorId;
  },
});

// Get all selected colors for a design request
export const getSelectedColors = query({
  args: { requestId: v.id("design_requests") },
  handler: async (ctx, args) => {
    const { requestId } = args;

    // Get all selected colors for this request
    const colors = await ctx.db
      .query("selected_colors")
      .filter(q => q.eq(q.field("request_id"), requestId))
      .collect();

    return colors;
  },
});
