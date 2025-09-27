import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
// Get all designs
export const listAllDesigns = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("design").collect();
  },
});

// Get designs by client
export const getDesignsByClient = query({
  args: { clientId: v.id("users") },
  handler: async (ctx, { clientId }) => {
    return await ctx.db
      .query("design")
      .filter((q) => q.eq(q.field("client_id"), clientId))
      .collect();
  },
});

export const getDesignsByDesigner = query({
  args: { designerId: v.id("users") },
  handler: async (ctx, { designerId }) => {
    return await ctx.db
      .query("design")
      .filter((q) => q.eq(q.field("designer_id"), designerId))
      .collect();
  },
});

export const getDesignByRequestId = query({
  args: { requestId: v.id("design_requests") },
  handler: async (ctx, { requestId }) => {
    return await ctx.db
      .query("design")
      .withIndex("by_request", (q) => q.eq("request_id", requestId))
      .first();
  },
});

export const getById = query({
  args: { designId: v.id("design") },
  handler: async (ctx, { designId }) => {
    return await ctx.db.get(designId);
  },
});

export const approveDesign = mutation({
  args: { designId: v.id("design") },
  handler: async (ctx, { designId }) => {
    const design = await ctx.db.get(designId);
    if (!design) throw new Error("Design not found");

    // --- Get linked request ---
    const request = await ctx.db.get(design.request_id);
    if (!request) throw new Error("Design request not found");

    // --- Get print type ---
    const printType = request.print_type; // "Sublimation" | "Dtf"
    if (!printType) throw new Error("Print type not set on request");

    // --- Get total shirt count ---
    const reqSizes = await ctx.db
      .query("request_sizes")
      .withIndex("by_request", (q) => q.eq("request_id", design.request_id))
      .collect();

    const shirtCount = reqSizes.reduce((sum, rs) => sum + rs.quantity, 0);

    // --- Extract revision count ---
    const revisionCount = design.revision_count ?? 0;

    // --- printing fee per shirt ---
    const printFee =
      printType.toLowerCase() === "sublimation" ? 550 : 500;

    // --- revision fee ---
    let revisionFee = 0;
    if (shirtCount >= 15) {
      revisionFee = revisionCount > 2 ? (revisionCount - 2) * 400 : 0;
    } else {
      revisionFee = revisionCount * 400;
    }

    // --- base calculation ---
    let startingAmount = 0;
    if (shirtCount >= 15) {
      startingAmount = shirtCount * printFee + revisionFee;
    } else {
      startingAmount = shirtCount * printFee + 400 + revisionFee; // + designer fee
    }

    // --- Update design status ---
    await ctx.db.patch(designId, { status: "approved" });

    // --- Check if a billing already exists ---
    const existingBilling = await ctx.db
      .query("billing")
      .withIndex("by_design", (q) => q.eq("design_id", designId))
      .first();

    if (!existingBilling) {
      // Create invoice
      

      // Insert billing record
      await ctx.db.insert("billing", {
        starting_amount: startingAmount,
        final_amount: startingAmount,
        negotiation_history: [],
        negotiation_rounds: 0,
        status: "pending",
        client_id: design.client_id,
        designer_id: design.designer_id,
        design_id: designId,
        created_at: Date.now(),
      });
    }

    return { success: true, status: "approved", startingAmount };
  },
});




export const reviseDesign = mutation({
  args: { designId: v.id("design") },
  handler: async (ctx, { designId }) => {
    const design = await ctx.db.get(designId);
    if (!design) throw new Error("Design not found");

    await ctx.db.patch(designId, {
      status: "pending_revision",
      revision_count: design.revision_count + 1,
    });

    return { success: true };
  },
});




export const getDesignWithRequest = query({
  args: { designId: v.id("design") },
  handler: async (ctx, { designId }) => {
    const design = await ctx.db.get(designId);
    if (!design) return null;

    // --- Get linked request
    const request = await ctx.db.get(design.request_id);

    // --- Get client user
    let client = null;
    if (design.client_id) {
      client = await ctx.db.get(design.client_id);
    }

    // --- Get selected colors
        const colors = request
      ? await ctx.db
          .query("selected_colors")
          .filter((q) => q.eq(q.field("request_id"), request._id))
          .collect()
      : [];

    // --- Get sizes (join request_sizes -> shirt_sizes)
    let sizes: { size_label: string; quantity: number }[] = [];
    if (request) {
      const reqSizes = await ctx.db
        .query("request_sizes")
        .withIndex("by_request" as any, (q) =>
          q.eq("request_id" as any, request._id)
        )
        .collect();

      sizes = await Promise.all(
        reqSizes.map(async (rs) => {
          const size = await ctx.db.get(rs.size_id);
          return size
            ? { size_label: size.size_label, quantity: rs.quantity }
            : null;
        })
      ).then((res) =>
        res.filter(
          (r): r is { size_label: string; quantity: number } => r !== null
        )
      );
    }

    return {
      request,
      client,
      status: design.status,
      created_at: design.created_at,
      colors,
      sizes,
    };
  },
});
