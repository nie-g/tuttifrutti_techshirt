// convex/mutations/designNotifications.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const notifyClientDesignUpdate = mutation({
  args: { designId: v.id("design") },
  handler: async (ctx, { designId }) => {
    const design = await ctx.db.get(designId);
    if (!design) throw new Error("Design not found");

    const clientId = design.client_id;
    if (!clientId) throw new Error("Design has no associated client");

    // 1. Update design status
    await ctx.db.patch(designId, { status: "in_progress" });

    // 2. Send notification
    await ctx.db.insert("notifications", {
      recipient_user_id: clientId,
      recipient_user_type: "client",
      notif_content: `Your design "${design._id}" has a new update from the designer.`,
      created_at: Date.now(),
      is_read: false,
    });

    return { success: true };
  },
});
