import { query } from "./_generated/server";

// Get dashboard statistics
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    // Fetch from DB
    const users = await ctx.db.query("users").collect();
    const designRequests = await ctx.db.query("design_requests").collect();
    const designs = await ctx.db.query("design").collect();
    const templates = await ctx.db.query("design_templates").collect();
    const shirtSizes = await ctx.db.query("shirt_sizes").collect();

    // User counts
    const userCounts = {
      total: 0, // declare total upfront
      admin: users.filter((u) => u.role === "admin").length,
      designer: users.filter((u) => u.role === "designer").length,
      client: users.filter((u) => u.role === "client").length,
    };
    userCounts.total = userCounts.designer + userCounts.client;

    // Request counts
    const requestCounts = {
      total: designRequests.length,
      pending: designRequests.filter((r) => r.status === "pending").length,
      approved: designRequests.filter((r) => r.status === "approved").length,
      cancelled: designRequests.filter((r) => r.status === "cancelled").length,
      rejected: designRequests.filter((r) => r.status === "declined").length,
    };

    // Recent activity
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentActivity: {
      id: string;
      type: "request" | "design";
      title: string;
      status: string;
      timestamp: number;
      user: string;
      userType: string;
    }[] = [];

    // Requests
    const recentRequests = designRequests
      .filter((req) => req._creationTime > oneWeekAgo)
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 5);

    for (const req of recentRequests) {
      const client = await ctx.db.get(req.client_id);
      if (client) {
        recentActivity.push({
          id: req._id.toString(),
          type: "request",
          title: req.request_title,
          status: req.status,
          timestamp: req._creationTime,
          user: `${client.firstName} ${client.lastName}`,
          userType: client.role,
        });
      }
    }

    // Designs
    const recentDesigns = designs
      .filter((design) => design._creationTime > oneWeekAgo)
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 5);

    for (const design of recentDesigns) {
      const designer = await ctx.db.get(design.designer_id);
      const request = await ctx.db.get(design.request_id);

      if (designer && request) {
        recentActivity.push({
          id: design._id.toString(),
          type: "design",
          title: request.request_title,
          status: "created",
          timestamp: design._creationTime,
          user: `${designer.firstName} ${designer.lastName}`,
          userType: designer.role,
        });
      }
    }

    recentActivity.sort((a, b) => b.timestamp - a.timestamp);

    return {
      users: userCounts,
      requests: requestCounts,
      designs: {
        total: designs.length,
      },
      templates: { total: templates.length },
      shirtSizes: { total: shirtSizes.length },
      recentActivity: recentActivity.slice(0, 10),
    };
  },
});

