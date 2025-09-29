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

export const getByDesign = query({
  args: { designId: v.id("design") },
  handler: async ({ db }, { designId }) => {
    const design = await db.get(designId);
    if (!design) return null;

    return await db
      .query("designers")
      .withIndex("by_user", (q) => q.eq("user_id", design.designer_id))
      .unique();
  },
});
export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("designers")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .unique();
  },
});

// ✅ Fetch all designers

export const listAllWithUsers = query({
  args: {},
  handler: async (ctx) => {
    const designers = await ctx.db.query("designers").collect();

    // join with users
    const users = await Promise.all(
      designers.map((d) => ctx.db.get(d.user_id))
    );

    return designers.map((d, i) => ({
      _id: d._id,
      user_id: d.user_id,
      firstName: users[i]?.firstName ?? "",
      lastName: users[i]?.lastName ?? "",
      email: users[i]?.email ?? "",
    }));
  },
});