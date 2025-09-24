import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("clients")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .unique();
  },
});

export const updateProfile = mutation({
  args: {
    clientId: v.id("clients"),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, { clientId, phone, address }) => {
    await ctx.db.patch(clientId, {
      phone,
      address,
    });
  },
});
