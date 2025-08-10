import * as fs from 'node:fs';
import * as path from 'node:path';

type Post = { title: string; description: string; date: string; body: string; slug: string };

function loadPost(slug: string): Post | null {
  const base = path.join(process.cwd(), 'content', 'founders-hub');
  const file = ['.md', '.mdx'].map(ext => path.join(base, slug + ext)).find(p => fs.existsSync(p));
  if (!file) return null;
  const raw = fs.readFileSync(file, 'utf8');
  const fm = raw.match(/---([\s\S]*?)---/);
  const body = raw.replace(/---([\s\S]*?)---/, '').trim();
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
    body,
    slug,
  };
}

// very small markdown -> html (H1/H2/H3, links, paragraphs)
function mdToHtml(md: string): string {
  const esc = (s: string) => s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const lines = md.split('\n');
  const html: string[] = [];
  for (let line of lines) {
    if (/^###\s+/.test(line)) {
      html.push(`<h3>${esc(line.replace(/^###\s+/, ''))}</h3>`);
    } else if (/^##\s+/.test(line)) {
      html.push(`<h2>${esc(line.replace(/^##\s+/, ''))}</h2>`);
    } else if (/^#\s+/.test(line)) {
      html.push(`<h1>${esc(line.replace(/^#\s+/, ''))}</h1>`);
    } else if (line.trim() === '') {
      html.push('');
    } else {
      // links [text](url)
      const withLinks = line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, t, u) => `<a href="${u}">${esc(t)}</a>`);
      html.push(`<p>${withLinks}</p>`);
    }
  }
  return html.join('\n');
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = loadPost(params.slug);
  if (!post) return {};
  return {
    title: `${post.title} | Founders' Learning Hub – GradeIdea.cc`,
    description: post.description || '',
    alternates: { canonical: `https://gradeidea.cc/founders-hub/${params.slug}` },
  };
}

export default function PostPage({ params }: { params: { slug: string } }) {
  const post = loadPost(params.slug);
  if (!post) return null;
  const html = mdToHtml(post.body);
  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="text-3xl md:text-5xl font-bold mb-3">{post.title}</h1>
      <p className="text-sm text-foreground/60 mb-8">{post.date}</p>
      <article
        className="prose prose-neutral max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </main>
  );
}
