import worker from "../../worker/index";

// Reuse the existing contact/subscription validation and provider integration.
export default async function api(request: Request, context: { ip: string }) {
  const headers = new Headers(request.headers);
  // Trust the platform IP, rather than a client-supplied Cloudflare header.
  headers.set("cf-connecting-ip", context.ip || "unknown");

  return worker.fetch(new Request(request, { headers }), {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    CONTACT_FROM: process.env.CONTACT_FROM,
    CONTACT_TO: process.env.CONTACT_TO,
    RESEND_SEGMENT_ID: process.env.RESEND_SEGMENT_ID,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    TURNSTILE_ENABLED: process.env.TURNSTILE_ENABLED ?? "true",
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    ASSETS: {
      fetch: async () => Response.json({ error: "Not found." }, { status: 404 }),
    },
  });
}

export const config = {
  path: "/api/*",
  rateLimit: {
    action: "rate_limit",
    aggregateBy: ["ip", "domain"],
    windowLimit: 5,
    windowSize: 60,
  },
};
