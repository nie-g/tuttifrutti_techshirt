import { action } from "../_generated/server"; 
import { v } from "convex/values";
import type { ActionCtx } from "../_generated/server";

export const sendClerkInvite = action({
  args: v.object({ email: v.string() }),
  handler: async (_ctx: ActionCtx, { email }) => {
    if (!email) throw new Error("Email is required");

    const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
    const CLIENT_BASE_URL = process.env.CLIENT_BASE_URL || "http://localhost:5173";
    if (!CLERK_SECRET_KEY) throw new Error("Missing Clerk secret key");

    const headers = {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
    };

    try {
      // Fetch existing invitations
      const listResponse = await fetch("https://api.clerk.com/v1/invitations", { headers });
      const listData = await listResponse.json();

      const pending = listData.data?.find(
        (inv: any) => inv.email_address === email && inv.status === "pending"
      );

      if (pending) {
        // Resend existing pending invite
        const resendResponse = await fetch(
          `https://api.clerk.com/v1/invitations/${pending.id}/resend`,
          { method: "POST", headers }
        );
        const resendData = await resendResponse.json();
        return {
          clerkInvitation: resendData,
          emailSent: true,
          message: `Invitation resent to ${email}`,
        };
      }

      // Create a new invitation
      const createResponse = await fetch("https://api.clerk.com/v1/invitations", {
        method: "POST",
        headers,
        body: JSON.stringify({
          email_address: email,
          redirect_url: `${CLIENT_BASE_URL}/signup/designer`,
          public_metadata: { role: "designer" },
          notify: true, // ensures Clerk sends the email
        }),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Failed to create invite: ${errorText}`);
      }

      const createData = await createResponse.json();

      return {
        clerkInvitation: createData,
        emailSent: true,
        message: `Invitation sent to ${email}`,
      };
    } catch (err: any) {
      console.error("Error sending invite:", err);
      return {
        clerkInvitation: null,
        emailSent: false,
        message: `Error: ${err.message || err}`,
      };
    }
  },
});
