import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create an inventory item
export const createInventoryItem = mutation({
  args: {
    name: v.string(),
    categoryId: v.id("inventory_categories"),
    unit: v.string(),
    stock: v.number(),
    reorderLevel: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const inventoryItemId = await ctx.db.insert("inventory_items", {
      name: args.name,
      category_id: args.categoryId,
      unit: args.unit,
      stock: args.stock,
      reorder_level: args.reorderLevel,
      description: args.description,
      created_at: now,
      updated_at: now,
    });
    return inventoryItemId;
  },
});

// Get all inventory items
export const getInventoryItems = query({
  handler: async (ctx) => {
    const inventoryItems = await ctx.db.query("inventory_items").collect();
    // Optionally, fetch category names for display
    const itemsWithCategories = await Promise.all(
      inventoryItems.map(async (item) => {
        const category = await ctx.db.get(item.category_id);
        return {
          ...item,
          categoryName: category ? category.category_name : "Unknown",
        };
      })
    );
    return itemsWithCategories;
  },
});

// Get inventory categories
export const getInventoryCategories = query({
  handler: async (ctx) => {
    return await ctx.db.query("inventory_categories").collect();
  },
});

// Update an inventory item
export const updateInventoryItem = mutation({
  args: {
    id: v.id("inventory_items"),
    name: v.string(),
    categoryId: v.id("inventory_categories"),
    unit: v.string(),
    stock: v.number(),
    reorderLevel: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.id, {
      name: args.name,
      category_id: args.categoryId,
      unit: args.unit,
      stock: args.stock,
      reorder_level: args.reorderLevel,
      description: args.description,
      updated_at: now,
    });
  },
});

// Delete an inventory item
export const deleteInventoryItem = mutation({
  args: { id: v.id("inventory_items") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
