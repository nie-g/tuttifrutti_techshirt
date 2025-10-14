// convex/queries/designer_specialization.ts
import { query } from "./_generated/server";

export const listDesignersWithSpecialization = query(async ({ db }) => {
  // Get all designers
  const designers = await db.query("designers").collect();

  const result = await Promise.all(
    designers.map(async (designer) => {
      const user = await db.get(designer.user_id);
      if (!user) return null;

      const portfolio = await db
        .query("portfolios")
        .filter((q) => q.eq(q.field("designer_id"), designer._id))
        .first(); // just the first portfolio

      return {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        specialization: portfolio?.specialization || "-NA",
      };
    })
  );

  return result.filter((d): d is NonNullable<typeof d> => d !== null);
});
