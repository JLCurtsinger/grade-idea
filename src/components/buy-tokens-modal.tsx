"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Coins } from "lucide-react";
import { useStripeCheckout } from "@/hooks/use-stripe-checkout";

interface BuyTokensModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const tokenPlans = [
  {
    name: "Starter Pack",
    price: "$5",
    tokens: 10,
    costPerToken: "$0.50",
    description: "Perfect for trying out the service"
  },
  {
    name: "Popular Pack", 
    price: "$10",
    tokens: 25,
    costPerToken: "$0.40",
    description: "Most popular choice for regular users"
  },
  {
    name: "Value Pack",
    price: "$20", 
    tokens: 60,
    costPerToken: "$0.33",
    description: "Best value for power users"
  }
];

export const BuyTokensModal = ({ isOpen, onClose }: BuyTokensModalProps) => {
  const { createCheckoutSession, isLoading, error } = useStripeCheckout();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handlePlanSelect = async (planName: string) => {
    setSelectedPlan(planName);
    await createCheckoutSession(planName);
    onClose();
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Choose Your Token Pack
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          <div className="grid gap-4">
            {tokenPlans.map((plan) => (
              <Card 
                key={plan.name}
                className="p-4 hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-brand/30"
                onClick={() => handlePlanSelect(plan.name)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand/20 rounded-lg">
                      <Coins className="w-4 h-4 text-brand" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-foreground-muted">
                        {plan.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-foreground">
                      {plan.price}
                    </div>
                    <div className="text-sm text-foreground-muted">
                      {plan.tokens} tokens
                    </div>
                    <div className="text-xs text-foreground-subtle">
                      {plan.costPerToken} per token
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {isLoading && (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin"></div>
                <span className="text-sm text-foreground-muted">
                  Processing your selection...
                </span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 