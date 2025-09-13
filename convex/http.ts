// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { WebhookEvent } from "@clerk/backend";
import { Webhook } from "svix";

const http = httpRouter();

http.route({
  path: "/clerk-users-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const payload = await request.json();

      // ==== robust header parser (Convex runtime can vary) ====
      const headers: Record<string, string> = {};
      try {
        const rh: any = (request as any).headers;
        if (!rh) {
          // nothing
        } else if (typeof rh.forEach === "function") {
          rh.forEach((value: string, key: string) => {
            headers[key.toLowerCase()] = value;
          });
        } else if (typeof rh.entries === "function") {
          for (const [k, v] of rh.entries()) {
            headers[(k as string).toLowerCase()] = v as string;
          }
        } else if (typeof (rh as any)[Symbol.iterator] === "function") {
          for (const pair of rh) {
            headers[(pair[0] as string).toLowerCase()] = pair[1] as string;
          }
        } else {
          // fallback - copy enumerable props
          Object.assign(headers, rh);
        }
      } catch (e) {
        console.warn("Could not parse request.headers:", e);
      }

      console.log("📨 Received webhook payload (summarized):", {
        type: (payload as any).type,
        id: (payload as any).id,
      });

      // ==== verify signature if secret present ====
      const secret = process.env.CLERK_WEBHOOK_SECRET;
      let evt: WebhookEvent;
      try {
        if (secret) {
          const wh = new Webhook(secret);
          evt = wh.verify(JSON.stringify(payload), headers) as WebhookEvent;
          console.log("🔐 Signature verification: ok");
        } else {
          console.warn(
            "⚠️ CLERK_WEBHOOK_SECRET not set. Skipping verification (dev only)."
          );
          evt = payload as WebhookEvent; // dev fallback
        }
      } catch (err) {
        console.error("❌ Clerk webhook verification failed:", err);
        return new Response("Invalid signature", { status: 400 });
      }

      console.log("✅ Clerk webhook event type:", evt.type);

      // handle user.created and user.updated
      if (evt.type === "user.created" || evt.type === "user.updated") {
        const user: any = (evt as any).data;
        console.log("➡️ user object from Clerk webhook (keys):", Object.keys(user || {}));

        // safe extraction of email + guard
        const email = user?.email_addresses?.[0]?.email_address ?? "";
        const clerkId = user?.id ?? "";
        const firstName = user?.first_name ?? "";
        const lastName = user?.last_name ?? "";
        const role =
          (user?.unsafe_metadata?.userType as
            | "client"
            | "designer"
            | "admin") ?? "client";

        if (!clerkId) {
          console.error("❌ webhook payload missing user.id — aborting");
        } else {
          try {
            console.log("Calling internal.users.storeClerkUser with:", {
              clerkId,
              email,
              firstName,
              lastName,
              role,
            });
            await ctx.runMutation(internal.users.storeClerkUser, {
              clerkId,
              email,
              firstName,
              lastName,
              role,
            });
            console.log("✅ ctx.runMutation(internal.users.storeClerkUser) finished");
          } catch (err) {
            console.error("❌ Error running storeClerkUser mutation:", err);
          }
        }
      }

      // you can add user.deleted handling here if desired

      return new Response("ok", { status: 200 });
    } catch (err) {
      console.error("❌ Unhandled error in webhook handler:", err);
      return new Response("server error", { status: 500 });
    }
  }),
});

export default http;
