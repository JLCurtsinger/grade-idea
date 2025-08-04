import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { validateAndNormalizePlan } from '@/lib/pricing';

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
      // Validate and normalize plan name
      console.log('=== FRONTEND CHECKOUT REQUEST ===');
      console.log('Original plan name:', planName);
      
      const normalizedPlan = validateAndNormalizePlan(planName);
      console.log('Normalized plan name:', normalizedPlan);

      // Get Firebase ID token for authentication
      const idToken = await user.getIdToken();
      
      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          planName,
          userId: user.uid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Checkout API error:', errorData);
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      console.log('Checkout session created, redirecting to:', url);
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (err) {
      console.error('Checkout error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during checkout';
      setError(errorMessage);
      
      // Show user-friendly error
      if (errorMessage.includes('Invalid plan name')) {
        alert('Invalid plan selected. Please try again or contact support.');
      } else {
        alert(`Checkout failed: ${errorMessage}`);
      }
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