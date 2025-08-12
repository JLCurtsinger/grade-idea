"use client";
import Image from "next/image";
import React from "react";

type Props = {
  className?: string;
  alt?: string;
};

export default function TokenIcon({ className = "inline-block h-4 w-4 align-[-2px]", alt = "token" }: Props) {
  return (
    <Image
      src="/logo.svg" // use the existing logo.svg in /public
      width={16}
      height={16}
      alt={alt}
      className={className}
      priority={false}
    />
  );
}
