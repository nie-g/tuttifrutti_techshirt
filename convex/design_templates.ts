// convex/design_templates.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

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
export const migrateTemplates = mutation({
  args: { defaultShirtTypeId: v.id("shirt_types") }, // 👈 required shirt_type_id
  handler: async (ctx, { defaultShirtTypeId }) => {
    console.log("Starting design_templates migration...");

    try {
      const existingTemplates = await ctx.db.query("design_templates").collect();
      console.log(`Found ${existingTemplates.length} templates`);

      const templatesNeedingMigration = existingTemplates.filter((t: any) =>
        "designer_id" in t
      );

      if (templatesNeedingMigration.length === 0) {
        return {
          success: true,
          message: "No templates need migration",
          migratedCount: 0,
          totalCount: existingTemplates.length,
        };
      }

      const migratedIds: { oldId: Id<"design_templates">; newId: Id<"design_templates"> }[] = [];

      for (const template of templatesNeedingMigration) {
        try {
          const newId = await ctx.db.insert("design_templates", {
            template_name: template.template_name || "Unnamed Template",
            template_image: template.template_image || "",
            created_at: template.created_at || Date.now(),
            shirt_type_id: defaultShirtTypeId, // 👈 required field
          });

          migratedIds.push({ oldId: template._id, newId });
        } catch (err) {
          console.error(`Error migrating template ${template._id}:`, err);
        }
      }

      for (const { oldId } of migratedIds) {
        try {
          await ctx.db.delete(oldId);
        } catch (err) {
          console.error(`Error deleting old template ${oldId}:`, err);
        }
      }

      return {
        success: true,
        message: `Migrated ${migratedIds.length} templates`,
        migratedCount: migratedIds.length,
        totalCount: existingTemplates.length,
      };
    } catch (err: any) {
      console.error("Migration error:", err);
      return { success: false, error: err.message };
    }
  },
});

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
export const create = mutation({
  args: {
    designerId: v.optional(v.string()), // kept for backward compatibility
    templateName: v.string(),
    templateImage: v.string(),
    shirtTypeId: v.id("shirt_types"), // 👈 required
  },
  handler: async (ctx, { templateName, templateImage, shirtTypeId }) => {
    try {
      const id = await ctx.db.insert("design_templates", {
        template_name: templateName,
        template_image: templateImage,
        created_at: Date.now(),
        shirt_type_id: shirtTypeId, // 👈 required field
      });
      return id;
    } catch (err: any) {
      console.error("Error creating template:", err);
      throw new Error("Failed to create template: " + err.message);
    }
  },
});

// ============================
// Update template
// ============================
export const update = mutation({
  args: {
    templateId: v.id("design_templates"),
    templateName: v.optional(v.string()),
    templateImage: v.optional(v.string()),
    shirtTypeId: v.optional(v.id("shirt_types")), // 👈 allow updating type
  },
  handler: async (ctx, { templateId, templateName, templateImage, shirtTypeId }) => {
    const template = await ctx.db.get(templateId);
    if (!template) throw new Error("Template not found");

    const updateFields: any = {};
    if (templateName !== undefined) updateFields.template_name = templateName;
    if (templateImage !== undefined) updateFields.template_image = templateImage;
    if (shirtTypeId !== undefined) updateFields.shirt_type_id = shirtTypeId;

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
    const template = await ctx.db.get(templateId);
    if (!template) throw new Error("Template not found");

    await ctx.db.delete(templateId);
    return { success: true };
  },
});
