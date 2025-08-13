export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getRoast } from "@/lib/roast";

// Top of file (module scope)
type CacheEntry = { etag: string; body: any; expiresAt: number };
const roastCache = new Map<string, CacheEntry>(); // id -> entry
const inflight = new Map<string, Promise<any>>(); // id -> promise
const TTL_MS = 5000; // 5s

async function fetchRoastOnce(id: string) {
  if (inflight.has(id)) return inflight.get(id)!;
  const p = (async () => {
    return await getRoast(id); // existing helper
  })().finally(() => inflight.delete(id));
  inflight.set(id, p);
  return p;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const sessionId = req.nextUrl.searchParams.get('session_id');
    
    // Check If-None-Match for 304 responses
    const ifNoneMatch = req.headers.get('if-none-match');
    const cachedEntry = roastCache.get(id);
    
    if (ifNoneMatch && cachedEntry && cachedEntry.expiresAt > Date.now()) {
      if (cachedEntry.etag === ifNoneMatch) {
        console.log(`[roast][read] ${id} -> 304 (etag:${cachedEntry.etag})`);
        return new NextResponse(null, { 
          status: 304,
          headers: {
            'Cache-Control': 'private, max-age=3, stale-while-revalidate=30',
            'ETag': cachedEntry.etag
          }
        });
      }
    }
    
    // Fetch roast with single-flight deduplication
    const roast = await fetchRoastOnce(id);
    
    if (!roast) {
      console.log(`[roast][read] ${id} -> not-found`);
      
      // Self-heal hint if session_id is present
      if (sessionId) {
        console.log(`[roast][read][self-heal] → { id: "${id}", session_id: "${sessionId}" }`);
      }
      
      return NextResponse.json({ error: "Roast not found" }, { status: 404 });
    }

    // Generate ETag from updatedAt and status
    const etag = `${roast.updatedAt || 0}:${roast.status || ''}`;
    
    // Cache successful reads
    roastCache.set(id, {
      etag,
      body: roast,
      expiresAt: Date.now() + TTL_MS
    });
    
    // If doc exists but no result yet, return processing status
    if (roast.status !== "ready" || !roast.result) {
      console.log(`[roast][read] ${id} -> processing (etag:${etag})`);
      return NextResponse.json(
        { status: "processing" },
        {
          headers: {
            'Cache-Control': 'private, max-age=3, stale-while-revalidate=30',
            'ETag': etag
          }
        }
      );
    }

    console.log(`[roast][read] ${id} -> ready (etag:${etag})`);
    return NextResponse.json(roast, {
      headers: {
        'Cache-Control': 'private, max-age=3, stale-while-revalidate=30',
        'ETag': etag
      }
    });
  } catch (error: any) {
    // Handle Firestore RESOURCE_EXHAUSTED specifically
    if (error.code === 8 || error.message?.includes('RESOURCE_EXHAUSTED')) {
      console.log(`[roast][read][throttle] id ${params.id} -> resource_exhausted; retry-after:15`);
      return NextResponse.json(
        { status: "processing" },
        { 
          status: 503,
          headers: {
            'Retry-After': '15',
            'Cache-Control': 'private, max-age=3, stale-while-revalidate=30'
          }
        }
      );
    }
    
    console.error("[roast][read][error]", { message: error instanceof Error ? error.message : "Unknown error", id: params.id });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
