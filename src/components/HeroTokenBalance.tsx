"use client";

import { useEffect, useState } from "react";
import TokenIcon from "@/components/ui/TokenIcon";

export default function HeroTokenBalance() {
  const [state, setState] = useState<{loading: boolean; signedIn: boolean; balance?: number}>({
    loading: true,
    signedIn: false,
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/token-balance", { cache: "no-store" });
        const json = await res.json();
        if (!alive) return;
        setState({ loading: false, signedIn: !!json?.signedIn, balance: json?.balance });
      } catch {
        if (!alive) return;
        setState({ loading: false, signedIn: false });
      }
    })();
    return () => { alive = false; };
  }, []);

  // Hide entirely for guests to keep hero clean (previous behavior often hid when signed out)
  if (state.loading || !state.signedIn) return null;

  return (
    <div className="mt-1 sm:mt-2 flex justify-center">
      <div className="text-[13px] sm:text-sm text-neutral-400 inline-flex items-center gap-1.5">
        <span>You have</span>
        <span className="font-medium text-neutral-200">{state.balance ?? 0}</span>
        <TokenIcon className="h-4 w-4 opacity-90" />
        <span>remaining</span>
      </div>
    </div>
  );
}
