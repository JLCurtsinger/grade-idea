// src/app/sitemap.xml/route.ts
import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { adminDb } from '@/lib/firebase-admin';
// If you have a Firestore util, import it; otherwise stub getPublicIdeas()
/* import { getPublicIdeas } from '@/lib/db'; */

type PostMeta = { slug: string; date?: string };

function getPosts(): PostMeta[] {
  const dir = path.join(process.cwd(), 'content', 'founders-hub');
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    const fm = raw.match(/---([\s\S]*?)---/);
    let date = undefined as string | undefined;
    if (fm) {
      fm[1].split('\n').forEach(line => {
        const m = line.match(/^(\w+):\s*"?([^"]+)"?/);
        if (m && m[1] === 'date') date = m[2];
      });
    }
    return { slug: file.replace(/\.mdx?$/, ''), date };
  });
}

async function getPublicIdeas(): Promise<{ id: string; updatedAt?: string }[]> {
  try {
    // Get all ideas from all users where public is true
    const ideasSnapshot = await adminDb
      .collectionGroup('ideas')
      .where('public', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(5000)
      .get();

    const ideas: { id: string; updatedAt?: string }[] = [];

    for (const doc of ideasSnapshot.docs) {
      const data = doc.data();
      
      // Only include ideas that have ideaText
      if (!data.ideaText) {
        continue;
      }

      // Convert Timestamp to ISO string
      const updatedAt = data.updatedAt?.toDate?.()?.toISOString() || 
                       data.createdAt?.toDate?.()?.toISOString() || 
                       undefined;

      ideas.push({
        id: doc.id,
        updatedAt
      });
    }

    return ideas;
  } catch (error) {
    console.error('Error fetching public ideas for sitemap:', error);
    return [];
  }
}

export async function GET() {
  const site = 'https://gradeidea.cc';
  const today = new Date().toISOString().slice(0, 10);

  const staticUrls = [
    { loc: `${site}/`, lastmod: today },
    { loc: `${site}/examples`, lastmod: today },
    { loc: `${site}/founders-hub`, lastmod: today },
  ];

  const categories = ['ai', 'saas', 'ecommerce', 'healthtech', 'fintech'];
  const categoryUrls = categories.map(c => ({
    loc: `${site}/validate/${c}`,
    lastmod: today,
  }));

  const posts = getPosts().map(p => ({
    loc: `${site}/founders-hub/${p.slug}`,
    lastmod: (p.date && new Date(p.date).toISOString().slice(0,10)) || today,
  }));

  const ideas = await getPublicIdeas();
  const ideaUrls = ideas.map(i => ({
    loc: `${site}/idea/${i.id}`,
    lastmod: (i.updatedAt && new Date(i.updatedAt).toISOString().slice(0,10)) || today,
  }));

  const all = [...staticUrls, ...categoryUrls, ...posts, ...ideaUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${all.map(u => `
      <url>
        <loc>${u.loc}</loc>
        <lastmod>${u.lastmod}</lastmod>
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
