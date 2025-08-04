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

export default function HomePage() {
  const { currentIdea, setCurrentIdea } = useCurrentIdea();
  const { user } = useAuth();
  const { tokenBalance, updateBalanceOptimistically, revertBalance, forceRefreshFromFirestore } = useTokenBalance();
  const [scansRemaining, setScansRemaining] = useState(2);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

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
          
          // Revert optimistic update on error
          if (previousBalance !== null) {
            revertBalance(previousBalance);
          }
          
          if (errorData.error === 'Not enough tokens') {
            alert('You need at least 1 token to analyze an idea. Please purchase more tokens.');
            return;
          }
          
          throw new Error(errorData.error || 'Failed to analyze idea');
        }

        const result = await response.json();
        setAnalysisResult(result.analysis);

        // Update token balance with the actual remaining tokens from the API
        if (result.success && result.updatedTokenBalance !== undefined) {
          updateBalanceOptimistically(result.updatedTokenBalance);
          console.log('Token balance updated from API response:', {
            updatedTokenBalance: result.updatedTokenBalance,
            tokensRemaining: result.tokens_remaining
          });
          
          // Force refresh from Firestore to ensure consistency
          await forceRefreshFromFirestore();
        } else {
          // Fallback to tokens_remaining if updatedTokenBalance is not available
          updateBalanceOptimistically(result.tokens_remaining);
          console.log('Token balance updated from fallback:', {
            tokensRemaining: result.tokens_remaining
          });
          
          // Force refresh from Firestore to ensure consistency
          await forceRefreshFromFirestore();
        }
        
        console.log('Idea analysis completed successfully:', {
          tokensRemaining: result.tokens_remaining,
          analysisScore: result.analysis.overall_score
        });
      } catch (error) {
        console.error('Error analyzing idea:', error);
        
        // Revert optimistic update on error
        if (previousBalance !== null) {
          revertBalance(previousBalance);
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