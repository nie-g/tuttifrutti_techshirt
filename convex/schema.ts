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
    created_at: v.number(),
  }).index("by_user", ["user_id"]),

  // --- DESIGNERS ---
  designers: defineTable({
    user_id: v.id("users"),
    portfolio_id: v.optional(v.id("portfolios")),
    
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

    // new fields
    skills: v.optional(v.array(v.string())), // e.g. ["Photoshop", "Illustrator", "3D Design"]
    specialization: v.optional(v.string()),
    social_links: v.optional(
      v.array(
        v.object({
          platform: v.string(), // e.g. "Behance", "LinkedIn"
          url: v.string(),
        })
      )
    ),

    created_at: v.number(),
  }).index("by_designer", ["designer_id"]),

  // --- RATINGS & FEEDBACK ---
  ratings_feedback: defineTable({
  portfolio_id: v.id("portfolios"), // connect to portfolio
  design_id: v.id("design"),        // 🔗 connect to a design (new)
  reviewer_id: v.id("users"),       // who gave the rating
  rating: v.number(),               // numeric rating, e.g. 1-5
  feedback: v.optional(v.string()), // written review
  created_at: v.number(),
})
  .index("by_portfolio", ["portfolio_id"])
  .index("by_reviewer", ["reviewer_id"])
  .index("by_design", ["design_id"]),   // ✅ ensures fast lookup & uniqueness

  galleries: defineTable({
    designer_id: v.id("designers"),   // ✅ linked to designers
    title: v.string(),                // ✅ replaces image_url
    caption: v.optional(v.string()),
    created_at: v.number(),
  }).index("by_designer", ["designer_id"]),

  // === Gallery Images Table ===
  gallery_images: defineTable({
    gallery_id: v.id("galleries"),    // ✅ reference to parent gallery
    image: v.id("_storage"),  // ✅ Convex storage file 
    created_at: v.number(),
  }).index("by_gallery", ["gallery_id"]),

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
    request_title: v.string(),
    tshirt_type: v.optional(v.string()),
    gender: v.optional(v.string()),
    sketch: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    textile_id: v.id("inventory_items"),
    preferred_designer_id: v.optional(v.id("users")),
    print_type: v.optional(
    v.union(
      v.literal("Sublimation"),
      v.literal("Dtf") // direct-to-garment
    )
  ),
    created_at: v.optional(v.number()),
  }),

  // --- NEW: sizes per request ---
  request_sizes: defineTable({
    request_id: v.id("design_requests"), // link to request
    size_id: v.id("shirt_sizes"),        // link to shirt size
    quantity: v.number(),                // how many shirts of this size
    created_at: v.optional(v.number()),
  })
    .index("by_request", ["request_id"])
    .index("by_size", ["size_id"]),

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
    revision_count:v.number(),
    request_id: v.id("design_requests"),
    status: v.union(
      v.literal("in_progress"),
      v.literal("pending_revision"),
      v.literal("finished"),
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
    // --- BILLING ---
    billing: defineTable({
    starting_amount: v.number(),
    final_amount: v.number(),
    negotiation_history: v.optional(
      v.array(
        v.object({
          amount: v.number(),        // the offered amount
          date: v.number(),          // store as timestamp (ms since epoch)
          added_by: v.optional(v.id("users")), // optional: track who made the entry
        })
      )
    ),
    negotiation_rounds: v.number(),
    status: v.union(
      v.literal("billed"),
      v.literal("pending"),
      v.literal("approved")
    ),
    client_id: v.id("users"),    // 🔄 client who pays
    design_id: v.id("design"),   // 🔄 linked design
    designer_id: v.id("users"),  // 🔄 designer who created
    created_at: v.number(),
  })
    .index("by_client", ["client_id"])
    .index("by_designer", ["designer_id"])
    .index("by_design", ["design_id"]),
    designer_pricing: defineTable({
    designer_id: v.id("designers"), // 🔗 linked to designers table
    normal_amount: v.number(),      // regular price
    promo_amount: v.optional(v.number()), // discounted/promo price
    description: v.optional(v.string()), // e.g. "Logo Design", "Full Shirt Design"
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_designer", ["designer_id"])
    .index("by_normal_amount", ["normal_amount"])
    .index("by_promo_amount", ["promo_amount"]),

// --- INVOICES ---

  
});

