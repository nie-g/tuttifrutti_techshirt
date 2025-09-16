import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Save or update a single canvas per design
export const saveCanvas = mutation({
  args: {
    designId: v.id("design"),
    canvasJson: v.string(),
    thumbnail: v.optional(v.string()),
    version: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const existing = await ctx.db
      .query("fabric_canvases")
      .withIndex("by_design", (q) => q.eq("design_id", args.designId))
      .unique()
      .catch(() => null);

    if (existing) {
      await ctx.db.patch(existing._id, {
        canvas_json: args.canvasJson,
        thumbnail: args.thumbnail,
        version: args.version,
        updated_at: now,
      });
    } else {
      await ctx.db.insert("fabric_canvases", {
        design_id: args.designId,
        canvas_json: args.canvasJson,
        thumbnail: args.thumbnail,
        version: args.version,
        created_at: now,
        updated_at: now,
      });
    }
  },
});

// Ensure a design has an empty canvas if none exists
export const createFabricCanvasForDesign = mutation({
  args: { designId: v.id("design") },
  handler: async (ctx, { designId }) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("fabric_canvases")
      .withIndex("by_design", (q) => q.eq("design_id", designId))
      .unique()
      .catch(() => null);

    if (!existing) {
      return await ctx.db.insert("fabric_canvases", {
        design_id: designId,
        created_at: now,
        updated_at: now,
      });
    }
    return existing._id;
  },
});

// Fetch the single canvas for a design
export const getByDesign = query({
  args: { designId: v.id("design") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("fabric_canvases")
      .withIndex("by_design", (q) => q.eq("design_id", args.designId))
      .unique()
      .catch(() => null);
  },
});
