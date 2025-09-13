// convex/designReferences.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

/* -------------------------
   Queries
------------------------- */

// Get all design references for a specific request
export const getByRequestId = query({
  args: { requestId: v.id("design_requests") },
  handler: async (ctx, { requestId }) => {
    const references = await ctx.db
      .query("design_reference")
      .filter((q) => q.eq(q.field("request_id"), requestId))
      .order("desc")
      .collect();

    return references;
  },
});

/* -------------------------
   Mutations
------------------------- */

// Save a single design reference
export const saveReference = mutation({
  args: {
    requestId: v.id("design_requests"),
    designImage: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { requestId, designImage, description }) => {
    // Validate request exists
    const request = await ctx.db.get(requestId);
    if (!request) {
      throw new Error("Design request not found");
    }

    // Create reference
    const referenceId: Id<"design_reference"> = await ctx.db.insert(
      "design_reference",
      {
        request_id: requestId,
        design_image: designImage,
        description: description ?? "",
        created_at: Date.now(),
      }
    );

    return referenceId;
  },
});

// Save multiple design references
export const saveMultipleReferences = mutation({
  args: {
    requestId: v.id("design_requests"),
    references: v.array(
      v.object({
        designImage: v.string(),
        description: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, { requestId, references }) => {
    // Validate request exists
    const request = await ctx.db.get(requestId);
    if (!request) {
      throw new Error("Design request not found");
    }

    // Insert references
    const referenceIds: Id<"design_reference">[] = [];
    for (const ref of references) {
      const referenceId = await ctx.db.insert("design_reference", {
        request_id: requestId,
        design_image: ref.designImage,
        description: ref.description ?? "",
        created_at: Date.now(),
      });
      referenceIds.push(referenceId);
    }

    return referenceIds;
  },
});

// Delete a design reference
export const deleteReference = mutation({
  args: { referenceId: v.id("design_reference") },
  handler: async (ctx, { referenceId }) => {
    const reference = await ctx.db.get(referenceId);
    if (!reference) {
      throw new Error("Design reference not found");
    }

    await ctx.db.delete(referenceId);
    return { success: true };
  },
});
