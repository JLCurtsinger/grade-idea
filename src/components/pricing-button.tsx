"use client";

import { Button } from "@/components/ui/button";
import { useStripeCheckout } from "@/hooks/use-stripe-checkout";
import { useAuth } from "@/context/AuthContext";

interface PricingButtonProps {
  planName: string;
  buttonText: string;
  variant?: "default" | "outline";
  className?: string;
  disabled?: boolean;
}

export const PricingButton = ({ 
  planName, 
  buttonText, 
  variant = "default",
  className = "",
  disabled = false 
}: PricingButtonProps) => {
  const { createCheckoutSession, isLoading } = useStripeCheckout();
  const { user } = useAuth();

  const handleClick = async () => {
    if (!user) {
      alert('Please sign in to purchase tokens. You can sign in using the button in the header.');
      return;
    }

    await createCheckoutSession(planName);
  };

  return (
    <Button
      variant={variant}
      className={className}
      onClick={handleClick}
      disabled={isLoading || disabled}
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
          Processing...
        </>
      ) : (
        buttonText
      )}
    </Button>
  );
}; 