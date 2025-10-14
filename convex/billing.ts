import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getBillingBreakdown = query({
  args: { designId: v.id("design") },
  handler: async (ctx, { designId }) => {

    const billingDoc = await ctx.db
    .query("billing")
    .withIndex("by_design", (q) => q.eq("design_id", designId))
    .first();

    const design = await ctx.db.get(designId);
    if (!design) throw new Error("Design not found");

    // Get request
    const request = await ctx.db.get(design.request_id);
    if (!request) throw new Error("Design request not found");

    // Get all request_sizes linked to this request

    // Total shirts
    // Printing fee (based on print_type from request)
    
    return {
      shirtCount: billingDoc?.total_shirts ?? 0,
      printFee: billingDoc?.printing_fee ?? 0,
      revisionFee: billingDoc?.revision_fee ?? 0,
      designerFee: billingDoc?.designer_fee ?? 0,
      total: billingDoc?.starting_amount ?? 0,
    };
  },
});

export const approveBill = mutation({
  args: { designId: v.id("design") },
  handler: async (ctx, { designId }) => {
    // --- Find the billing record linked to this design ---
    const billingDoc = await ctx.db
      .query("billing")
      .withIndex("by_design", (q) => q.eq("design_id", designId))
      .first();

    if (!billingDoc) {
      throw new Error("No billing record found for this design");
    }

    // --- Determine final amount ---
    const finalAmount =
      billingDoc.final_amount && billingDoc.final_amount > 0
        ? billingDoc.final_amount
        : billingDoc.starting_amount;

    // --- Update billing status and amount ---
    await ctx.db.patch(billingDoc._id, {
      status: "approved",
      final_amount: finalAmount,
      created_at: Date.now(),
    });

    return { success: true, billingId: billingDoc._id, finalAmount };
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
    allBillings.sort((a, b) => a._creationTime - b._creationTime);

    // invoice number = index in creation order
    const invoiceNo = allBillings.findIndex((b) => b._id === billingDoc._id) + 1;

    // 2. Fetch design
    const design = await ctx.db.get(designId);
    if (!design) throw new Error("Design not found");

    // 3. Fetch request
    const request = await ctx.db.get(design.request_id);
    if (!request) throw new Error("Design request not found");

 

    // 6. Fetch designer profile (from designers table)
    const designerProfile = await ctx.db
      .query("designers")
      .withIndex("by_user", (q) => q.eq("user_id", design.designer_id))
      .unique();

    if (!designerProfile) throw new Error("Designer profile not found");
    // 7. Fetch designer pricing
  

   

    // 9. Return billing + breakdown
    return {
      ...billingDoc,
      createdAt: new Date(billingDoc._creationTime).toISOString(),
      invoiceNo,
      breakdown: {
      shirtCount: billingDoc?.total_shirts ?? 0,
      printFee: billingDoc?.printing_fee ?? 0,
      revisionFee: billingDoc?.revision_fee ?? 0,
      designerFee: billingDoc?.designer_fee ?? 0,
      total: billingDoc?.starting_amount ?? 0,
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

export const submitNegotiation = mutation({
  args: { designId: v.id("design"), newAmount: v.number() },
  handler: async (ctx, { designId, newAmount }) => {
    const billing = await ctx.db
      .query("billing")
      .withIndex("by_design", (q) => q.eq("design_id", designId))
      .first();

    if (!billing) throw new Error("Billing not found");

    const rounds = billing.negotiation_rounds ?? 0;
    if (rounds >= 5) {
      throw new Error("Maximum negotiation rounds reached (5).");
    }

    // Who’s negotiating
    const identity = await ctx.auth.getUserIdentity();
   const userDoc = identity
    ? await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first()
    : null;


    const newEntry = {
      amount: newAmount,
      date: Date.now(),
      added_by: userDoc?._id, // 👈 correct schema field
    };

    const updatedHistory = billing.negotiation_history
      ? [...billing.negotiation_history, newEntry]
      : [newEntry];

    await ctx.db.patch(billing._id, {
      negotiation_history: updatedHistory,
      final_amount: 0,
      negotiation_rounds: rounds + 1,
      status: "pending",
    });

    return { success: true, negotiation: newEntry };
  },
});

export const UpdateFinalAmount = mutation({
  args: { billingId: v.id("billing"), finalAmount: v.number() },
  handler: async (ctx, { billingId, finalAmount }) => {
    const billing = await ctx.db.get(billingId);
    if (!billing) throw new Error("Billing not found");

    await ctx.db.patch(billingId, {
      final_amount: finalAmount,
      status: "billed",
    });

    return { success: true };
  },
});

export const listAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("billing").collect();
  },
});