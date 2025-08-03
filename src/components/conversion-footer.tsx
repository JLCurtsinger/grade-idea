"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Zap, RefreshCw, Rocket } from "lucide-react";

interface ConversionFooterProps {
  scansRemaining: number;
  onTryAnother: () => void;
}

export const ConversionFooter = ({ scansRemaining, onTryAnother }: ConversionFooterProps) => {
  return (
    <div className="sticky bottom-0 bg-background/80 backdrop-blur-lg border-t border-border p-6">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Scan Balance */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-lg">
              <Zap className="w-4 h-4 text-brand" />
              <span className="text-sm font-medium">
                {scansRemaining} free scans remaining
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={onTryAnother}
              className="btn-secondary"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Another Idea
            </Button>
            
            <Button className="btn-primary">
              <Zap className="w-4 h-4 mr-2" />
              Buy More Scans
            </Button>
          </div>
        </div>

        {/* Upsell Card - Only show when scans are low */}
        {scansRemaining <= 1 && (
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
                Generate MVP Plan - $29
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};