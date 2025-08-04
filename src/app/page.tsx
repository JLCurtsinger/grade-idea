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

export default function HomePage() {
  const { currentIdea, setCurrentIdea } = useCurrentIdea();
  const { user } = useAuth();
  const { tokenBalance, updateBalanceOptimistically, revertBalance, forceRefreshFromFirestore } = useTokenBalance();
  const [scansRemaining, setScansRemaining] = useState(2);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Force refresh token balance on page mount to ensure fresh data
  useEffect(() => {
    if (user) {
      console.log('Landing page mounted - forcing token balance refresh');
      forceRefreshFromFirestore();
    }
  }, []); // Empty dependency array to run only on mount

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
        alert('You need at least 1 token to analyze an idea. Please purchase more tokens.');
        return;
      }

      // Optimistically update UI to show deduction
      const previousBalance = tokenBalance;
      if (tokenBalance !== null) {
        updateBalanceOptimistically(tokenBalance - 1);
      }

      // Call the grade-idea API for signed-in users
      try {
        const idToken = await user.getIdToken();
        console.log('Calling grade-idea API:', { uid: user.uid, ideaLength: idea.length });
        
        const response = await fetch('/api/grade-idea', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            idea,
            idToken,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          
          // Revert optimistic update and force refresh from Firestore on error
          if (previousBalance !== null) {
            console.log('API call failed - reverting optimistic update');
            await revertBalance(previousBalance);
          }
          
          if (errorData.error === 'Not enough tokens') {
            alert('You need at least 1 token to analyze an idea. Please purchase more tokens.');
            return;
          }
          
          throw new Error(errorData.error || 'Failed to analyze idea');
        }

        const result = await response.json();
        setAnalysisResult(result.analysis);

        // Use only tokenBalance as the single source of truth
        if (result.success && result.tokenBalance !== undefined) {
          console.log('=== TOKEN BALANCE UPDATE ===');
          console.log('Backend response received:', {
            success: result.success,
            tokenBalance: result.tokenBalance
          });
          
          // Update token balance with the verified backend value
          updateBalanceOptimistically(result.tokenBalance);
          console.log('Token balance updated from backend:', {
            previousBalance: tokenBalance,
            newBalance: result.tokenBalance
          });
          
          // Force refresh from Firestore to ensure consistency
          await forceRefreshFromFirestore();
          console.log('Force refresh completed');
        } else {
          console.error('Invalid backend response:', result);
          throw new Error('Invalid response from backend');
        }
        
        console.log('Idea analysis completed successfully:', {
          finalTokenBalance: result.tokenBalance,
          analysisScore: result.analysis.overall_score
        });
      } catch (error) {
        console.error('Error analyzing idea:', error);
        logTokenError(user.uid, error instanceof Error ? error.message : 'Unknown error', 'idea_submission');
        
        // Revert optimistic update and force refresh from Firestore on error
        if (previousBalance !== null) {
          console.log('Error occurred - reverting optimistic update');
          await revertBalance(previousBalance);
        }
        
        alert('Failed to analyze idea. Please try again.');
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