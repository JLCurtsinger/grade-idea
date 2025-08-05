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
import { useAnonymousTokens } from "@/hooks/use-anonymous-tokens";
import { logTokenDisplay, logTokenError } from "@/lib/utils";
import { testGA } from "@/lib/ga-test";
import { submitIdeaForAnalysis } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { currentIdea, setCurrentIdea } = useCurrentIdea();
  const { user } = useAuth();
  const { tokenBalance, updateBalanceOptimistically, revertBalance, forceRefreshFromFirestore } = useTokenBalance();
  const { anonymousTokens, decrementTokens, anonymousUser, isLoading: isAnonymousLoading } = useAnonymousTokens();
  
  // Determine user authentication state
  const isAnonymous = user?.isAnonymous === true;
  const isSignedIn = user && !isAnonymous;
  const [scansRemaining, setScansRemaining] = useState(2);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [exampleIdea, setExampleIdea] = useState<string>("");
  const [isGrading, setIsGrading] = useState(false);
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
    let previousBalance: number | null = null;
    
    try {
      if (!isSignedIn) {
        // Anonymous user - use anonymous API
        console.log('Calling anonymous analyzeIdea API:', { ideaLength: idea.length });
        
        // Ensure anonymous user is available and get Firebase ID token
        if (!anonymousUser || isAnonymousLoading) {
          console.log('Anonymous user not ready, waiting...');
          toast({
            title: "Please Wait",
            description: "Setting up your session. Please try again in a moment.",
            variant: "default",
          });
          setIsGrading(false);
          return;
        }
        
        // Check if anonymous user has tokens
        if (anonymousTokens === null || anonymousTokens < 1) {
          toast({
            title: "No Free Analyses Left",
            description: "You've used all your free analyses. Please sign up to continue.",
            variant: "destructive",
          });
          setIsGrading(false);
          return;
        }
        
        // Get Firebase ID token for anonymous user
        const idToken = await anonymousUser.getIdToken();
        
        if (!idToken) {
          toast({
            title: "Authentication Error",
            description: "Unable to authenticate. Please try again.",
            variant: "destructive",
          });
          setIsGrading(false);
          return;
        }
        
        const response = await fetch('/api/grade-idea-anonymous', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idea, idToken }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          if (data.requiresSignup) {
            toast({
              title: "Free Trial Limit Reached",
              description: "You've used your 2 free idea analyses. Please sign up to continue analyzing ideas.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Analysis Failed",
              description: data.error || "Failed to analyze idea. Please try again.",
              variant: "destructive",
            });
          }
          setIsGrading(false);
          return;
        }

        if (data.success) {
          setAnalysisResult(data.analysis);
          setCurrentIdea(idea);
          
          // Decrement anonymous tokens
          const remainingTokens = await decrementTokens();
          
          // Show remaining tokens message
          if (remainingTokens === 0) {
            toast({
              title: "Last Free Analysis Used",
              description: "You've used your last free analysis. Sign up to continue analyzing ideas!",
              variant: "default",
            });
          } else if (remainingTokens === 1) {
            toast({
              title: "1 Free Analysis Remaining",
              description: "You have 1 free analysis left. Sign up for unlimited access!",
              variant: "default",
            });
          }
        }
      } else {
        // Signed-in user - check token balance
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
        previousBalance = tokenBalance;
        if (tokenBalance !== null) {
          updateBalanceOptimistically(tokenBalance - 1);
        }

        // Call the analyzeIdea API for signed-in users
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
        console.log('Force refresh completed');
        
        console.log('Idea analysis completed successfully:', {
          ideaId: result.ideaId,
          userId: user.uid
        });

                // Redirect to dashboard to show the new idea with modal open
        router.push(`/dashboard?open=${result.ideaId}`);
        setIsGrading(false);
        return;
      }
    } catch (error) {
        console.error('Error analyzing idea:', error);
        logTokenError(user?.uid || 'unknown', error instanceof Error ? error.message : 'Unknown error', 'idea_submission');
        
        // Revert optimistic update and force refresh from Firestore on error (only for signed-in users)
        if (user && previousBalance !== null) {
          console.log('Error occurred - reverting optimistic update');
          await revertBalance(previousBalance);
        }
        
        toast({
          title: "Analysis Failed",
          description: "Failed to analyze idea. Please try again.",
          variant: "destructive",
        });
        setIsGrading(false);
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