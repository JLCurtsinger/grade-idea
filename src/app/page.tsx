"use client";

import { useState, useEffect } from "react";
import { HeroSection } from "@/components/hero-section";
import { ResultsSection } from "@/components/results-section";
import { ConversionFooter } from "@/components/conversion-footer";
import { useCurrentIdea } from "@/context/CurrentIdeaContext";
import { useAuth } from "@/context/AuthContext";
import { useTokenBalance } from "@/hooks/use-token-balance";
import { submitIdeaForAnalysis, submitIdeaForMockAnalysis } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';

// Dynamic imports for below-the-fold components
const HowItWorks = dynamic(() => import('@/components/HowItWorks').then(mod => ({ default: mod.default })), { ssr: false });
const FeaturesSection = dynamic(() => import('@/components/features-section').then(mod => ({ default: mod.FeaturesSection })), { ssr: false });
const PricingSection = dynamic(() => import('@/components/pricing-section').then(mod => ({ default: mod.PricingSection })), { ssr: false });

export default function HomePage() {
  const { currentIdea, setCurrentIdea } = useCurrentIdea();
  const { user } = useAuth();
  const { tokenBalance, updateBalanceOptimistically, revertBalance, forceRefreshFromFirestore } = useTokenBalance();
  const [scansRemaining, setScansRemaining] = useState(2);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [exampleIdea, setExampleIdea] = useState<string>("");
  const [isGrading, setIsGrading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Force refresh token balance on page mount to ensure fresh data
  useEffect(() => {
    if (user) {
      forceRefreshFromFirestore();
    }
  }, []); // Empty dependency array to run only on mount

  // Handle example parameter from URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const example = urlParams.get('example');
      if (example) {
        const decodedExample = decodeURIComponent(example);
        setExampleIdea(decodedExample);
        // Clear the URL parameter
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, []);

  const handleIdeaSubmit = async (idea: string) => {
    setIsGrading(true);
    
    if (!user) {
      // Guest user - use mock analysis (no limits)
      const used = parseInt(localStorage.getItem("guestScansUsed") || "0", 10);
      localStorage.setItem("guestScansUsed", (used + 1).toString());

      try {
        const result = await submitIdeaForMockAnalysis(idea);

        if (!result.success) {
          throw new Error('error' in result ? result.error : 'Failed to analyze idea');
        }

        // Success - show mock data
        setCurrentIdea(idea);
        setAnalysisResult(result.analysis);
        setScansRemaining(prev => Math.max(0, prev - 1));
        setIsGrading(false);
        return;
      } catch (error) {
        toast({
          title: "Analysis Failed",
          description: "Failed to analyze idea. Please try again.",
          variant: "destructive",
        });
        setIsGrading(false);
        return;
      }
    } else {
      // Signed-in user - use real analysis
      // Check token balance for signed-in users
      if (tokenBalance !== null && tokenBalance < 1) {
        toast({
          title: "Insufficient Tokens",
          description: "You need at least 1 token to analyze an idea. Please purchase more tokens.",
          variant: "destructive",
        });
        setIsGrading(false);
        return;
      }

      // Optimistically update UI to show deduction
      const previousBalance = tokenBalance;
      if (tokenBalance !== null) {
        updateBalanceOptimistically(tokenBalance - 1);
      }

      // Call the analyzeIdea API for signed-in users
      try {
        const result = await submitIdeaForAnalysis(idea, user);

        if (!result.success) {
          // Revert optimistic update and force refresh from Firestore on error
          if (previousBalance !== null) {
            await revertBalance(previousBalance);
          }
          
          if ('error' in result && result.error === 'Not enough tokens') {
            toast({
              title: "Insufficient Tokens",
              description: "You need at least 1 token to analyze an idea. Please purchase more tokens.",
              variant: "destructive",
            });
            setIsGrading(false);
            return;
          }
          
          throw new Error('error' in result ? result.error : 'Failed to analyze idea');
        }

        // Success - show toast and redirect to dashboard
        toast({
          title: "Analysis Complete!",
          description: "Your idea has been analyzed and saved to your dashboard.",
          variant: "default",
        });

        // Force refresh from Firestore to ensure consistency
        await forceRefreshFromFirestore();
        
        // Redirect to dashboard to show the new idea with modal open
        router.push(`/dashboard?open=${result.ideaId}`);
        setIsGrading(false);
        return;
      } catch (error) {
        // Revert optimistic update and force refresh from Firestore on error
        if (previousBalance !== null) {
          await revertBalance(previousBalance);
        }
        
        toast({
          title: "Analysis Failed",
          description: "Failed to analyze idea. Please try again.",
          variant: "destructive",
        });
        setIsGrading(false);
        return;
      }
    }
  };

  const handleTryAnother = () => {
    setCurrentIdea(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {!currentIdea ? (
        <>
          <HeroSection onSubmit={handleIdeaSubmit} tokenBalance={tokenBalance} exampleIdea={exampleIdea} isGrading={isGrading} />
          <HowItWorks />
          <FeaturesSection />
          <PricingSection />
        </>
      ) : (
        <>
          <ResultsSection idea={currentIdea} analysis={analysisResult} />
          <ConversionFooter 
            scansRemaining={scansRemaining}
            onTryAnother={handleTryAnother}
          />
        </>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How does GradeIdea.cc validate my startup idea?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "GradeIdea.cc uses AI to evaluate your startup idea across market potential, monetization clarity, competitive differentiation, execution difficulty, and growth potential."
            }
          },
          {
            "@type": "Question",
            "name": "Is GradeIdea.cc free to use?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Your first idea validation is free. Additional scans require tokens, which can be purchased on the site."
            }
          },
          {
            "@type": "Question",
            "name": "What information do I need to provide?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "You only need to describe your idea in 1–3 sentences. GradeIdea.cc generates a full founder-grade report."
            }
          },
          {
            "@type": "Question",
            "name": "Will my idea be kept private?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, ideas you submit are private by default unless you choose to make them public."
            }
          }
        ]
      }) }} />
    </div>
  );
} 