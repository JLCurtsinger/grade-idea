"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { HeroSection } from "@/components/hero-section";
import { ResultsSection } from "@/components/results-section";
import { ConversionFooter } from "@/components/conversion-footer";

export default function HomePage() {
  const [currentIdea, setCurrentIdea] = useState<string | null>(null);
  const [scansRemaining, setScansRemaining] = useState(2);
  const router = useRouter();
  const pathname = usePathname();

  // Reset state and scroll to top when navigating to homepage
  useEffect(() => {
    if (typeof window !== 'undefined' && pathname === '/') {
      // Reset state when navigating back to homepage
      setCurrentIdea(null);
      setScansRemaining(2);
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pathname]); // Run when pathname changes

  const handleIdeaSubmit = (idea: string) => {
    setCurrentIdea(idea);
    setScansRemaining(prev => Math.max(0, prev - 1));
  };

  const handleTryAnother = () => {
    setCurrentIdea(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {!currentIdea ? (
        <HeroSection onSubmit={handleIdeaSubmit} />
      ) : (
        <>
          <ResultsSection idea={currentIdea} />
          <ConversionFooter 
            scansRemaining={scansRemaining}
            onTryAnother={handleTryAnother}
          />
        </>
      )}
    </div>
  );
} 