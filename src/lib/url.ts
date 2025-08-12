export function siteUrl() {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) throw new Error("NEXT_PUBLIC_SITE_URL is not set");
  return base.replace(/\/$/, "");
}
