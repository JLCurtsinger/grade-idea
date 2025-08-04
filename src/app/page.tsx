"use client";

import { useState, useEffect } from "react";
import { HeroSection } from "@/components/hero-section";
import { ResultsSection } from "@/components/results-section";
import { ConversionFooter } from "@/components/conversion-footer";
import { FeaturesSection } from "@/components/features-section";
import { PricingSection } from "@/components/pricing-section";
import { useCurrentIdea } from "@/context/CurrentIdeaContext";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function HomePage() {
  const { currentIdea, setCurrentIdea } = useCurrentIdea();
  const { user } = useAuth();
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [scansRemaining, setScansRemaining] = useState(2);

  // Fetch token balance for logged-in users
  useEffect(() => {
    const fetchTokens = async () => {
      if (!user) {
        setTokenBalance(null);
        return;
      }
      
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTokenBalance(docSnap.data().token_balance ?? 0);
        } else {
          setTokenBalance(0);
        }
      } catch (error) {
        console.error('Error fetching token balance:', error);
        setTokenBalance(0);
      }
    };

    fetchTokens();
  }, [user]);

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