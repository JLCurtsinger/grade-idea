"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Sparkles } from "lucide-react";

interface HeroSectionProps {
  onSubmit: (idea: string) => void;
  tokenBalance?: number | null;
  exampleIdea?: string;
  isGrading?: boolean;
}

export const HeroSection = ({ onSubmit, tokenBalance, exampleIdea, isGrading = false }: HeroSectionProps) => {
  const [idea, setIdea] = useState(exampleIdea || "");
  const [isLoading, setIsLoading] = useState(false);

  const suggestionChips = [
    "AI tool for digital nomads",
    "SaaS for small restaurants",
    "Mobile app for fitness tracking",
    "B2B automation platform"
  ];

  // Update idea when exampleIdea changes
  useEffect(() => {
    if (exampleIdea) {
      setIdea(exampleIdea);
    }
  }, [exampleIdea]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;
    
    setIsLoading(true);
    setTimeout(() => {
      onSubmit(idea);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <section className="relative min-h-screen flex items-center">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-transparent" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-brand/10 rounded-full blur-3xl animate-pulse" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface-elevated border border-border-elevated rounded-full">
              <Sparkles className="w-4 h-4 text-brand" />
              <span className="text-sm font-medium text-foreground-muted">
                Trusted by 10,000+ founders
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-hero">
                Validate your startup idea in{" "}
                <span className="text-gradient">60 seconds</span>
              </h1>
              <p className="text-subhero max-w-lg">
                Founder-grade insights to help you decide what&apos;s worth building.
              </p>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Describe your idea..."
                  className={`input-primary text-lg py-4 pr-36 min-h-[60px] ${isGrading ? 'animate-input-pulse' : ''}`}
                  disabled={isLoading || isGrading}
                  style={{
                    paddingRight: 'calc(8rem + 1rem)', // Account for button width + padding
                  }}
                />
                <Button
                  type="submit"
                  disabled={!idea.trim() || isLoading || isGrading}
                  className="btn-primary-breathing absolute right-2 top-2 bottom-2 h-auto"
                >
                  {isLoading || isGrading ? (
                    <div className="w-5 h-5 border-2 border-brand-foreground/30 border-t-brand-foreground rounded-full animate-spin" />
                  ) : (
                    <>
                      Grade My Idea
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>

              {/* Loading Dots Overlay */}
              {isGrading && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="bg-surface border border-border rounded-lg p-8 shadow-lg max-w-md mx-4">
                    <div className="text-center space-y-4">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-3 h-3 bg-brand rounded-full animate-loading-dots"></div>
                        <div className="w-3 h-3 bg-brand rounded-full animate-loading-dots"></div>
                        <div className="w-3 h-3 bg-brand rounded-full animate-loading-dots"></div>
                      </div>
                      <p className="text-foreground-muted font-medium">Grading your idea...</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Token Balance Display */}
              {tokenBalance !== null && (
                <p className="text-sm text-foreground-muted text-center">
                  You have {tokenBalance} tokens remaining
                </p>
              )}

              {/* Suggestion Chips */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-foreground-subtle">Try:</span>
                {suggestionChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setIdea(chip)}
                    className="px-3 py-1 text-sm bg-surface border border-border rounded-full hover:border-brand/50 hover:bg-surface-elevated transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </form>

            {/* Trust Indicators */}
            <div className="flex items-center gap-6 text-sm text-foreground-subtle">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                <span>Real-time analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-brand rounded-full animate-pulse" />
                <span>AI-powered insights</span>
              </div>
            </div>
          </div>

          {/* Right Preview */}
          <div className="lg:block hidden">
            <div className="relative">
              <div className="card-glow p-8 animate-scale-in">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">Sample Analysis</h3>
                    <div className="px-3 py-1 bg-success/20 text-success border border-success/30 rounded-full text-sm font-medium">
                      Worth Building
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: "Market Potential", score: 85, color: "success" },
                        { label: "Competition", score: 72, color: "brand" },
                        { label: "Monetization", score: 90, color: "success" },
                        { label: "Execution", score: 68, color: "warning" }
                      ].map((metric) => (
                        <div key={metric.label} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-foreground-muted">{metric.label}</span>
                            <span className="font-medium">{metric.score}%</span>
                          </div>
                          <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${
                                metric.color === "success" ? "bg-success" :
                                metric.color === "brand" ? "bg-brand" : "bg-warning"
                              }`}
                              style={{ width: `${metric.score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};