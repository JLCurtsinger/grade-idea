"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

type Resp = { signedIn: boolean; balance: number };

export default function HeroTokenBalance() {
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const fetchOnce = async () => {
      try {
        // Add a cache-busting param and include cookies
        const res = await fetch(`/api/token-balance?_=${Date.now()}`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!alive) return;
        if (!res.ok) {
          setData(null);
          setLoading(false);
          return;
        }
        const json = (await res.json()) as Resp;
        setData(json);
      } catch {
        if (alive) setData(null);
      } finally {
        if (alive) setLoading(false);
      }
    };

    // Try twice (tiny debounce) in case auth cookie races on initial load
    fetchOnce();
    const t = setTimeout(fetchOnce, 500);

    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, []);

  // Hide entirely for guests or if still loading but we already know guest
  if (!loading && (!data || !data.signedIn)) return null;

  // Minimal skeleton while we fetch
  if (loading) {
    return (
      <div className="mt-1 sm:mt-2 w-full flex justify-center z-10">
        <div className="h-[18px] sm:h-[20px] w-40 rounded bg-neutral-800/60 animate-pulse" />
      </div>
    );
  }

  // If we get here, we're signed in
  const balance = Math.max(0, Number(data?.balance ?? 0));
  const label = useMemo(
    () => (
      <div
        className="
          text-[13px] sm:text-sm text-neutral-400
          flex items-center gap-1.5
        "
      >
        <span>You have</span>
        <span className="text-neutral-200 font-medium tabular-nums">
          {balance}
        </span>
        <Image
          src="/logo.svg"
          alt="token"
          width={14}
          height={14}
          className="inline-block align-[-2px] opacity-90"
          priority={false}
        />
        <span>remaining</span>
      </div>
    ),
    [balance]
  );

  /*
   * Layout guard:
   * - Default: centered under the input (z-10 so it sits above backgrounds).
   * - If the container gets too tight (mobile with Roast button), allow it to
   *   left-align to avoid overlap (via responsive utility).
   *   We use a max-w and overflow-visible so it won't be clipped.
   */
  return (
    <div
      className="
        mt-1 sm:mt-2 w-full z-10 relative
        flex justify-center
        [@media(max-width:430px)]:justify-start
      "
      style={{ overflow: "visible" }}
      data-testid="hero-token-balance"
    >
      {label}
    </div>
  );
}
