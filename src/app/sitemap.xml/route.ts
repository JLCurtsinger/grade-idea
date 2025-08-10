// src/app/sitemap.xml/route.ts
import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

// ---- Config ----
const SITE = 'https://gradeidea.cc';
const CATEGORIES = ['ai','saas','ecommerce','healthtech','fintech']; // adjust if needed

type UrlItem = { loc: string; lastmod?: string };

// Read markdown/mdx posts from /content/founders-hub
function getPosts(): UrlItem[] {
  try {
    const dir = path.join(process.cwd(), 'content', 'founders-hub');
    if (!fs.existsSync(dir)) return [];
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
    return files.map(file => {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8');
      const fm = raw.match(/---([\s\S]*?)---/);
      let date: string | undefined;
      if (fm) {
        fm[1].split('\n').forEach(line => {
          const m = line.match(/^(\w+):\s*"?([^"]+)"?/);
          if (m && m[1] === 'date') date = m[2];
        });
      }
      const slug = file.replace(/\.mdx?$/, '');
      return { loc: `${SITE}/founders-hub/${slug}`, lastmod: date };
    });
  } catch {
    return [];
  }
}

// Try to fetch public ideas from Firestore admin if available
async function getPublicIdeas(): Promise<UrlItem[]> {
  try {
    // Import lazily to avoid failing when not configured
    const { adminDb } = await import('@/lib/firebase-admin').catch(() => ({ adminDb: null as any }));
    if (!adminDb) return [];
    // Reuse same collection/filters as src/app/api/public-ideas/route.ts
    // Adjust the collection name/fields below to match your API route.
    const snap = await adminDb
      .collection('public_ideas') // <-- change if your collection differs
      .where('isPublic', '==', true)
      .orderBy('updatedAt', 'desc')
      .limit(5000)
      .get();

    const items: UrlItem[] = [];
    snap.forEach((doc: any) => {
      const d = doc.data();
      const lastmod =
        (d.updatedAt?.toDate?.() && d.updatedAt.toDate().toISOString().slice(0,10)) ||
        (d.createdAt?.toDate?.() && d.createdAt.toDate().toISOString().slice(0,10)) ||
        undefined;
      items.push({ loc: `${SITE}/idea/${doc.id}`, lastmod });
    });
    return items;
  } catch {
    return [];
  }
}

export async function GET() {
  const today = new Date().toISOString().slice(0,10);

  // Static/core pages
  const core: UrlItem[] = [
    { loc: `${SITE}/`, lastmod: today },
    { loc: `${SITE}/examples`, lastmod: today },       // adjust if your public list page differs
    { loc: `${SITE}/founders-hub`, lastmod: today },
  ];

  // Category pages
  const cats: UrlItem[] = CATEGORIES.map(c => ({ loc: `${SITE}/validate/${c}`, lastmod: today }));

  // Blog posts
  const posts = getPosts();

  // Public ideas (Firestore; may be empty if no admin available)
  const ideas = await getPublicIdeas();

  const all = [...core, ...cats, ...posts, ...ideas];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${all.map(u => `
      <url>
        <loc>${u.loc}</loc>
        ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
      </url>
    `).join('')}
  </urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=UTF-8',
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400',
    },
  });
}
