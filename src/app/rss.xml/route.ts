// src/app/rss.xml/route.ts
import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

type PostMeta = { title: string; description: string; date: string; slug: string };

function getPosts(): PostMeta[] {
  const dir = path.join(process.cwd(), 'content', 'founders-hub');
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    const fm = raw.match(/---([\s\S]*?)---/);
    const body = raw.replace(/---([\s\S]*?)---/, '').trim();
    const meta: any = {};
    if (fm) {
      fm[1].split('\n').forEach(line => {
        const m = line.match(/^(\w+):\s*"?([^"]+)"?/);
        if (m) meta[m[1]] = m[2];
      });
    }
    const slug = file.replace(/\.mdx?$/, '');
    return {
      title: meta.title || slug,
      description: meta.description || body.slice(0, 240),
      date: meta.date || new Date().toISOString().slice(0, 10),
      slug,
    };
  }).sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function GET() {
  const site = 'https://gradeidea.cc';
  const posts = getPosts();
  const items = posts.map(p => `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${site}/founders-hub/${p.slug}</link>
      <guid>${site}/founders-hub/${p.slug}</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <description><![CDATA[${p.description}]]></description>
    </item>
  `).join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title>GradeIdea.cc — Founders' Learning Hub</title>
      <link>${site}</link>
      <description>Actionable guides for validating and growing your startup idea.</description>
      ${items}
    </channel>
  </rss>`;

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=UTF-8',
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400',
    },
  });
}
