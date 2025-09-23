// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    role: v.union(v.literal("client"), v.literal("designer"), v.literal("admin")),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),
  
  clients: defineTable({
    user_id: v.id("users"),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    bio: v.optional(v.string()),
    created_at: v.number(),
  }).index("by_user", ["user_id"]),

  // --- DESIGNERS ---
  designers: defineTable({
    user_id: v.id("users"),
    portfolio_id: v.optional(v.id("portfolios")),
    specialization: v.optional(v.string()),
    bio: v.optional(v.string()),
    contact_number: v.optional(v.string()),
    address: v.optional(v.string()),
    created_at: v.number(),
  }).index("by_user", ["user_id"]),

  // --- ADMINS ---
  admins: defineTable({
    user_id: v.id("users"),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
    created_at: v.number(),
  }).index("by_user", ["user_id"]),

  // --- PORTFOLIOS ---
  portfolios: defineTable({
    designer_id: v.id("designers"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    created_at: v.number(),
  }).index("by_designer", ["designer_id"]),

  galleries: defineTable({
    portfolio_id: v.id("portfolios"),
    image_url: v.string(),
    caption: v.optional(v.string()),
    created_at: v.number(),
  }).index("by_portfolio", ["portfolio_id"]),

  invites: defineTable({
    email: v.string(),
    token: v.string(),
    expiresAt: v.number(),
    used: v.boolean(),
    createdAt: v.number(),
  }),

  notifications: defineTable({
    recipient_user_id: v.id("users"),
    recipient_user_type: v.union(
      v.literal("admin"),
      v.literal("designer"),
      v.literal("client")
    ),
    notif_content: v.string(),
    created_at: v.optional(v.number()),
    is_read: v.optional(v.boolean()),
  }),

  selected_colors: defineTable({
    request_id: v.id("design_requests"),
    hex: v.string(),
    created_at: v.optional(v.number()),
  }),

  shirt_sizes: defineTable({
    size_label: v.string(),
    w: v.number(),
    h: v.number(),
    type: v.union(
      v.literal("jersey"),
      v.literal("polo"),
      v.literal("tshirt"),
      v.literal("long sleeves")
    ),
    sleeves_w: v.optional(v.number()),
    sleeves_h: v.optional(v.number()),
    category: v.union(v.literal("kids"), v.literal("adult")),
    created_at: v.optional(v.number()),
  }),

  shirt_types: defineTable({
    type_name: v.string(),
    description: v.optional(v.string()),
    created_at: v.optional(v.number()),
  }),

  // --- DESIGN REQUESTS (UPDATED) ---
  design_requests: defineTable({
    client_id: v.id("users"),
    size_id: v.id("shirt_sizes"),
    request_title: v.string(),
    tshirt_type: v.optional(v.string()),
    gender: v.optional(v.string()),
    sketch: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    textile_id: v.id("inventory_items"), // 🔗 linked to inventory items (required textile)
    preferred_designer_id: v.optional(v.id("users")), // 🔗 optional preferred designer
    created_at: v.optional(v.number()),
  }),

  design_reference: defineTable({
    design_image: v.string(),
    description: v.optional(v.string()),
    request_id: v.id("design_requests"),
    created_at: v.optional(v.number()),
  }),

  design_templates: defineTable({
    template_image: v.string(),
    template_name: v.string(),
    shirt_type_id: v.id("shirt_types"),
    created_at: v.optional(v.number()),
  }),

  design: defineTable({
    client_id: v.id("users"),
    designer_id: v.id("users"),
    request_id: v.id("design_requests"),
    status: v.union(
      v.literal("in_progress"),
      v.literal("finished"),
      v.literal("billed"),
      v.literal("approved")
    ),
    preview_image: v.optional(v.string()),
    source_files: v.optional(v.array(v.string())),
    deadline: v.optional(v.string()),
    created_at: v.optional(v.number()),
  }).index("by_request", ["request_id"]),

  design_preview: defineTable({
    design_id: v.id("design"),
    preview_image: v.id("_storage"),
    created_at: v.optional(v.number()),
  }).index("by_design", ["design_id"]),

  fabric_canvases: defineTable({
    design_id: v.id("design"),
    canvas_json: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    version: v.optional(v.string()),
    images: v.optional(v.array(v.id("_storage"))),
    created_at: v.number(),
    updated_at: v.number(),
  }).index("by_design", ["design_id"]),

  inventory_categories: defineTable({
    category_name: v.string(),
    description: v.optional(v.string()),
    created_at: v.optional(v.number()),
  }).index("by_name", ["category_name"]),

  inventory_items: defineTable({
    name: v.string(),
    category_id: v.id("inventory_categories"),
    unit: v.string(),
    stock: v.number(),
    reorder_level: v.optional(v.number()),
    description: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_category", ["category_id"]),

  comments: defineTable({
    preview_id: v.id("design_preview"),
    user_id: v.id("users"),
    comment: v.string(),
    created_at: v.number(),
  })
    .index("by_preview", ["preview_id"])
    .index("by_user", ["user_id"]),
});
