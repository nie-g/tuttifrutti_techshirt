// convex/shirt_types.ts
import { query } from "./_generated/server";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("shirt_types").collect();
  },
});
