// convex/portfolio.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ✅ List all portfolios
export const listAllPortfolios = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("portfolios").collect();
  },
});

// ✅ Get portfolios by designer
export const getPortfoliosByDesigner = query({
  args: { designer_id: v.id("designers") }, // match schema field
  handler: async (ctx, { designer_id }) => {
    return await ctx.db
      .query("portfolios")
      .filter((q) => q.eq(q.field("designer_id"), designer_id))
      .collect();
  },
});

export const getByDesignerId = query({
  args: { designer_id: v.id("designers") }, // <-- changed from "designers" to "users"
  handler: async (ctx, { designer_id }) => {
    return await ctx.db
      .query("portfolios")
      .filter((q) => q.eq(q.field("designer_id"), designer_id))
      .collect();
  },
});

// ✅ Add new portfolio
export const addPortfolio = mutation({
  args: {
    designer_id: v.id("designers"), // match schema field
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    specialization: v.optional(v.string()),
    social_links: v.optional(
      v.array(
        v.object({
          platform: v.string(),
          url: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("portfolios", {
      designer_id: args.designer_id, // ✅ use designer_id
      title: args.title,
      description: args.description,
      skills: args.skills,
      specialization: args.specialization,
      social_links: args.social_links,
      created_at: Date.now(),
    });
  },
});

// ✅ Update existing portfolio
export const updatePortfolio = mutation({
  args: {
    portfolioId: v.id("portfolios"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    specialization: v.optional(v.string()),
    social_links: v.optional(
      v.array(
        v.object({
          platform: v.string(),
          url: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.portfolioId, {
      title: args.title,
      description: args.description,
      skills: args.skills,
      specialization: args.specialization,
      social_links: args.social_links,
    });
    return true;
  },
});

