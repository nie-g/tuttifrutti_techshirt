import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create an inventory item
export const createInventoryItem = mutation({
  args: {
    name: v.string(),
    categoryId: v.id("inventory_categories"),
    unit: v.string(),
    stock: v.number(),
    pendingRestock: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const inventoryItemId = await ctx.db.insert("inventory_items", {
      name: args.name,
      category_id: args.categoryId,
      unit: args.unit,
      stock: args.stock,
      pending_restock: args.pendingRestock,
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
    pendingRestock: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.id, {
      name: args.name,
      category_id: args.categoryId,
      unit: args.unit,
      stock: args.stock,
      pending_restock: args.pendingRestock,
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

export const getTextileItems = query({
  handler: async (ctx) => {
    const items = await ctx.db.query("inventory_items").collect();
    const textiles = await Promise.all(
      items.map(async (item) => {
        const category = await ctx.db.get(item.category_id);
        return {
          ...item,
          categoryName: category?.category_name || "Unknown",
        };
      })
    );
    return textiles.filter((item) => item.categoryName.toLowerCase() === "fabric");
  },
});

export const updateStockForNeededItem = mutation({
  args: {
    itemId: v.id("inventory_items"),
    neededQty: v.number(),
  },
  handler: async (ctx, { itemId, neededQty }) => {
    const item = await ctx.db.get(itemId);
    if (!item) throw new Error("Item not found");

    const currentStock = item.stock;
    const currentPending = item.pending_restock ?? 0;

    let newStock = currentStock;
    let newPending = currentPending;

    if (neededQty > currentStock) {
      // Not enough stock — consume all and queue restock
      const shortage = neededQty - currentStock;
      newStock = 0;
      newPending = currentPending + shortage;
    } else {
      // Enough stock — reduce available
      newStock = currentStock - neededQty;
      // pending stays same
    }

    await ctx.db.patch(itemId, {
      stock: newStock,
      pending_restock: newPending,
      updated_at: Date.now(),
    });

    return { newStock, newPending };
  },
});