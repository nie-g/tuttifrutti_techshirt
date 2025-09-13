import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

/* =========================
 *    Canvas queries & saves
 * ========================= */

// Save or update canvas (designer calls this when clicking Save)
export const saveCanvas = mutation({
  args: {
    designId: v.id("design"),
    category: v.union(
      v.literal("front"),
      v.literal("back"),
      v.literal("left_sleeve"),
      v.literal("right_sleeve"),
      v.literal("collar"),
      v.literal("other")
    ),
    canvasJson: v.string(),
    thumbnail: v.optional(v.string()),
    version: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const existing = await ctx.db
      .query("fabric_canvases")
      .withIndex("by_design_category", (q) =>
        q.eq("design_id", args.designId).eq("category", args.category)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        canvas_json: args.canvasJson,
        thumbnail: args.thumbnail,
        version: args.version,
        updated_at: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("fabric_canvases", {
      design_id: args.designId,
      category: args.category,
      canvas_json: args.canvasJson,
      thumbnail: args.thumbnail,
      version: args.version,
      created_at: now,
      updated_at: now,
    });
  },
});

/* ====================================================
 * Create empty canvases for a design based on shirt type
 * ==================================================== */
export const createFabricCanvasesForDesign = mutation({
  args: {
    designId: v.id("design"),
    requestId: v.id("design_requests"),
    shirtType: v.optional(v.string()),
  },
  handler: async (ctx, { designId, requestId, shirtType }) => {
    const now = Date.now();
    const st = (shirtType || "tshirt").toLowerCase();

    let categories: (
      | "front"
      | "back"
      | "left_sleeve"
      | "right_sleeve"
      | "collar"
      | "other"
    )[] = ["front", "back"];

    if (st.includes("jersey")) {
      categories = ["front", "back"];
    } else if (st.includes("polo")) {
      categories = ["front", "back", "left_sleeve", "right_sleeve", "collar"];
    } else if (
      st.includes("tshirt") ||
      st.includes("vneck") ||
      st.includes("v-neck") ||
      st.includes("round")
    ) {
      categories = ["front", "back", "left_sleeve", "right_sleeve"];
    }

    // Idempotent creation
    const created: Id<"fabric_canvases">[] = [];
    for (const category of categories) {
      const existing = await ctx.db
        .query("fabric_canvases")
        .withIndex("by_design_category", (q) =>
          q.eq("design_id", designId).eq("category", category)
        )
        .unique();

      if (!existing) {
        const id = await ctx.db.insert("fabric_canvases", {
          design_id: designId,
          category,
          created_at: now,
          updated_at: now,
        });
        created.push(id);
      }
    }

    return {
      designId,
      requestId,
      shirtType,
      createdCategories: categories,
      created,
    };
  },
});

// ✅ Fetch all canvases for a given design
export const listByDesign = query({
  args: { designId: v.id("design") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("fabric_canvases")
      .withIndex("by_design", (q) => q.eq("design_id", args.designId))
      .collect();
  },
});
