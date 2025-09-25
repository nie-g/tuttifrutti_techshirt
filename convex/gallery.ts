import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";

/* =========================
 *       QUERIES
 * ========================= */

// Get galleries for a designer
export const getByDesigner = query({
  args: { designerId: v.id("designers") },
  handler: async (ctx, { designerId }) => {
    return await ctx.db
      .query("galleries")
      .withIndex("by_designer", (q) => q.eq("designer_id", designerId))
      .collect();
  },
});

// Get preview URLs for storage IDs
export const getPreviewUrls = query({
  args: { storageIds: v.array(v.id("_storage")) },
  handler: async (ctx, { storageIds }) => {
    const urls: Record<string, string> = {};
    for (const id of storageIds) {
      if (!id) continue;
      const url = await ctx.storage.getUrl(id);
      if (url) {
        urls[id.toString()] = url;
      }
    }
    return urls;
  },
});

// Get images for a gallery
export const getImagesByGallery = query({
  args: { galleryId: v.id("galleries") },
  handler: async (ctx, { galleryId }) => {
    return await ctx.db
      .query("gallery_images")
      .withIndex("by_gallery", (q) => q.eq("gallery_id", galleryId))
      .collect();
  },
});

// Get all images grouped by designer
export const getImagesByDesigner = query({
  args: { designerId: v.id("designers") },
  handler: async (ctx, { designerId }) => {
    const galleries = await ctx.db
      .query("galleries")
      .withIndex("by_designer", (q) => q.eq("designer_id", designerId))
      .collect();

    const result: Record<string, any[]> = {};
    for (const gallery of galleries) {
      const images = await ctx.db
        .query("gallery_images")
        .withIndex("by_gallery", (q) => q.eq("gallery_id", gallery._id))
        .collect();
      result[gallery._id] = images;
    }
    return result;
  },
});

/* =========================
 *       MUTATIONS
 * ========================= */

// Add new gallery
export const addGallery = mutation({
  args: {
    designer_id: v.id("designers"),
    title: v.string(),
    caption: v.optional(v.string()),
  },
  handler: async (ctx, { designer_id, title, caption }) => {
    const now = Date.now();
    return await ctx.db.insert("galleries", {
      designer_id,
      title,
      caption,
      created_at: now,
    });
  },
});

// Add image record to gallery
export const addGalleryImage = mutation({
  args: { gallery_id: v.id("galleries"), image: v.id("_storage") },
  handler: async (ctx, { gallery_id, image }) => {
    const now = Date.now();
    return await ctx.db.insert("gallery_images", {
      gallery_id,
      image,
      created_at: now,
    });
  },
});

/* =========================
 *       ACTIONS
 * ========================= */

// Save image to Convex storage
export const saveGalleryImage = action({
  args: { galleryId: v.id("galleries"), image: v.bytes() },
  handler: async (ctx, { image }) => {
    const blob = new Blob([new Uint8Array(image)], { type: "image/png" });
    const storageId = await ctx.storage.store(blob);
    return storageId;
  },
});
