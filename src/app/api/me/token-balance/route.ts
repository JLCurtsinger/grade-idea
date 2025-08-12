import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth/server";
import { getTokenBalance } from "@/lib/token-validation";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getServerUser(request);
  if (!user) return NextResponse.json({ authed: false, balance: 0 });
  const balance = await getTokenBalance(user.uid).catch(() => 0);
  return NextResponse.json({ authed: true, balance });
}
