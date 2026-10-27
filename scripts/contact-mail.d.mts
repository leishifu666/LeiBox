export const DEFAULT_CONTACT_TO: string;
export const MAX_CONTACT_BYTES: number;
type RateLimiter = { limit(options: { key: string }): Promise<{ success: boolean }> };
export type ContactEnv = {
  RESEND_API_KEY?: string;
  CONTACT_FROM?: string;
  CONTACT_TO?: string;
  CONTACT_IP_LIMIT?: RateLimiter;
  CONTACT_GLOBAL_LIMIT?: RateLimiter;
};
export function createContactHandler(options?: {
  fetchImpl?: typeof fetch;
  now?: () => number;
}): (request: Request, env?: ContactEnv, context?: { clientKey?: string }) => Promise<Response>;
