"use client";

import { useState } from "react";
import { HeroSection } from "@/components/hero-section";
import { ResultsSection } from "@/components/results-section";
import { ConversionFooter } from "@/components/conversion-footer";
import { FeaturesSection } from "@/components/features-section";
import { useCurrentIdea } from "@/context/CurrentIdeaContext";

export default function HomePage() {
  const { currentIdea, setCurrentIdea } = useCurrentIdea();
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
      {!currentIdea ? (
        <>
          <HeroSection onSubmit={handleIdeaSubmit} />
          <FeaturesSection />
        </>
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