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
    description: v.optional(v.string()),
    textileId: v.id("inventory_items"),
    preferredDesignerId: v.optional(v.id("users")),
    printType: v.optional(
      v.union(v.literal("Sublimation"), v.literal("Dtf"))
    ),
    sizes: v.array(
      v.object({
        sizeId: v.id("shirt_sizes"),
        quantity: v.number(),
      })
    ),
    preferredDate: v.optional(v.string()), // ✅ Add preferred date
  },
  handler: async (ctx, args) => {
    // --- 1. Insert the request ---
    const requestId = await ctx.db.insert("design_requests", {
      client_id: args.clientId,
      request_title: args.requestTitle,
      tshirt_type: args.tshirtType || "",
      gender: args.gender || "",
      description: args.description || "",
      textile_id: args.textileId,
      preferred_designer_id: args.preferredDesignerId || undefined,
      print_type: args.printType ?? undefined,
      preferred_date: args.preferredDate || undefined, // ✅ Save preferred date
      status: "pending",
      created_at: Date.now(),
    });

    // --- 2. Insert sizes ---
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

    // --- 3. Check fabric stock ---
    const fabricItem = await ctx.db.get(args.textileId);
    if (!fabricItem) throw new Error("Selected fabric not found in inventory");

    // Yard per size lookup
    const yardPerSize: Record<string, number> = {
      XS: 0.8,
      S: 1.0,
      M: 1.2,
      L: 1.4,
      XL: 1.6,
      XXL: 1.8,
    };

    // Fetch shirt sizes once
    const sizeMap: Record<string, string> = {};
    for (const s of args.sizes) {
      const shirtSize = await ctx.db.get(s.sizeId);
      if (shirtSize) sizeMap[s.sizeId] = shirtSize.size_label;
    }

    // Calculate total yards needed
    let totalYardsNeeded = 0;
    for (const s of args.sizes) {
      const sizeLabel = sizeMap[s.sizeId] ?? "M";
      totalYardsNeeded += s.quantity * (yardPerSize[sizeLabel] ?? 1.2);
    }

    // --- 4. If not enough fabric, notify client ---
    if (totalYardsNeeded > fabricItem.stock) {
      await ctx.db.insert("notifications", {
        recipient_user_id: args.clientId,
        recipient_user_type: "client",
        notif_content: `Warning: Your order "${args.requestTitle}" may be delayed for at least 7 days due to insufficient stock of fabric that you have chosen.`,
        created_at: Date.now(),
        is_read: false,
      });
    }

    // --- 5. Notify admins of new request ---
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

// convex/design_requests.ts
export const assignDesignRequest = mutation({
  args: {
    requestId: v.id("design_requests"),
    designerId: v.id("users"),
  },
  handler: async (ctx, { requestId, designerId }) => {
    const request = await ctx.db.get(requestId);
    if (!request) throw new Error("Request not found");

    // Fetch the selected textile/fabric
    const fabricItem = await ctx.db.get(request.textile_id);
    if (!fabricItem) throw new Error("Fabric not found in inventory");

    // Fetch all request sizes
    const sizes = await ctx.db
      .query("request_sizes")
      .withIndex("by_request", (q) => q.eq("request_id", requestId))
      .collect();

    // Yard per size lookup
    const yardPerSize: Record<string, number> = {
      XS: 0.8,
      S: 1.0,
      M: 1.2,
      L: 1.4,
      XL: 1.6,
      XXL: 1.8,
    };

    // Fetch shirt size labels
    const sizeMap: Record<string, string> = {};
    for (const s of sizes) {
      const sizeDoc = await ctx.db.get(s.size_id);
      if (sizeDoc) sizeMap[s.size_id] = sizeDoc.size_label;
    }

    // Calculate total yards needed
    let totalYardsNeeded = 0;
    for (const s of sizes) {
      const sizeLabel = sizeMap[s.size_id] ?? "M";
      totalYardsNeeded += s.quantity * (yardPerSize[sizeLabel] ?? 1.2);
    }

    // --- 🧵 If fabric stock is insufficient, notify client
    if (totalYardsNeeded > fabricItem.stock) {
      await ctx.db.insert("notifications", {
        recipient_user_id: request.client_id,
        recipient_user_type: "client",
        notif_content: `Heads up: Your order "${request.request_title}" has now been aprroved. However, production will be delayed due to insufficient stock of the chosen fabric. We’re sourcing additional yards to fulfill your request.`,
        created_at: Date.now(),
        is_read: false,
      });
    }else{ 
       await ctx.db.insert("notifications", {
        recipient_user_id: request.client_id,
        recipient_user_type: "client",
        notif_content: `Your order "${request.request_title}" has been approved and been assigned to a designer`,
        created_at: Date.now(),
        is_read: false,
      });
    }

    // --- 1. Approve & assign the request
    await ctx.db.patch(requestId, {
      preferred_designer_id: designerId,
      status: "approved",
    });

    // --- 2. Create design entry
    const now = Date.now();
    const designId = await ctx.db.insert("design", {
      client_id: request.client_id,
      designer_id: designerId,
      request_id: requestId,
      revision_count: 0,
      status: "in_progress",
      created_at: now,
      deadline: request.preferred_date ?? undefined,
    });

    // --- 3. Create fabric canvas
    await ctx.db.insert("fabric_canvases", {
      design_id: designId,
      canvas_json: "",
      thumbnail: undefined,
      version: "1.0.0",
      images: [],
      created_at: now,
      updated_at: now,
    });

    // --- 4. Notify designer
    await ctx.runMutation(api.notifications.createNotification, {
      userId: designerId,
      userType: "designer",
      message: `You’ve been assigned a new design request: "${request.request_title}"`,
    });

    return { success: true, designId };
  },
});

export const updateDesignRequestStatus = mutation({
  args: {
    requestId: v.id("design_requests"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("declined"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, { requestId, status }) => {
    const request = await ctx.db.get(requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    await ctx.db.patch(requestId, { status });

    return { success: true };
  },
});

// convex/design_requests.ts
export const cancelDesignRequest = mutation({
  args: {
    request_id: v.id("design_requests"),
    client_id: v.id("users"),
  },
  handler: async (ctx, { request_id, client_id }) => {
    const request = await ctx.db.get(request_id);
    if (!request) {
      throw new Error("Request not found");
    }

    // Ensure only the owner can cancel
    if (request.client_id !== client_id) {
      throw new Error("Unauthorized: You cannot cancel this request");
    }

    // Mark as rejected
    await ctx.db.patch(request_id, { status: "cancelled" });

    // Optional: notify admins or designers
    await ctx.runMutation(api.notifications.createNotificationForMultipleUsers, {
      recipients: [
        { userId: client_id, userType: "client" as const },
      ],
      message: `Your request "${request.request_title}" has been cancelled.`,
    });

    return { success: true };
  },
});


export const rejectDesignRequestWithReason = mutation({
  args: {
    requestId: v.id("design_requests"),
    reason: v.string(),
  },
  handler: async (ctx, { requestId, reason }) => {
    const request = await ctx.db.get(requestId);
    if (!request) throw new Error("Request not found");

    // Update request status
    await ctx.db.patch(requestId, { status: "declined" });

    // Notify client
    await ctx.db.insert("notifications", {
      recipient_user_id: request.client_id,
      recipient_user_type: "client",
      notif_content: `Your design request "${request.request_title}" was rejected. Reason: ${reason}`,
      created_at: Date.now(),
      is_read: false,
    });

    return { success: true };
  },
});


export const getFullRequestDetails = query({
  args: { requestId: v.id("design_requests") },
  handler: async (ctx, { requestId }) => {
    // --- Fetch the main design request ---
    const request = await ctx.db.get(requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    // --- Linked client ---
    const client = request.client_id
      ? await ctx.db.get(request.client_id)
      : null;

    // --- Linked fabric/textile ---
    const fabric = request.textile_id
      ? await ctx.db.get(request.textile_id)
      : null;

    // --- Selected colors ---
    const colors = await ctx.db
      .query("selected_colors")
       .filter((q) => q.eq(q.field("request_id"), request._id))
      .collect();

    // --- Sizes (join request_sizes -> shirt_sizes) ---
    const reqSizes = await ctx.db
      .query("request_sizes")
      .withIndex("by_request", (q) => q.eq("request_id", request._id))
      .collect();

    const sizes = (
      await Promise.all(
        reqSizes.map(async (rs) => {
          const size = await ctx.db.get(rs.size_id);
          return size
            ? { size_label: size.size_label, quantity: rs.quantity }
            : null;
        })
      )
    ).filter(
      (r): r is { size_label: string; quantity: number } => r !== null
    );

    // --- Return aggregated data ---
    return {
      request,
      client,
      fabric,
      colors,
      sizes,
    };
  },
});
