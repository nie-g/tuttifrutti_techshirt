import { query } from "./_generated/server";
import { v } from "convex/values";

// Get all designs
export const listAllDesigns = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("design").collect();
  },
});

// Get designs by client
export const getDesignsByClient = query({
  args: { clientId: v.id("users") },
  handler: async (ctx, { clientId }) => {
    return await ctx.db
      .query("design")
      .filter((q) => q.eq(q.field("client_id"), clientId))
      .collect();
  },
});

export const getDesignsByDesigner = query({
  args: { designerId: v.id("users") },
  handler: async (ctx, { designerId }) => {
    return await ctx.db
      .query("design")
      .filter((q) => q.eq(q.field("designer_id"), designerId))
      .collect();
  },
});

export const getDesignByRequestId = query({
  args: { requestId: v.id("design_requests") },
  handler: async (ctx, { requestId }) => {
    return await ctx.db
      .query("design")
      .withIndex("by_request", (q) => q.eq("request_id", requestId))
      .first();
  },
});

export const getById = query({
  args: { designId: v.id("design") },
  handler: async (ctx, { designId }) => {
    return await ctx.db.get(designId);
  },
});