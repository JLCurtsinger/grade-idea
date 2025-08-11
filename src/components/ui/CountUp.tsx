"use client";
import { useEffect, useRef, useState } from "react";

export default function CountUp({ to, duration = 1.0, precision = 0, className = "" }: { to: number; duration?: number; precision?: number; className?: string; }) {
  const el = useRef<HTMLSpanElement>(null);
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasRun) setHasRun(true);
    }, { threshold: 0.3 });
    if (el.current) obs.observe(el.current);
    return () => obs.disconnect();
  }, [hasRun]);

  useEffect(() => {
    if (!hasRun) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (el.current) el.current.textContent = to.toFixed(precision);
      return;
    }
    let start: number | null = null;
    const from = 0, diff = to - from, dur = duration * 1000;
    const step = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      if (el.current) el.current.textContent = (from + diff * eased).toFixed(precision);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [hasRun, to, duration, precision]);

  return <span ref={el} className={className}>{(0).toFixed(precision)}</span>;
}
