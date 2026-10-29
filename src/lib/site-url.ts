/** Optional public deployment URL. Local previews use their actual origin. */
export const PUBLIC_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://leibox.pantoria.cn").trim().replace(/\/$/, "");
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === "production" ? PUBLIC_SITE_URL : "http://127.0.0.1:3000")).replace(/\/$/, "");

export function siteUrl(pathname: string) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : SITE_URL);
  return new URL(pathname, origin).href;
}
