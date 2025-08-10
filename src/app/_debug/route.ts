import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json({
    env: process.env.VERCEL_ENV,
    url: process.env.VERCEL_URL,
    region: process.env.VERCEL_REGION,
    commit: process.env.VERCEL_GIT_COMMIT_SHA,
    project: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    now: Date.now(),
  })
}
