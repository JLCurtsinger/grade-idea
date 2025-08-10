import type { MetadataRoute } from 'next'

console.log('[sitemap] metadata route included in build')

const SITE = 'https://gradeidea.cc'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const today = new Date().toISOString().slice(0,10)
  return [
    { url: `${SITE}/`, lastModified: today },
    { url: `${SITE}/features`, lastModified: today },
    { url: `${SITE}/pricing`, lastModified: today },
    { url: `${SITE}/examples`, lastModified: today },
    { url: `${SITE}/founders-hub`, lastModified: today },
  ]
}

export const dynamic = 'force-static'
export const revalidate = 3600
