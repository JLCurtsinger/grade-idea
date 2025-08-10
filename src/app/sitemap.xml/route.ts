// src/app/sitemap.xml/route.ts
import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
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
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/public-ideas`, {
      cache: 'no-store'
    });
    const data = await response.json();
    
    if (data.success) {
      return data.ideas.map((idea: any) => ({
        id: idea.id,
        updatedAt: idea.createdAt ? new Date(idea.createdAt.seconds * 1000).toISOString().slice(0, 10) : undefined
      }));
    }
    return [];
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
