// src/app/robots.txt/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const body = `User-agent: *
Allow: /
Sitemap: https://gradeidea.cc/sitemap.xml
`;
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=UTF-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
