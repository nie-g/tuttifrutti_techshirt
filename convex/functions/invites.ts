import { action } from "../_generated/server";
import { v } from "convex/values";
import type { ActionCtx } from "../_generated/server";

export const sendClerkInvite = action({
  args: v.object({
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("client"), v.literal("designer")),
  }),
  handler: async (_ctx: ActionCtx, { email, role }) => {
    if (!email) throw new Error("Email is required");

    const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
    const CLIENT_BASE_URL = process.env.CLIENT_BASE_URL || "http://localhost:5173";
    if (!CLERK_SECRET_KEY) throw new Error("Missing Clerk secret key");

    const headers = {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
    };

    try {
      // ✅ Check if there’s already a pending invitation for this email
      const listResponse = await fetch("https://api.clerk.com/v1/invitations", { headers });
      const listData = await listResponse.json();

      const pending = listData.data?.find(
        (inv: any) => inv.email_address === email && inv.status === "pending"
      );

      if (pending) {
        // ✅ Resend existing invite instead of creating a new one
        const resendResponse = await fetch(
          `https://api.clerk.com/v1/invitations/${pending.id}/resend`,
          { method: "POST", headers }
        );
        const resendData = await resendResponse.json();
        return {
          clerkInvitation: resendData,
          emailSent: true,
          message: `Existing invitation resent to ${email}`,
        };
      }

      // ✅ Dynamic redirect based on role
      const roleRedirectMap: Record<string, string> = {
        admin: `${CLIENT_BASE_URL}/register/admin`,
        client: `${CLIENT_BASE_URL}/register`,
        designer: `${CLIENT_BASE_URL}/register/designer`,
      };

      const redirect_url = roleRedirectMap[role] || `${CLIENT_BASE_URL}/signup`;

      // ✅ Create a new invitation
      const createResponse = await fetch("https://api.clerk.com/v1/invitations", {
        method: "POST",
        headers,
        body: JSON.stringify({
          email_address: email,
          redirect_url,
          public_metadata: { role },
          notify: true, // Sends the email invite automatically
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
        message: `Invitation sent to ${email} as ${role}`,
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
