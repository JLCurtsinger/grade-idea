"use client";

import { useState, useEffect } from "react";
import { HeroSection } from "@/components/hero-section";
import { ResultsSection } from "@/components/results-section";
import { ConversionFooter } from "@/components/conversion-footer";
import { FeaturesSection } from "@/components/features-section";
import { PricingSection } from "@/components/pricing-section";
import { useCurrentIdea } from "@/context/CurrentIdeaContext";
import { useAuth } from "@/context/AuthContext";
import { useTokenBalance } from "@/hooks/use-token-balance";
import { logTokenDisplay, logTokenError } from "@/lib/utils";
import { testGA } from "@/lib/ga-test";
import { submitIdeaForAnalysis } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { currentIdea, setCurrentIdea } = useCurrentIdea();
  const { user } = useAuth();
  const { tokenBalance, updateBalanceOptimistically, revertBalance, forceRefreshFromFirestore } = useTokenBalance();
  const [scansRemaining, setScansRemaining] = useState(2);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Force refresh token balance on page mount to ensure fresh data
  useEffect(() => {
    if (user) {
      console.log('Landing page mounted - forcing token balance refresh');
      forceRefreshFromFirestore();
    }
  }, []); // Empty dependency array to run only on mount

  // Test Google Analytics in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      testGA();
    }
  }, []);

  // Log token balance display
  useEffect(() => {
    if (user && tokenBalance !== null) {
      logTokenDisplay(user.uid, tokenBalance, 'landing');
    }
  }, [user, tokenBalance]);

  const handleIdeaSubmit = async (idea: string) => {
    // Guest scan tracking
    if (!user) {
      const used = parseInt(localStorage.getItem("guestScansUsed") || "0", 10);
      if (used >= 2) {
        // Show login prompt (existing modal will handle this)
        alert('Please sign in to continue analyzing ideas. You can sign in using the button in the header.');
        return;
      } else {
        localStorage.setItem("guestScansUsed", (used + 1).toString());
      }
    } else {
      // Check token balance for signed-in users
      if (tokenBalance !== null && tokenBalance < 1) {
        toast({
          title: "Insufficient Tokens",
          description: "You need at least 1 token to analyze an idea. Please purchase more tokens.",
          variant: "destructive",
        });
        return;
      }

      // Optimistically update UI to show deduction
      const previousBalance = tokenBalance;
      if (tokenBalance !== null) {
        updateBalanceOptimistically(tokenBalance - 1);
      }

      // Call the analyzeIdea API for signed-in users
      try {
        console.log('Calling analyzeIdea API:', { uid: user.uid, ideaLength: idea.length });
        
        const result = await submitIdeaForAnalysis(idea, user);

        if (!result.success) {
          // Revert optimistic update and force refresh from Firestore on error
          if (previousBalance !== null) {
            console.log('API call failed - reverting optimistic update');
            await revertBalance(previousBalance);
          }
          
          if ('error' in result && result.error === 'Not enough tokens') {
            toast({
              title: "Insufficient Tokens",
              description: "You need at least 1 token to analyze an idea. Please purchase more tokens.",
              variant: "destructive",
            });
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
        console.log('Force refresh completed');
        
        console.log('Idea analysis completed successfully:', {
          ideaId: result.ideaId,
          userId: user.uid
        });

        // Redirect to dashboard to show the new idea
        router.push('/dashboard');
        return;
      } catch (error) {
        console.error('Error analyzing idea:', error);
        logTokenError(user.uid, error instanceof Error ? error.message : 'Unknown error', 'idea_submission');
        
        // Revert optimistic update and force refresh from Firestore on error
        if (previousBalance !== null) {
          console.log('Error occurred - reverting optimistic update');
          await revertBalance(previousBalance);
        }
        
        toast({
          title: "Analysis Failed",
          description: "Failed to analyze idea. Please try again.",
          variant: "destructive",
        });
        return;
      }
    }

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
          <HeroSection onSubmit={handleIdeaSubmit} tokenBalance={tokenBalance} />
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
    </div>
  );
} 