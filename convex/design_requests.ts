import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/* =========================
 *   Helper: format client
 * ========================= */
function formatClient(clientDoc: any) {
  if (!clientDoc) return null;
  return {
    _id: clientDoc._id,
    firstName: clientDoc.firstName ?? "",
    lastName: clientDoc.lastName ?? "",
    email: clientDoc.email ?? "",
    full_name:
      clientDoc.firstName || clientDoc.lastName
        ? `${clientDoc.firstName ?? ""} ${clientDoc.lastName ?? ""}`.trim()
        : clientDoc.full_name ?? "Unknown",
  };
}

/* =========================
 *          QUERIES
 * ========================= */

// Get all design requests
export const listAllRequests = query({
  args: {},
  handler: async (ctx) => {
    const requests = await ctx.db.query("design_requests").collect();

    return Promise.all(
      requests.map(async (req) => {
        const clientDoc = req.client_id ? await ctx.db.get(req.client_id) : null;

        // fetch linked sizes
        const sizes = await ctx.db
          .query("request_sizes")
          .withIndex("by_request", (q) => q.eq("request_id", req._id))
          .collect();

        // join with shirt_sizes
        const sizeDetails = await Promise.all(
          sizes.map(async (s) => {
            const sizeDoc = await ctx.db.get(s.size_id);
            return { ...s, size: sizeDoc };
          })
        );

        return {
          ...req,
          client: formatClient(clientDoc),
          sizes: sizeDetails,
        };
      })
    );
  },
});

// Get by ID
export const getById = query({
  args: { requestId: v.id("design_requests") },
  handler: async (ctx, { requestId }) => {
    const request = await ctx.db.get(requestId);
    if (!request) return null;

    const clientDoc = request.client_id
      ? await ctx.db.get(request.client_id)
      : null;

    const sizes = await ctx.db
      .query("request_sizes")
      .withIndex("by_request", (q) => q.eq("request_id", requestId))
      .collect();

    const sizeDetails = await Promise.all(
      sizes.map(async (s) => {
        const sizeDoc = await ctx.db.get(s.size_id);
        return { ...s, size: sizeDoc };
      })
    );

    return {
      ...request,
      client: formatClient(clientDoc),
      sizes: sizeDetails,
    };
  },
});

// Get requests by client
export const getRequestsByClient = query({
  args: { clientId: v.id("users") },
  handler: async (ctx, { clientId }) => {
    const requests = await ctx.db
      .query("design_requests")
      .filter((q) => q.eq(q.field("client_id"), clientId))
      .collect();

    return Promise.all(
      requests.map(async (req) => {
        const clientDoc = req.client_id ? await ctx.db.get(req.client_id) : null;

        const sizes = await ctx.db
          .query("request_sizes")
          .withIndex("by_request", (q) => q.eq("request_id", req._id))
          .collect();

        const sizeDetails = await Promise.all(
          sizes.map(async (s) => {
            const sizeDoc = await ctx.db.get(s.size_id);
            return { ...s, size: sizeDoc };
          })
        );

        return {
          ...req,
          client: formatClient(clientDoc),
          sizes: sizeDetails,
        };
      })
    );
  },
});

// Get requests by designer
export const getRequestsByDesigner = query({
  args: { designerId: v.id("users") },
  handler: async (ctx, { designerId }) => {
    const designs = await ctx.db
      .query("design")
      .filter((q) => q.eq(q.field("designer_id"), designerId))
      .collect();

    if (designs.length === 0) return [];

    const requests = await Promise.all(
      designs.map(async (design) => {
        const request = await ctx.db.get(design.request_id);
        if (!request) return null;

        const clientDoc = request.client_id
          ? await ctx.db.get(request.client_id)
          : null;

        const sizes = await ctx.db
          .query("request_sizes")
          .withIndex("by_request", (q) => q.eq("request_id", request._id))
          .collect();

        const sizeDetails = await Promise.all(
          sizes.map(async (s) => {
            const sizeDoc = await ctx.db.get(s.size_id);
            return { ...s, size: sizeDoc };
          })
        );

        return {
          ...request,
          designId: design._id,
          client: formatClient(clientDoc),
          sizes: sizeDetails,
        };
      })
    );

    return requests.filter(Boolean);
  },
});

/* =========================
 *         MUTATIONS
 * ========================= */

// Create new request with sizes
// Create new request with sizes
export const createRequest = mutation({
  args: {
    clientId: v.id("users"),
    requestTitle: v.string(),
    tshirtType: v.optional(v.string()),
    gender: v.optional(v.string()),
    sketch: v.optional(v.string()),
    description: v.optional(v.string()),
    textileId: v.id("inventory_items"),
    preferredDesignerId: v.optional(v.id("users")),
    // Use a union with the exact literals to match your schema's allowed values
    printType: v.optional(
      v.union(
        v.literal("Sublimation"),
        v.literal("Dtf")
      )
    ),
    sizes: v.array(
      v.object({
        sizeId: v.id("shirt_sizes"),
        quantity: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const requestId = await ctx.db.insert("design_requests", {
      client_id: args.clientId,
      request_title: args.requestTitle,
      tshirt_type: args.tshirtType || "",
      gender: args.gender || "",
      sketch: args.sketch || "",
      description: args.description || "",
      textile_id: args.textileId,
      preferred_designer_id: args.preferredDesignerId || undefined,
      // store print type in snake_case to match your schema
      print_type: args.printType ?? undefined,
      status: "pending",
      created_at: Date.now(),
    });

    // Insert sizes
    await Promise.all(
      args.sizes.map((s) =>
        ctx.db.insert("request_sizes", {
          request_id: requestId,
          size_id: s.sizeId,
          quantity: s.quantity,
          created_at: Date.now(),
        })
      )
    );

    // Notify admins
    const client = await ctx.db.get(args.clientId);
    const clientName = client
      ? `${client.firstName} ${client.lastName}`
      : "A client";

    const admins = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .collect();

    const recipients = admins.map((admin) => ({
      userId: admin._id,
      userType: "admin" as const,
    }));

    await ctx.runMutation(api.notifications.createNotificationForMultipleUsers, {
      recipients,
      message: `${clientName} has submitted a new design request: "${args.requestTitle}"`,
    });

    return requestId;
  },
});

export const getRequestsByIds = query({
  args: { ids: v.array(v.id("design_requests")) },
  handler: async (ctx, { ids }) => {
    const requests = await Promise.all(ids.map((id) => ctx.db.get(id)));

    return Promise.all(
      requests.map(async (req) => {
        if (!req) return null;

        const clientDoc = req.client_id ? await ctx.db.get(req.client_id) : null;

        const sizes = await ctx.db
          .query("request_sizes")
          .withIndex("by_request", (q) => q.eq("request_id", req._id))
          .collect();

        const sizeDetails = await Promise.all(
          sizes.map(async (s) => {
            const sizeDoc = await ctx.db.get(s.size_id);
            return { ...s, size: sizeDoc };
          })
        );

        return {
          ...req,
          client: formatClient(clientDoc),
          sizes: sizeDetails,
          printType: req.print_type ?? undefined, // normalize snake_case
        };
      })
    );
  },
});
