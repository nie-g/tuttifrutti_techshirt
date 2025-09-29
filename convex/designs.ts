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
    const printType = request.print_type;
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

    // --- Fetch designer profile (from designers table) ---
    const designerProfile = await ctx.db
      .query("designers")
      .withIndex("by_user", (q) => q.eq("user_id", design.designer_id))
      .unique();

    if (!designerProfile) throw new Error("Designer profile not found");

    // --- Fetch pricing from designer_pricing ---
    const pricing = await ctx.db
      .query("designer_pricing")
      .withIndex("by_designer", (q) => q.eq("designer_id", designerProfile._id))
      .first();

    const designerFee = pricing?.promo_amount ?? pricing?.normal_amount ?? 0;

    // --- base calculation ---
    let startingAmount = 0;
    if (shirtCount >= 15) {
      startingAmount = shirtCount * printFee + revisionFee + designerFee;
    } else {
      startingAmount = shirtCount * printFee + 400 + revisionFee + designerFee;
    }

    // --- Update design status ---
    await ctx.db.patch(designId, { status: "approved" });

    // --- Check if billing already exists ---
    const existingBilling = await ctx.db
      .query("billing")
      .withIndex("by_design", (q) => q.eq("design_id", designId))
      .first();

    if (!existingBilling) {
      await ctx.db.insert("billing", {
        starting_amount: startingAmount,
        final_amount: 0,
        negotiation_history: [],
        negotiation_rounds: 0,
        status: "pending",
        client_id: design.client_id,

        // store both IDs for clarity
        designer_id: design.designer_id, // from users table

        design_id: designId,
        created_at: Date.now(),
      });
    }

    // --- Send notification to the designer (userId) ---
    await ctx.db.insert("notifications", {
      recipient_user_id: design.designer_id, // still userId
      recipient_user_type: "designer",
      notif_content: `Your design "${design._id ?? "Untitled"}" has been approved by the client.`,
      created_at: Date.now(),
      is_read: false,
    });

    return { success: true, status: "approved", startingAmount };
  },
});


export const reviseDesign = mutation({
  args: { designId: v.id("design") }, // ✅ singular, matches schema
  handler: async (ctx, { designId }) => {
    const design = await ctx.db.get(designId);
    if (!design) throw new Error("Design not found");

    // Ensure revision_count exists
    const revisionCount = (design.revision_count ?? 0) + 1;

    // 1. Update the design
    await ctx.db.patch(designId, {
      status: "pending_revision",
      revision_count: revisionCount,
    });

    // 2. Send notification to designer (schema uses designer_id)
    if (design.designer_id) {
      await ctx.db.insert("notifications", {
        recipient_user_id: design.designer_id,
        recipient_user_type: "designer",
        notif_content: `A revision has been requested for the design (ID: ${design._id}).`,
        created_at: Date.now(),
        is_read: false,
      });
    }

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

// Get full design details (design + request + client + designer + sizes + colors)
export const getFullDesignDetails = query({
  args: { designId: v.id("design") },
  handler: async (ctx, { designId }) => {
    const design = await ctx.db.get(designId);
    if (!design) return null;

    // --- Linked request ---
    const request = await ctx.db.get(design.request_id);

    // --- Client ---
    const client = design.client_id
      ? await ctx.db.get(design.client_id)
      : null;
    const fabric = request 
    ? await ctx.db.get(request.textile_id) 
    : null;
    // --- Designer ---
    const designer = design.designer_id
      ? await ctx.db.get(design.designer_id)
      : null;

    // --- Selected colors ---
    const colors = request
      ? await ctx.db
          .query("selected_colors")
          .filter((q) => q.eq(q.field("request_id"), request._id))
          .collect()
      : [];

    // --- Sizes (join request_sizes -> shirt_sizes) ---
    let sizes: { size_label: string; quantity: number }[] = [];
    if (request) {
      const reqSizes = await ctx.db
        .query("request_sizes")
        .withIndex("by_request", (q) => q.eq("request_id", request._id))
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
      design,
      request,
      client,
      fabric,
      designer,
      colors,
      sizes,
    };
  },
});

export const markAsCompleted = mutation({
  args: { designId: v.id("design"), userId: v.id("users") },
  handler: async (ctx, { designId }) => {
    
    // --- Helper function to notify users about low stock ---
    const notifyLowStockUsers = async (requestTitle: string, userIds: Id<"users">[]) => {
      for (const uid of userIds) {
        await ctx.db.insert("notifications", {
          recipient_user_id: uid,
          recipient_user_type: "client",
          notif_content: `Warning: Order "${requestTitle}" may be delayed for at  least 7 days due to insufficient fabric stock.`,
          created_at: Date.now(),
          is_read: false,
        });
      }
    };

    // --- Helper to notify admin ---
    const notifyAdminLowStock = async (requestTitle: string, shortage: number) => {
      const adminUser = await ctx.db.query("users").first();
      if (adminUser) {
        await ctx.db.insert("notifications", {
          recipient_user_id: adminUser._id,
          recipient_user_type: "admin",
          notif_content: `Low stock alert for "${requestTitle}". Additional ${shortage} yards needed to fulfill the order.`,
          created_at: Date.now(),
          is_read: false,
        });
      }
    };

    // 1. Get the design
    const design = await ctx.db.get(designId);
    if (!design) throw new Error("Design not found");

    // 2. Get the associated request
    const request = await ctx.db.get(design.request_id);
    if (!request) throw new Error("Request not found");
    if (!request.textile_id) throw new Error("No fabric selected for this request");

    // 3. Get all request_sizes for this request
    const sizes = await ctx.db
      .query("request_sizes")
      .withIndex("by_request", (q) => q.eq("request_id", request._id))
      .collect();
    if (!sizes.length) throw new Error("No sizes found for this request");

    // 4. Fetch all shirt sizes once and store in a map
    const sizeMap: Record<string, string> = {};
    for (const s of sizes) {
      const shirtSize = await ctx.db.get(s.size_id);
      if (!shirtSize) throw new Error(`Shirt size not found: ${s.size_id}`);
      sizeMap[s._id] = shirtSize.size_label;
    }

    // 5. Define yardage per size
    const yardPerSize: Record<string, number> = {
      XS: 0.8,
      S: 1.0,
      M: 1.2,
      L: 1.4,
      XL: 1.6,
      XXL: 1.8,
    };

    // 6. Calculate total yards needed
    let totalYardsNeeded = 0;
    for (const s of sizes) {
      const sizeLabel = sizeMap[s._id] ?? "M"; 
      totalYardsNeeded += s.quantity * (yardPerSize[sizeLabel] ?? 1.2);
    }

    // 7. Fetch the selected fabric item from inventory
    const fabricItem = await ctx.db.get(request.textile_id);
    if (!fabricItem) throw new Error("Selected fabric not found in inventory");

    // 8. Check remaining stock
    let remainingStock = fabricItem.stock - totalYardsNeeded;

    // 9. Handle low stock
    if (remainingStock < 0) {
      const shortage = Math.abs(remainingStock);

      // Set inventory to 0 instead of negative
      remainingStock = 0;

      // Notify admin of shortage
      await notifyAdminLowStock(request.request_title, shortage);

      // Notify requesting user
      await notifyLowStockUsers(request.request_title, [request.client_id]);
    }

    // 10. Deduct fabric stock
    await ctx.db.patch(fabricItem._id, {
      stock: remainingStock,
      updated_at: Date.now(),
    });

    // 11. Mark design as finished
    await ctx.db.patch(designId, { status: "finished", created_at: Date.now() });

    return {
      success: true,
      deducted: totalYardsNeeded,
      remaining: remainingStock,
      notified: remainingStock === 0,
    };
  },
});
