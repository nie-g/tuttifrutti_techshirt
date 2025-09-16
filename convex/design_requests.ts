// convex/design_requests.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/* =========================
 *          QUERIES
 * ========================= */

// Get all design requests
export const listAllRequests = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("design_requests").collect();
  },
});

export const getById = query({
  args: { requestId: v.id("design_requests") },
  handler: async (ctx, { requestId }) => {
    const request = await ctx.db.get(requestId);
    if (!request) return null;

    // Join client
    const client = request.client_id
      ? await ctx.db.get(request.client_id)
      : null;

    // Join size
    const size = request.size_id
      ? await ctx.db.get(request.size_id)
      : null;

    return {
      ...request,
      client,
      size,
    };
  },
});

// Get requests by client
export const getRequestsByClient = query({
  args: { clientId: v.id("users") },
  handler: async (ctx, { clientId }) => {
    return await ctx.db
      .query("design_requests")
      .filter((q) => q.eq(q.field("client_id"), clientId))
      .collect();
  },
});

// Get requests by designer (via linked documents in "design")
export const getRequestsByDesigner = query({
  args: { designerId: v.id("users") },
  handler: async (ctx, { designerId }) => {
    // Find designs created by this designer
    const designs = await ctx.db
      .query("design")
      .filter((q) => q.eq(q.field("designer_id"), designerId))
      .collect();

    if (designs.length === 0) return [];

    // Fetch all design_requests and join design data
    const requests = await Promise.all(
      designs.map(async (design) => {
        const request = await ctx.db.get(design.request_id);
        if (!request) return null;

        const client = request.client_id
          ? await ctx.db.get(request.client_id)
          : null;

        return {
          ...request,
          designId: design._id, // ✅ Join designId
          client,
        };
      })
    );

    return requests.filter(Boolean);
  },
});

/* =========================
 *         MUTATIONS
 * ========================= */

// Accept a design request
export const acceptDesignRequest = mutation({
  args: { request_id: v.id("design_requests") },
  handler: async (ctx, { request_id }) => {
    const request = await ctx.db.get(request_id);
    if (!request) throw new Error("Design request not found");

    await ctx.db.patch(request_id, { status: "approved" });

    // Notify the client
    await ctx.db.insert("notifications", {
      recipient_user_id: request.client_id,
      recipient_user_type: "client",
      notif_content: `Your design request "${request.request_title}" has been approved.`,
      created_at: Date.now(),
      is_read: false,
    });

    return request_id;
  },
});

// Cancel (reject) a design request
export const cancelDesignRequest = mutation({
  args: { request_id: v.id("design_requests"), client_id: v.id("users") },
  handler: async (ctx, { request_id, client_id }) => {
    const request = await ctx.db.get(request_id);
    if (!request) throw new Error("Design request not found");

    if (request.client_id !== client_id) {
      throw new Error("You do not have permission to cancel this request");
    }

    await ctx.db.patch(request_id, { status: "rejected" });

    // Notify admins
    const admins = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .collect();

    await Promise.all(
      admins.map((admin) =>
        ctx.db.insert("notifications", {
          recipient_user_id: admin._id,
          recipient_user_type: "admin",
          notif_content: `A client cancelled the design request: "${request.request_title}"`,
          created_at: Date.now(),
          is_read: false,
        })
      )
    );

    return request_id;
  },
});

// Update design request status
export const updateDesignRequestStatus = mutation({
  args: {
    request_id: v.id("design_requests"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    designerId: v.optional(v.id("users")),
  },
  handler: async (ctx, { request_id, status, designerId }) => {
    const request = await ctx.db.get(request_id);
    if (!request) throw new Error("Design request not found");

    const oldStatus = request.status;
    const update: Record<string, any> = { status };
    if (designerId) update.designer_id = designerId;

    await ctx.db.patch(request_id, update);

    if (oldStatus !== status) {
      const client = await ctx.db.get(request.client_id);
      if (client) {
        await ctx.db.insert("notifications", {
          recipient_user_id: request.client_id,
          recipient_user_type: "client",
          notif_content: `Your design request "${request.request_title}" status has been updated to: ${status}`,
          created_at: Date.now(),
          is_read: false,
        });
      }
    }

    return request_id;
  },
});

// Create new request
export const createRequest = mutation({
  args: {
    clientId: v.id("users"),
    sizeId: v.id("shirt_sizes"),
    requestTitle: v.string(),
    tshirtType: v.optional(v.string()),
    gender: v.optional(v.string()),
    sketch: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const requestId = await ctx.db.insert("design_requests", {
      client_id: args.clientId,
      size_id: args.sizeId,
      request_title: args.requestTitle,
      tshirt_type: args.tshirtType || "",
      gender: args.gender || "",
      sketch: args.sketch || "",
      description: args.description || "",
      status: "pending",
      created_at: Date.now(),
    });

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

// Assign design request to a designer
// Assign design request to a designer
export const assignDesignRequest = mutation({
  args: {
    request_id: v.id("design_requests"),
    designer_id: v.id("users"),
    admin_notes: v.optional(v.string()),
  },
  handler: async (ctx, { request_id, designer_id, admin_notes }) => {
    // ✅ Fetch request by ID only
    const request = await ctx.db.get(request_id);
    if (!request) throw new Error("Design request not found");

    // ✅ Fetch designer directly
    const designer = await ctx.db.get(designer_id);
    if (!designer || designer.role !== "designer") {
      throw new Error("Designer not found or invalid role");
    }

    // ✅ Fetch client directly
    const client = request.client_id
      ? await ctx.db.get(request.client_id)
      : null;
    if (!client) throw new Error("Client not found");

    // ✅ Compute default deadline (15 days from now)
    const deadline = new Date(
      Date.now() + 15 * 24 * 60 * 60 * 1000
    ).toISOString();

    // ✅ Insert new design first
    const designId = await ctx.db.insert("design", {
      client_id: request.client_id,
      designer_id,
      request_id,
      preview_image: undefined,
      source_files: [],
      deadline,
      status: "in_progress",
      created_at: Date.now(),
    });

    // ✅ Create fabric canvas (separate table)
    await ctx.runMutation(api.fabric_canvases.createFabricCanvasForDesign, {
      designId,
    });

    // ✅ Patch request status last
    await ctx.db.patch(request_id, { status: "approved" });

    // Prepare names safely
    const requestTitle = request.request_title || "Design Request";
    const designerName = `${designer.firstName ?? ""} ${designer.lastName ?? ""}`;
    const clientName = `${client.firstName ?? ""} ${client.lastName ?? ""}`;

    // ✅ Insert notifications
    await ctx.db.insert("notifications", {
      recipient_user_id: request.client_id,
      recipient_user_type: "client",
      notif_content: `Great news! Your design request "${requestTitle}" has been assigned to ${designerName} and approved.`,
      created_at: Date.now(),
      is_read: false,
    });

    await ctx.db.insert("notifications", {
      recipient_user_id: designer_id,
      recipient_user_type: "designer",
      notif_content: `You have been assigned a new design request: "${requestTitle}" from ${clientName}. ${
        admin_notes ? `Notes: ${admin_notes}` : ""
      }`,
      created_at: Date.now(),
      is_read: false,
    });

    return { request_id, designId };
  },
});

