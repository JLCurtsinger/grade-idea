import type { MetadataRoute } from 'next'
import fs from 'node:fs'
import path from 'node:path'

const SITE = 'https://gradeidea.cc'
const CATEGORIES = ['ai','saas','ecommerce','healthtech','fintech'] as const

type UrlItem = { url: string; lastModified?: string }

function getPosts(): UrlItem[] {
  try {
    const dir = path.join(process.cwd(), 'content', 'founders-hub')
    if (!fs.existsSync(dir)) return []
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md') || f.endsWith('.mdx'))
    return files.map(file => {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8')
      const fm = raw.match(/---([\s\S]*?)---/)
      let date: string | undefined
      if (fm) {
        fm[1].split('\n').forEach(line => {
          const m = line.match(/^(\w+):\s*"?([^"]+)"?/)
          if (m && m[1] === 'date') date = m[2]
        })
      }
      const slug = file.replace(/\.mdx?$/, '')
      return { url: `${SITE}/founders-hub/${slug}`, lastModified: date }
    })
  } catch {
    return []
  }
}

async function getPublicIdeas(): Promise<UrlItem[]> {
  try {
    const mod = await import('@/lib/firebase-admin').catch(() => null)
    const adminDb = (mod as any)?.adminDb
    if (!adminDb) return []
    // Adjust collection/fields to match your API route
    const snap = await adminDb
      .collection('public_ideas')
      .where('isPublic', '==', true)
      .orderBy('updatedAt', 'desc')
      .limit(5000)
      .get()

    const items: UrlItem[] = []
    snap.forEach((doc: any) => {
      const d = doc.data()
      const last =
        (d.updatedAt?.toDate?.() && d.updatedAt.toDate().toISOString().slice(0,10)) ||
        (d.createdAt?.toDate?.() && d.createdAt.toDate().toISOString().slice(0,10)) ||
        undefined
      items.push({ url: `${SITE}/idea/${doc.id}`, lastModified: last })
    })
    return items
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const today = new Date().toISOString().slice(0,10)

  const core: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: today },
    { url: `${SITE}/examples`, lastModified: today },
    { url: `${SITE}/founders-hub`, lastModified: today },
  ]

  const cats: MetadataRoute.Sitemap = CATEGORIES.map(c => ({
    url: `${SITE}/validate/${c}`, lastModified: today
  }))

  const posts = getPosts()
  const ideas = await getPublicIdeas()

  return [
    ...core,
    ...cats,
    ...posts,
    ...ideas,
  ]
}
