import { query } from "./_generated/server";
import { v } from "convex/values";

export const getPreviewUrls = query({
  args: { storageIds: v.array(v.id("_storage")) },
  handler: async (ctx, { storageIds }) => {
    return await Promise.all(
      storageIds.map(async (id) => {
        if (!id) return null;
        return await ctx.storage.getUrl(id); // ✅ returns pre-signed URL
      })
    );
  },
});
