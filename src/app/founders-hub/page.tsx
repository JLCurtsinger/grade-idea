import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import { Metadata } from 'next';

type PostMeta = { title: string; description: string; date: string; slug: string };

function readPosts(): PostMeta[] {
  const dir = path.join(process.cwd(), 'content', 'founders-hub');
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    const fm = raw.match(/---([\s\S]*?)---/);
    const slug = file.replace(/\.mdx?$/, '');
    const meta: any = {};
    if (fm) {
      fm[1].split('\n').forEach(line => {
        const m = line.match(/^(\w+):\s*"?([^"]+)"?/);
        if (m) meta[m[1]] = m[2];
      });
    }
    return {
      title: meta.title || slug,
      description: meta.description || '',
      date: meta.date || '',
      slug,
    };
  }).sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Founders' Learning Hub – Startup Validation Guides | GradeIdea.cc",
    description: "Actionable guides, strategies, and insights for validating and growing your startup idea. Learn from proven frameworks and real-world examples.",
    alternates: { canonical: 'https://gradeidea.cc/founders-hub' },
  };
}

export default function FoundersHubPage() {
  const posts = readPosts();
  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="text-3xl md:text-5xl font-bold mb-4">Founders' Learning Hub</h1>
      <p className="text-foreground/80 mb-8">
        Actionable guides, strategies, and insights for validating and growing your startup idea.
      </p>
      <ul className="space-y-6">
        {posts.map(p => (
          <li key={p.slug} className="border rounded-xl p-4">
            <Link href={`/founders-hub/${p.slug}`} className="text-xl font-semibold hover:underline">
              {p.title}
            </Link>
            <p className="text-sm text-foreground/70 mt-1">{p.description}</p>
            <p className="text-xs text-foreground/50 mt-2">{p.date}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
