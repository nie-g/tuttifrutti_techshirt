import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all pricings
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const pricings = await ctx.db.query("designer_pricing").collect();

    return pricings.map((p) => ({
      _id: p._id,
      designerId: p.designer_id,
      normalAmount: p.normal_amount,
      promoAmount: p.promo_amount,
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
export const create = mutation({
  args: {
    designer_id: v.id("designers"),
    normal_amount: v.number(),
    promo_amount: v.optional(v.number()),
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
export const update = mutation({
  args: {
    id: v.id("designer_pricing"),
    normal_amount: v.number(),
    promo_amount: v.optional(v.number()),
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
