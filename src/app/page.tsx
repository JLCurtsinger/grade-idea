"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { ResultsSection } from "@/components/results-section";
import { ConversionFooter } from "@/components/conversion-footer";

export default function HomePage() {
  const [currentIdea, setCurrentIdea] = useState<string | null>(null);
  const [scansRemaining, setScansRemaining] = useState(2);

  const handleIdeaSubmit = (idea: string) => {
    setCurrentIdea(idea);
    setScansRemaining(prev => Math.max(0, prev - 1));
  };

  const handleTryAnother = () => {
    setCurrentIdea(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
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