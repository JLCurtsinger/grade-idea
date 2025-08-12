"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Resp = { signedIn: boolean; balance: number };

export default function HeroTokenBalance() {
  const [data, setData] = useState<Resp | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/token-balance", { cache: "no-store" });
        if (!alive) return;
        if (!res.ok) { setData(null); return; }
        const json: Resp = await res.json();
        setData(json);
      } catch {
        setData(null);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Hide if not loaded, guest, or zero/undefined balance (previous behavior only surfaced for signed-in users)
  if (!data || !data.signedIn) return null;

  return (
    <div className="mt-1 sm:mt-2 w-full flex justify-center">
      <div className="text-[13px] sm:text-sm text-neutral-400 flex items-center gap-1.5">
        <span>You have</span>
        <span className="text-neutral-200 font-medium tabular-nums">{data.balance}</span>
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
    </div>
  );
}
