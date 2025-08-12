"use client";
import { useMemo } from "react";
import Image from "next/image";

export default function HeroAssurances() {
  const enabled = useMemo(() => process.env.NEXT_PUBLIC_HERO_ASSURANCES === "true", []);
  if (!enabled) return null;

  return (
    <div
      className="mt-2 md:mt-3 text-[13px] text-neutral-400"
      aria-label="What you get"
    >
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <li className="inline-flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
          <span>Get Roasted</span>
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-400" aria-hidden />
          <span>It's Shareable</span>
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-400" aria-hidden />
          <span>AndDownload ready</span>
        </li>
        {/* <li className="inline-flex items-center gap-1.5">
          <span>1</span>
          <span className="inline-flex items-center">
            <Image
              src="/logo.svg"
              alt=""
              width={14}
              height={14}
              className="opacity-80"
            />
          </span>
        </li> */}
      </ul>
    </div>
  );
}
