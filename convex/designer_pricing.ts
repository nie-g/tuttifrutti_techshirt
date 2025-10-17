import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all pricings
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const pricings = await ctx.db.query("designer_pricing").collect();

    return pricings.map((p) => ({
      _id: p._id,
      designer_id: p.designer_id,
      normal_amount: p.normal_amount,
      revision_fee: p.revision_fee,
      description: p.description,
    }));
  },
});


// Get pricing for a specific designer
export const getByDesigner = query({
  args: { designer_id: v.id("designers") },
  handler: async (ctx, { designer_id }) => {
    return await ctx.db
      .query("designer_pricing")
      .withIndex("by_designer", (q) => q.eq("designer_id", designer_id))
      .collect();
  },
});

// Create new pricing
// ✅ Create new pricing
export const create = mutation({
  args: {
    designer_id: v.id("designers"),
    normal_amount: v.number(),
    revision_fee: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("designer_pricing", {
      ...args,
      created_at: Date.now(),
    });
  },
});

// Update pricing
// ✅ Update pricing
export const update = mutation({
  args: {
    id: v.id("designer_pricing"),
    normal_amount: v.number(),
    revision_fee: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...rest }) => {
    await ctx.db.patch(id, { ...rest, updated_at: Date.now() });
    return { success: true };
  },
});


// Delete pricing
export const remove = mutation({
  args: { id: v.id("designer_pricing") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
    return { success: true };
  },
});


export const upsertDefault = mutation({
  args: {
    normal_amount: v.float64(),
    revision_fee: v.optional(v.float64()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("designer_pricing")
      .filter((q) => q.eq(q.field("designer_id"), "default"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        normal_amount: args.normal_amount,
        revision_fee: args.revision_fee,
        description: args.description,
      });
      return existing._id;
    }

    return await ctx.db.insert("designer_pricing", {
      designer_id: "default",
      normal_amount: args.normal_amount,
      revision_fee: args.revision_fee,
      description: args.description,
      created_at: Date.now(),
    });
  },
});
