"use client";
import React from "react";
import TokenIcon from "./TokenIcon";

export default function TokenCount({ value, className = "" }: { value: number | string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} aria-label={`${value} tokens`}>
      <span>{value}</span>
      <TokenIcon />
    </span>
  );
}
