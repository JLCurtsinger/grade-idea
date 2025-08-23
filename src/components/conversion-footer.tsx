"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Zap, RefreshCw, Rocket, X } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { useAuth } from "@/context/AuthContext";
import BuyTokensModal from "@/components/buy-tokens-modal";

interface ConversionFooterProps {
  scansRemaining: number;
  onTryAnother: () => void;
}

export const ConversionFooter = ({ scansRemaining, onTryAnother }: ConversionFooterProps) => {
  const { user, openModal } = useAuth();

  const [isVisible, setIsVisible] = useState(true);
  const [isBuyTokensOpen, setIsBuyTokensOpen] = useState(false);

  // When user clicks "Buy More Tokens" while signed out, we set this flag,
  // open the Sign-In modal, and on auth change we open the Buy Tokens modal.
  const shouldOpenBuyAfterAuthRef = useRef(false);

  const handleCloseFooter = () => setIsVisible(false);

  const handleBuyTokens = () => {
    if (!user) {
      shouldOpenBuyAfterAuthRef.current = true;
      openModal("signin");
      return;
    }
    setIsBuyTokensOpen(true);
  };

  // If the user signs in after clicking "Buy More Tokens", open the modal.
  useEffect(() => {
    if (user && shouldOpenBuyAfterAuthRef.current) {
      shouldOpenBuyAfterAuthRef.current = false;
      setIsBuyTokensOpen(true);
    }
  }, [user]);

  return (
    <>
      {isVisible && (
        <div className="sticky bottom-0 bg-background/80 backdrop-blur-lg border-t border-border p-6">
          <button
            aria-label="Close"
            onClick={handleCloseFooter}
            className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md hover:opacity-80 focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Scan Balance */}
              <Reveal>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-lg">
                    <Zap className="w-4 h-4 text-brand" />
                    <span className="text-sm font-medium">
                      {scansRemaining} free scans remaining
                    </span>
                  </div>
                </div>
              </Reveal>

              {/* Action Buttons */}
              <Reveal delay={0.06}>
                <div className="flex items-center gap-4">
                  <Button 
                    variant="outline" 
                    onClick={onTryAnother}
                    className="btn-secondary"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Another Idea
                  </Button>
                  
                  <Button className="btn-primary" onClick={handleBuyTokens}>
                    <Zap className="w-4 h-4 mr-2" />
                    Buy More Tokens
                  </Button>
                </div>
              </Reveal>
            </div>

            {/* Upsell Card - Only show when scans are low */}
            {scansRemaining <= 1 && (
              <Reveal delay={0.12}>
                <Card className="card-glow p-6 mt-6 animate-scale-in">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Rocket className="w-5 h-5 text-brand" />
                        <h3 className="text-lg font-semibold">Ready to build?</h3>
                      </div>
                      <p className="text-foreground-muted">
                        Generate a complete MVP plan with market analysis, feature roadmap, and technical requirements.
                      </p>
                    </div>
                    <Button className="btn-primary text-lg px-8 py-4">
                      Coming Soon!
                    </Button>
                  </div>
                </Card>
              </Reveal>
            )}
          </div>
        </div>
      )}

      {/* Buy Tokens modal */}
      <BuyTokensModal
        isOpen={isBuyTokensOpen}
        onClose={() => setIsBuyTokensOpen(false)}
      />
    </>
  );
};