import { NextResponse } from 'next/server'

const SITE = 'https://www.gradeidea.cc' // www is primary

function xml(strings: TemplateStringsArray, ...vals: any[]) {
  return strings.reduce((o, s, i) => o + s + (vals[i] ?? ''), '')
}

export async function GET() {
  const today = new Date().toISOString().slice(0,10)
  const body = xml`<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url><loc>${SITE}/</loc><lastmod>${today}</lastmod></url>
    <url><loc>${SITE}/features</loc><lastmod>${today}</lastmod></url>
    <url><loc>${SITE}/pricing</loc><lastmod>${today}</lastmod></url>
    <url><loc>${SITE}/examples</loc><lastmod>${today}</lastmod></url>
    <url><loc>${SITE}/founders-hub</loc><lastmod>${today}</lastmod></url>
  </urlset>`
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/xml; charset=UTF-8',
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400',
    },
  })
}

export const dynamic = 'force-static'
export const revalidate = 3600
