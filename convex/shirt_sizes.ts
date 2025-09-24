import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all shirt sizes
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("shirt_sizes").collect();
  },
});

// Get a shirt size by ID
export const getById = query({
  args: { id: v.id("shirt_sizes") },
  handler: async (ctx, args) => {
    const { id } = args;
    console.log("Fetching shirt size with ID:", id);
    const size = await ctx.db.get(id);
    console.log("Retrieved shirt size:", size);
    return size;
  },
});

// Get shirt sizes by type
export const getByType = query({
  args: {
    type: v.union(
      v.literal("jersey"),
      v.literal("polo"),
      v.literal("tshirt"),
      v.literal("long sleeves")
    )
  },
  handler: async (ctx, args) => {
    const { type } = args;
    return await ctx.db
      .query("shirt_sizes")
      .filter(q => q.eq(q.field("type"), type))
      .collect();
  },
});

// Get shirt sizes by category
export const getByCategory = query({
  args: {
    category: v.union(
      v.literal("kids"),
      v.literal("adult")
    )
  },
  handler: async (ctx, args) => {
    const { category } = args;
    return await ctx.db
      .query("shirt_sizes")
      .filter(q => q.eq(q.field("category"), category))
      .collect();
  },
});

// Create a new shirt size
export const create = mutation({
  args: {
    size_label: v.string(),
    w: v.number(),
    h: v.number(),
    type: v.union(
      v.literal("jersey"),
      v.literal("polo"),
      v.literal("tshirt"),
      v.literal("long sleeves")
    ),
    sleeves_w: v.optional(v.number()),
    sleeves_h: v.optional(v.number()),
    category: v.union(
      v.literal("kids"),
      v.literal("adult")
    ),
  },
  handler: async (ctx, args) => {
    const {
      size_label,
      w,
      h,
      type,
      sleeves_w,
      sleeves_h,
      category,
    } = args;

    const sizeId = await ctx.db.insert("shirt_sizes", {
      size_label,
      w,
      h,
      type,
      sleeves_w,
      sleeves_h,
      category,
      created_at: Date.now(),
    });

    return sizeId;
  },
});

// Update an existing shirt size
export const update = mutation({
  args: {
    id: v.id("shirt_sizes"),
    size_label: v.optional(v.string()),
    w: v.optional(v.number()),
    h: v.optional(v.number()),
    type: v.optional(v.union(
      v.literal("jersey"),
      v.literal("polo"),
      v.literal("tshirt"),
      v.literal("long sleeves")
    )),
    sleeves_w: v.optional(v.number()),
    sleeves_h: v.optional(v.number()),
    category: v.optional(v.union(
      v.literal("kids"),
      v.literal("adult")
    )),
  },
  handler: async (ctx, args) => {
    const { id, ...updateFields } = args;

    // Check if the shirt size exists
    const shirtSize = await ctx.db.get(id);
    if (!shirtSize) {
      throw new Error("Shirt size not found");
    }

    // Update the shirt size
    await ctx.db.patch(id, updateFields);

    return id;
  },
});

// Delete a shirt size
// Delete a shirt size
export const remove = mutation({
  args: { id: v.id("shirt_sizes") },
  handler: async (ctx, args) => {
    const { id } = args;

    // Check if the shirt size exists
    const shirtSize = await ctx.db.get(id);
    if (!shirtSize) {
      throw new Error("Shirt size not found");
    }

    // Check if the shirt size is used in any request_sizes
    const requestSizes = await ctx.db
      .query("request_sizes")
      .withIndex("by_size", q => q.eq("size_id", id))
      .collect();

    if (requestSizes.length > 0) {
      throw new Error("Cannot delete shirt size that is used in design requests");
    }

    // Delete the shirt size
    await ctx.db.delete(id);

    return { success: true };
  },
});

