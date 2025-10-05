import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * 🧾 Get all print pricing entries
 */
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("print_pricing").collect();
  },
});

/**
 * ➕ Create a new print pricing record
 */
export const create = mutation({
  args: {
    print_type: v.union(v.literal("Sublimation"), v.literal("Dtf")),
    amount: v.number(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("print_pricing", {
      print_type: args.print_type,
      amount: args.amount,
      description: args.description,
      created_at: Date.now(),
    });
    return id;
  },
});

/**
 * ✏️ Update an existing print pricing record
 */
export const update = mutation({
  args: {
    id: v.id("print_pricing"),
    print_type: v.optional(v.union(v.literal("Sublimation"), v.literal("Dtf"))),
    amount: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Print pricing not found");

    await ctx.db.patch(id, {
      ...updates,
      updated_at: Date.now(),
    });

    return id;
  },
});

/**
 * 🗑️ Delete a print pricing record
 */
export const remove = mutation({
  args: { id: v.id("print_pricing") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
