// convex/actions/updateClerkUser.ts
import { v } from "convex/values";
import { action } from "../_generated/server";
import { clerkClient } from "@clerk/clerk-sdk-node";

export const updateClerkUser = action({
  args: {
    userId: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (_ctx, { userId, firstName, lastName, email }) => {
    try {
      // 1️⃣ Update allowed fields
      if (firstName || lastName) {
        await clerkClient.users.updateUser(userId, {
          firstName,
          lastName,
        });
      }

      // 2️⃣ If email provided, add it via Clerk's email address API
      if (email) {
        const emailRes = await clerkClient.emailAddresses.createEmailAddress({
          emailAddress: email,
          userId,
        });

        // Optionally set this new email as primary
        await clerkClient.users.updateUser(userId, {
          primaryEmailAddressID: emailRes.id,
        });
      }

      return { success: true };
    } catch (err: any) {
      console.error("Update Clerk user error:", err);
      return { success: false, message: err.message };
    }
  },
});
