import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getBillingBreakdown = query({
  args: { designId: v.id("design") },
  handler: async (ctx, { designId }) => {
    const design = await ctx.db.get(designId);
    if (!design) throw new Error("Design not found");

    // Get request
    const request = await ctx.db.get(design.request_id);
    if (!request) throw new Error("Design request not found");

    // Get all request_sizes linked to this request
    const sizes = await ctx.db
      .query("request_sizes")
      .withIndex("by_request", (q) => q.eq("request_id", design.request_id))
      .collect();

    // Total shirts
    const totalShirts = sizes.reduce((sum, s) => sum + s.quantity, 0);

    // Printing fee (based on print_type from request)
    const printingFee =
      request.print_type === "Sublimation" ? 550 : 500;

    // Revision fee
    const revisionCount = design.revision_count || 0;
    let revisionFee = 0;
    if (totalShirts >= 15) {
      revisionFee = revisionCount > 2 ? (revisionCount - 2) * 400 : 0;
    } else {
      revisionFee = revisionCount * 400;
    }

    // Designer fee (only applies if shirts < 15)
    const designerFee = totalShirts < 15 ? 400 : 0;

    // Total
    const total = totalShirts * printingFee + revisionFee + designerFee;

    return {
      shirtCount: totalShirts,
      printFee: printingFee,
      revisionFee,
      designerFee,
      total,
    };
  },
});

export const approveBill = mutation({
  args: { designId: v.id("design") },
  handler: async (ctx, { designId }) => {
    // find the billing record linked to this design
    const billingDoc = await ctx.db
      .query("billing")
      .withIndex("by_design", (q) => q.eq("design_id", designId))
      .first();

    if (!billingDoc) {
      throw new Error("No billing record found for this design");
    }

    // update billing status
    await ctx.db.patch(billingDoc._id, { status: "approved" });

    return { success: true, billingId: billingDoc._id };
  },
});

export const getBillingByDesign = query({
  args: { designId: v.id("design") },
  handler: async (ctx, { designId }) => {
    // 1. Get billing record
    const billingDoc = await ctx.db
      .query("billing")
      .withIndex("by_design", (q) => q.eq("design_id", designId))
      .first();

    if (!billingDoc) {
      return null; // ✅ safe fallback
    }
      const allBillings = await ctx.db.query("billing").collect();

    // sort by creation time (Convex docs have _creationTime by default)
    allBillings.sort((a, b) => a._creationTime - b._creationTime);

// find position in array = invoice number
    const invoiceNo =allBillings.findIndex((b) => b._id === billingDoc._id) + 1;


    // 2. Fetch design
    const design = await ctx.db.get(designId);
    if (!design) throw new Error("Design not found");

    // 3. Fetch request
    const request = await ctx.db.get(design.request_id);
    if (!request) throw new Error("Design request not found");

    // 4. Fetch request sizes
    const sizes = await ctx.db
      .query("request_sizes")
      .withIndex("by_request", (q) => q.eq("request_id", design.request_id))
      .collect();

    const totalShirts = sizes.reduce((sum, s) => sum + s.quantity, 0);

    // 5. Calculate fees
    const printingFee = request.print_type === "Sublimation" ? 550 : 500;

    const revisionCount = design.revision_count || 0;
    let revisionFee = 0;
    if (totalShirts >= 15) {
      revisionFee = revisionCount > 2 ? (revisionCount - 2) * 400 : 0;
    } else {
      revisionFee = revisionCount * 400;
    }

    const designerFee = totalShirts < 15 ? 400 : 0;

    const total = totalShirts * printingFee + revisionFee + designerFee;

    // 6. Return billing + breakdown
    return {
      ...billingDoc,
      createdAt: new Date(billingDoc._creationTime).toISOString(), // 👈 add this
      invoiceNo,
      breakdown: {
        shirtCount: totalShirts,
        printFee: printingFee,
        revisionFee,
        designerFee,
        total,
      },
    };
  },
});

export const getClientInfoByDesign = query({
  args: { designId: v.id("design") },
  handler: async (ctx, { designId }) => {
    // find the design
    const designDoc = await ctx.db.get(designId);
    if (!designDoc) return null;

    // get the client user
    const userDoc = await ctx.db.get(designDoc.client_id);
    if (!userDoc) return null;

    // get the client profile (phone + address)
    const clientProfile = await ctx.db
      .query("clients")
      .withIndex("by_user", (q) => q.eq("user_id", userDoc._id))
      .first();

    return {
      firstName: userDoc.firstName,
      lastName: userDoc.lastName,
      email: userDoc.email,
      phone: clientProfile?.phone ?? null,
      address: clientProfile?.address ?? null,
    };
  },
});


