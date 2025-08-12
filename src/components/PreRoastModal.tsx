"use client";
import { useState, useEffect } from "react";

export default function PreRoastModal({
  idea,
  onCancel,
  onStart,
  pending = false,
  onError
}: {
  idea: string;
  onCancel: () => void;
  onStart: (harshness: 1|2|3) => void;
  pending?: boolean;
  onError?: (error: string) => void;
}) {
  const [h, setH] = useState<1|2|3>(2);
  const [error, setError] = useState<string>("");
  const label = h === 1 ? "Light" : h === 2 ? "Medium" : "Nuclear";
  
  // Expose setError to parent
  useEffect(() => {
    if (onError) {
      (window as any).setRoastModalError = setError;
    }
    return () => {
      delete (window as any).setRoastModalError;
    };
  }, [onError]);
  
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 backdrop-blur bg-neutral-900/95 p-5">
        <button onClick={onCancel} className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-200">✕</button>
        <h3 className="text-lg font-semibold mb-2 text-neutral-200">How spicy should we be?</h3>
        <p className="text-sm text-neutral-400 mb-4 line-clamp-3">{idea}</p>
        <label className="mb-1 flex items-center gap-3 text-xs text-neutral-400">
          Harshness
          <input type="range" min={1} max={3} step={1} value={h}
            onChange={(e) => setH(parseInt(e.target.value) as 1|2|3)}
            className="w-40 accent-red-500" />
          <span className="text-neutral-300">{label}</span>
        </label>
        {error && (
          <div className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} disabled={pending} className="rounded-lg border border-neutral-700 px-3 py-2 text-sm disabled:opacity-50">Cancel</button>
          <button onClick={() => onStart(h)} disabled={pending} className="rounded-lg border border-red-500/60 px-3 py-2 text-sm font-medium text-red-300 hover:bg-red-500/10 disabled:opacity-50">
            {pending ? "Starting..." : "Start Roast"}
          </button>
        </div>
      </div>
    </div>
  );
}
