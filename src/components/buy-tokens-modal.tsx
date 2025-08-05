"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Coins } from "lucide-react";
import { useStripeCheckout } from "@/hooks/use-stripe-checkout";
import { useAuth } from "@/context/AuthContext";

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
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const { createCheckoutSession, isLoading } = useStripeCheckout();
  const { user } = useAuth();

  const handlePlanSelect = async (planName: string) => {
    console.log('Modal selected plan:', planName);
    
    if (!user) {
      alert('Please sign in to purchase tokens. You can sign in using the button in the header.');
      return;
    }

    try {
      await createCheckoutSession(planName);
      onClose();
    } catch (error) {
      console.error('Modal checkout error:', error);
      // Error is already handled in the hook with user-friendly alerts
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Choose Your Token Pack
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4">
            {tokenPlans.map((plan) => (
              <Card 
                key={plan.name}
                className="p-4 hover:shadow-md transition-shadow border-2 hover:border-brand/30"
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
                
                <div className="mt-4">
                  <Button
                    className="w-full"
                    onClick={() => handlePlanSelect(plan.name)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      "Buy Tokens"
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>


        </div>
      </DialogContent>
    </Dialog>
  );
}; 