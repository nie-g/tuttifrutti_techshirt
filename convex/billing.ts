import { query } from "./_generated/server";
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
