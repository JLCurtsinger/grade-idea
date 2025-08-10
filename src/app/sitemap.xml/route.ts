// src/app/sitemap.xml/route.ts
// (Will be shadowed by /public/sitemap.xml in prod, but kept for future generation)

const SITE = 'https://www.gradeidea.cc';
const iso = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, '+00:00');

export async function GET() {
  const today = iso(new Date());
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
      `<url><loc>${SITE}/</loc><lastmod>${today}</lastmod></url>` +
      `<url><loc>${SITE}/features</loc><lastmod>${today}</lastmod></url>` +
      `<url><loc>${SITE}/pricing</loc><lastmod>${today}</lastmod></url>` +
      `<url><loc>${SITE}/examples</loc><lastmod>${today}</lastmod></url>` +
      `<url><loc>${SITE}/founders-hub</loc><lastmod>${today}</lastmod></url>` +
    `</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400',
      'Content-Disposition': 'inline',
    },
  });
}

export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400',
      'Content-Disposition': 'inline',
    },
  });
}

export const dynamic = 'force-static'
export const revalidate = 3600
