"use client";
import { useEffect, useState } from "react";

export default function RoastPoller({ id, initial }: { id: string; initial: any }) {
  const [data, setData] = useState(initial);
  const ready = data?.status === "ready";
  
  useEffect(() => {
    if (ready) return;
    let t: any;
    const tick = async () => {
      const res = await fetch(`/api/roast/${id}`, { cache: "no-store" });
      const j = await res.json();
      setData(j);
      if (j?.status !== "ready") t = setTimeout(tick, 900);
    };
    tick();
    return () => clearTimeout(t);
  }, [id, ready]);
  
  // render the same #roast-card layout as the page or nothing if already in page
  return null;
}
