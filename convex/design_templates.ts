// convex/design_templates.ts
import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

// ============================
// Get all design templates
// ============================
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("design_templates").collect();
  },
});

export const getDesignTemplates = query({
  args: {
    shirtType: v.optional(v.string()), // e.g. "Round Neck tshirt"
  },
  handler: async ({ db }, { shirtType }) => {
    // fetch all templates
    const templates = await db.query("design_templates").collect();

    // expand with shirt_type name
    const expanded = await Promise.all(
      templates.map(async (t) => {
        const shirtTypeDoc = await db.get(t.shirt_type_id);
        return {
          ...t,
          shirt_type_name: shirtTypeDoc?.type_name ?? null,
        };
      })
    );

    // filter if shirtType is provided
    if (shirtType) {
      return expanded.filter(
        (t) => t.shirt_type_name?.toLowerCase() === shirtType.toLowerCase()
      );
    }

    return expanded;
  },
});


// ============================
// Migration (for old schema with designer_id)
// ============================


// ============================
// (Legacy) Get by designerId
// ============================
export const getByDesigner = query({
  args: { designerId: v.optional(v.string()) },
  handler: async (ctx) => {
    try {
      const allTemplates = await ctx.db.query("design_templates").collect();
      console.log(`Returning ${allTemplates.length} templates (designer association removed)`);
      return allTemplates;
    } catch (err) {
      console.error("Error fetching templates:", err);
      return [];
    }
  },
});

// ============================
// Create new template
// ============================


// ============================
// Update template
// ============================
export const updateDesignTemplate = action({
  args: {
    templateId: v.id("design_templates"),
    templateName: v.optional(v.string()),
    shirtTypeId: v.optional(v.id("shirt_types")),
    templateImage: v.optional(v.bytes()), // optional image update
  },
  handler: async (ctx, args): Promise<string> => {
    const { templateId, templateName, shirtTypeId, templateImage } = args;

    let storageId: Id<"_storage"> | undefined = undefined;

    // Only upload new image if provided
    if (templateImage !== undefined) {
      const blob = new Blob([new Uint8Array(templateImage)], { type: "image/png" });
      storageId = await ctx.storage.store(blob);
    }

    // Run the mutation to update DB record
    return await ctx.runMutation(api.design_templates.updateTemplateMutation, {
      templateId,
      templateName,
      shirtTypeId,
      templateImage: storageId,
    });
  },
});

export const updateTemplateMutation = mutation({
  args: {
    templateId: v.id("design_templates"),
    templateName: v.optional(v.string()),
    shirtTypeId: v.optional(v.id("shirt_types")),
    templateImage: v.optional(v.id("_storage")),
  },
  handler: async (ctx, { templateId, templateName, shirtTypeId, templateImage }) => {
    const template = await ctx.db.get(templateId);
    if (!template) throw new Error("Template not found");

    const updateFields: Record<string, any> = {};

    if (templateName !== undefined) updateFields.template_name = templateName;
    if (shirtTypeId !== undefined) updateFields.shirt_type_id = shirtTypeId;
    if (templateImage !== undefined) updateFields.template_image = templateImage;

    if (Object.keys(updateFields).length === 0)
      throw new Error("No fields provided to update");

    await ctx.db.patch(templateId, updateFields);
    return templateId;
  },
});


// ============================
// Delete template
// ============================
export const remove = mutation({
  args: { templateId: v.id("design_templates") },
  handler: async (ctx, { templateId }) => {
    // 1️⃣ Fetch the template record
    const template = await ctx.db.get(templateId);
    if (!template) throw new Error("Template not found");

    // 2️⃣ Delete associated image from Convex storage (if exists)
    if (template.template_image) {
      try {
        await ctx.storage.delete(template.template_image);
      } catch (err) {
        console.warn("⚠️ Failed to delete template image from storage:", err);
      }
    }

    // 3️⃣ Delete the DB record
    await ctx.db.delete(templateId);

    // 4️⃣ Return success confirmation
    return { success: true, deletedId: templateId };
  },
});

// Action: Handles file upload + DB record creation
export const saveDesignTemplate = action({
  args: {
    designerId: v.optional(v.string()), // kept for backward compatibility
    templateName: v.string(),
    shirtTypeId: v.id("shirt_types"),
    templateImage: v.bytes(), // renamed for schema consistency
  },
  handler: async (ctx, args): Promise<string> => {
    // 1. Convert ArrayBuffer → Blob
    const blob = new Blob([new Uint8Array(args.templateImage)], { type: "image/png" });

    // 2. Upload to Convex storage
    const storageId = await ctx.storage.store(blob);

    // 3. Insert record into design_templates
    const docId = await ctx.runMutation(api.design_templates.insertDesignTemplate, {
      shirtTypeId: args.shirtTypeId,
      templateName: args.templateName,
      templateImage: storageId,
    });

    return docId;
  },
});

// Mutation: Inserts into the design_templates table
export const insertDesignTemplate = mutation({
  args: {
    shirtTypeId: v.id("shirt_types"),
    templateName: v.string(),
    templateImage: v.id("_storage"),
  },
  handler: async (ctx, args): Promise<string> => {
    const now = Date.now();

    return await ctx.db.insert("design_templates", {
      shirt_type_id: args.shirtTypeId,
      template_name: args.templateName,
      template_image: args.templateImage,
      created_at: now,
    });
  },
});
