"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function NotFound() {
  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route"
    );
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-foreground">404</h1>
        <p className="text-xl text-foreground-muted mb-4">Oops! Page not found</p>
        <Link href="/" className="text-brand hover:text-brand/80 underline">
          Return to Home
        </Link>
      </div>
    </div>
  );
} 