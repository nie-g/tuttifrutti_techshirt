import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("shirt_types").collect();
  },
});



export const create = mutation({
  args: {
    type_name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("shirt_types", {
      ...args,
      created_at: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("shirt_types"),
    type_name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      type_name: args.type_name,
      description: args.description,
      created_at: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("shirt_types") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
