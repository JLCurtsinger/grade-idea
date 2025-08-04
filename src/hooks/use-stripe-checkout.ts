import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getPriceIdForPlan } from '@/lib/pricing';

export const useStripeCheckout = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const createCheckoutSession = async (planName: string) => {
    if (!user) {
      setError('You must be signed in to purchase tokens');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get Firebase ID token for authentication
      const idToken = await user.getIdToken();
      
      // Get price ID for the plan
      const priceId = getPriceIdForPlan(planName);
      

      
      if (!priceId) {
        throw new Error('Invalid plan selected');
      }

      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          priceId,
          userId: user.uid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createCheckoutSession,
    isLoading,
    error,
  };
}; 