"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import CountUp from "@/components/ui/CountUp";

interface HeroSectionProps {
  onSubmit: (idea: string) => void;
  tokenBalance?: number | null;
  exampleIdea?: string;
  isGrading?: boolean;
}

export const HeroSection = ({ onSubmit, tokenBalance, exampleIdea, isGrading = false }: HeroSectionProps) => {
  const [idea, setIdea] = useState(exampleIdea || "");
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs for dynamic padding calculation
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

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

  // Auto-grow effect for textarea
  useEffect(() => {
    const el = inputRef?.current as HTMLTextAreaElement | null;
    if (!el) return;
    const fit = () => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    };
    fit();

    const onResize = () => fit();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [idea]);

  // Dynamic padding calculation effect
  useEffect(() => {
    const btn = buttonRef.current;
    const el = containerRef.current;
    if (!btn || !el) return;

    const setWidth = () => {
      const w = btn.getBoundingClientRect().width;
      el.style.setProperty("--cta-w", `${Math.ceil(w)}px`);
    };

    setWidth();

    const ro = new ResizeObserver(setWidth);
    ro.observe(btn);
    const onResize = () => setWidth();
    window.addEventListener("resize", onResize);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Baseline height and CTA positioning measurement
  useEffect(() => {
    const btn = buttonRef.current;
    const el = containerRef.current;
    if (!btn || !el) return;

    const measureAndPosition = () => {
      // Measure baseline container height (no input text)
      const CH = el.offsetHeight;
      const BH = btn.offsetHeight;
      
      // Get computed styles for precise measurements
      const containerStyles = window.getComputedStyle(el);
      const textareaStyles = window.getComputedStyle(inputRef.current as HTMLTextAreaElement);
      
      const containerPaddingTop = parseFloat(containerStyles.paddingTop);
      const containerPaddingBottom = parseFloat(containerStyles.paddingBottom);
      const textareaPaddingTop = parseFloat(textareaStyles.paddingTop);
      const textareaPaddingBottom = parseFloat(textareaStyles.paddingBottom);
      const textareaLineHeight = parseFloat(textareaStyles.lineHeight);
      
      // Calculate content box height (excluding borders)
      const contentBoxHeight = CH - parseFloat(containerStyles.borderTopWidth) - parseFloat(containerStyles.borderBottomWidth);
      
      // Calculate fixed top offset for centered CTA
      const topOffset = Math.round((contentBoxHeight - BH) / 2);
      
      // Apply fixed top offset
      btn.style.top = `${topOffset}px`;
    };

    measureAndPosition();

    // Recompute on font-size/viewport changes
    const ro = new ResizeObserver(measureAndPosition);
    ro.observe(el);
    ro.observe(btn);
    
    const debouncedResize = debounce(measureAndPosition, 100);
    window.addEventListener("resize", debouncedResize);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", debouncedResize);
    };
  }, []);

  // Debounce utility
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

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
            <Reveal>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface-elevated border border-border-elevated rounded-full">
                <Sparkles size={16} strokeWidth={2} aria-hidden="true" className="text-brand" />
                <span className="text-sm font-medium text-foreground-muted">
                  Trusted by <CountUp to={10000} />+ founders
                </span>
              </div>
            </Reveal>

            {/* Headline */}
            <div className="space-y-4">
              <Reveal>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                  Validate your startup idea <span className="accent-text-gradient glow-pulse">in seconds</span>
                </h1>
              </Reveal>
              <Reveal delay={0.08}>
                <p className="text-subhero max-w-lg">
                  Real-time insights to help you decide what&apos;s worth building.
                </p>
              </Reveal>
            </div>

            {/* Input Form */}
            <Reveal delay={0.14}>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div
                  ref={containerRef}
                  className={`
                    bg-transparent border border-border rounded-lg px-4 text-foreground placeholder:text-foreground-subtle focus:border-brand focus:ring-1 focus:ring-brand transition-all duration-200 outline-none relative w-full overflow-hidden max-sm:pr-2 max-sm:pr-[env(safe-area-inset-right)]
                    ${isGrading ? 'animate-input-pulse' : ''}
                  `}
                >
                  <textarea
                    ref={inputRef}
                    id="idea-input"
                    name="idea"
                    aria-multiline="true"
                    rows={1}
                    value={idea}
                    onChange={(e) => {
                      setIdea(e.target.value);
                      const el = inputRef?.current as HTMLTextAreaElement | null;
                      if (el) {
                        el.style.height = "auto";
                        el.style.height = `${el.scrollHeight}px`;
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e as any);
                      }
                    }}
                    disabled={isLoading || isGrading}
                    placeholder="Describe your idea..."
                    style={{ paddingRight: `calc(var(--cta-w, 0px) + 12px)` }}
                    className="
                      flex-1 bg-transparent border-0 outline-none ring-0
                      text-lg leading-6 pt-[9px] pb-[7px] min-h-[40px]
                      whitespace-pre-wrap break-words
                      resize-none overflow-hidden
                      text-foreground placeholder:text-[15px] placeholder:leading-6 placeholder:text-foreground-subtle
                    "
                  />

                  <Button
                    ref={buttonRef}
                    type="submit"
                    disabled={!idea.trim() || isLoading || isGrading}
                    className="
                      absolute right-2 h-10
                      btn-primary-breathing px-4 py-1 max-sm:px-2 max-sm:right-0.5
                    "
                  >
                    {isLoading || isGrading ? (
                      <div className="w-5 h-5 border-2 border-brand-foreground/30 border-t-brand-foreground rounded-full animate-spin" />
                    ) : (
                      <>
                        Grade My Idea
                        <ArrowRight size={16} strokeWidth={2} aria-hidden="true" className="ml-2" />
                      </>
                    )}
                  </Button>
                </div>

                {/* Loading Dots Overlay */}
                {isGrading && (
                  <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-surface border border-border rounded-lg p-8 shadow-lg max-w-md mx-4 min-h-[120px]">
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
                <div className="min-h-[20px] flex items-center justify-center">
                  {tokenBalance !== null && (
                    <p className="text-sm text-foreground-muted text-center">
                      You have {tokenBalance} tokens remaining
                    </p>
                  )}
                </div>

                {/* Suggestion Chips */}
                <div className="flex flex-wrap gap-2 min-h-[32px]">
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
            </Reveal>

            {/* Trust Indicators */}
            <Reveal delay={0.2}>
              <div className="flex items-center gap-6 text-sm text-foreground-subtle min-h-[20px]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  <span>Real-time analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-brand rounded-full animate-pulse" />
                  <span>AI-powered insights</span>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Right Preview */}
          <div className="lg:block hidden">
            <Reveal delay={0.2}>
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
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
};
