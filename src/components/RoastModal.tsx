"use client";
import { useEffect, useState } from "react";
import { xShare, liShare, copyText } from "@/lib/client/share";
import { downloadRoastCardPng } from "@/lib/client/downloadRoastPng";

export default function RoastModal({ roastId, onClose }: { roastId: string; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    let timer: any;
    const tick = async () => {
      const res = await fetch(`/api/roast/${roastId}`);
      const json = await res.json();
      setData(json);
      if (json?.status !== "ready") timer = setTimeout(tick, 800);
    };
    tick();
    return () => clearTimeout(timer);
  }, [roastId]);

  const ready = data?.status === "ready";
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="relative w-full max-w-xl rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5">
        <button onClick={onClose} className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-200">✕</button>
        {!ready ? (
          <div className="py-10 text-center text-neutral-300">Cooking your roast…</div>
        ) : (
          <>
            <article id="roast-card">
              <h3 className="text-xl font-semibold mb-4">{data?.result?.title || "Your Roast"}</h3>
              <div className="mb-3">
                <div className="text-sm text-neutral-400 mb-1">Zingers</div>
                <ul className="list-disc pl-5 space-y-2">{(data?.result?.zingers || []).map((z: string, i: number) => <li key={i}>{z}</li>)}</ul>
              </div>
              <div className="mb-3">
                <div className="text-sm text-neutral-400 mb-1">Useful Takeaways</div>
                <ul className="list-disc pl-5 space-y-2">{(data?.result?.insights || []).map((t: string, i: number) => <li key={i}>{t}</li>)}</ul>
              </div>
              <div className="text-neutral-300"><span className="text-neutral-400">Verdict:</span> {data?.result?.verdict}</div>
            </article>
            
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button 
                onClick={() => copyText(`${window.location.origin}/r/${roastId}`)} 
                className="rounded-lg border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-800"
              >
                Copy Link
              </button>
              <a 
                href={xShare(`${window.location.origin}/r/${roastId}`, data?.result?.title || "My GradeIdea Roast")} 
                target="_blank" 
                className="rounded-lg border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-800"
              >
                Share on X
              </a>
              <a 
                href={liShare(`${window.location.origin}/r/${roastId}`)} 
                target="_blank" 
                className="rounded-lg border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-800"
              >
                Share on LinkedIn
              </a>
              <button 
                onClick={() => downloadRoastCardPng(document.getElementById("roast-card")!)} 
                className="rounded-lg border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-800"
              >
                Download
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
