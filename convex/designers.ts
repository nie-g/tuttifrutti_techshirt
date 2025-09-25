import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ✅ Get designer by userId
export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("designers")
      .filter((q) => q.eq(q.field("user_id"), userId))
      .first();
  },
});

// ✅ Update profile
export const updateProfile = mutation({
  args: {
    designerId: v.id("designers"),
    contact_number: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.designerId, {
      contact_number: args.contact_number,
      address: args.address,
    });
  },
});
