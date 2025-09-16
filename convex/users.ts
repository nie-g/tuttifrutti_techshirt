import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import Clerk from "@clerk/clerk-sdk-node";

export const storeClerkUser = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    role: v.union(v.literal("client"), v.literal("designer"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    console.log("storeClerkUser called with:", args);

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    let userId;
    if (existing) {
      console.log("🔄 Existing user found, patching _id:", existing._id);
      await ctx.db.patch(existing._id, {
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        role: args.role,
      });
      userId = existing._id;
      console.log("✅ Patch complete");
    } else {
      console.log("🆕 No existing user — inserting new user");
      userId = await ctx.db.insert("users", {
        clerkId: args.clerkId,
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        role: args.role,
        createdAt: Date.now(),
      });
      console.log("✅ Insert complete");
    }

    // --- create role-specific profile if missing ---
    if (args.role === "client") {
      const clientProfile = await ctx.db
        .query("clients")
        .withIndex("by_user", (q) => q.eq("user_id", userId))
        .unique();

      if (!clientProfile) {
        await ctx.db.insert("clients", {
          user_id: userId,
          phone: "",
          address: "",
          bio: "",
          created_at: Date.now(),
        });
        console.log("✅ Client profile created");
      }
    }

    if (args.role === "designer") {
  const designerProfile = await ctx.db
    .query("designers")
    .withIndex("by_user", (q) => q.eq("user_id", userId))
    .unique();

  if (!designerProfile) {
    // 1. Create designer row first
    const designerId = await ctx.db.insert("designers", {
      user_id: userId,
      specialization: "",
      bio: "",
      contact_number: "",
      address: "",
      created_at: Date.now(),
    });

    // 2. Create portfolio linked to designer
    const portfolioId = await ctx.db.insert("portfolios", {
      designer_id: designerId, // ✅ correct type
      title: "My Portfolio",
      description: "",
      created_at: Date.now(),
    });

    // 3. Patch designer with portfolio reference
    await ctx.db.patch(designerId, { portfolio_id: portfolioId });

    console.log("✅ Designer profile + portfolio created");
  }
}
      

    if (args.role === "admin") {
      const adminProfile = await ctx.db
        .query("admins")
        .withIndex("by_user", (q) => q.eq("user_id", userId))
        .unique();

      if (!adminProfile) {
        await ctx.db.insert("admins", {
          user_id: userId,
          address: "",
          notes: "",
          created_at: Date.now(),
        });
        console.log("✅ Admin profile created");
      }
    }
  },
});

// quick debug query (frontend can call this)
export const listAllUsers = query({
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});
