export function siteUrl() {
  const env = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  if (env) return env.replace(/\/$/, "");
  throw new Error("NEXT_PUBLIC_SITE_URL is not set");
}

export function inferSiteUrlFromRequest(req: Request) {
  // 1) explicit env if present
  const env = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  if (env) return env.replace(/\/$/, "");

  // 2) headers from the incoming request
  try {
    // @ts-ignore – NextRequest has headers.get
    const proto = (req.headers?.get?.("x-forwarded-proto") || "https").toString();
    // @ts-ignore
    const host = (req.headers?.get?.("x-forwarded-host") || req.headers?.get?.("host") || process.env.VERCEL_URL || "").toString();
    if (host) return `${proto}://${host}`.replace(/\/$/, "");
  } catch {}

  // 3) Vercel fallback
  const vercel = (process.env.VERCEL_URL || "").trim();
  if (vercel) return `https://${vercel}`.replace(/\/$/, "");

  // 4) absolute last resort for local dev
  return "http://localhost:3000";
}
