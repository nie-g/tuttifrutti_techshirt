import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const getUrls = query({
  args: { storageIds: v.optional(v.array(v.id("_storage"))) },
  handler: async (ctx, args) => {
    if (!args.storageIds) {
      return [];
    }
    const urls = await Promise.all(
      args.storageIds.map((storageId) => ctx.storage.getUrl(storageId))
    );
    return urls.filter((url) => url !== null) as string[];
  },
});
