import Stripe from 'stripe';

// Initialize Stripe with secret key (server-side only)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-07-30.basil',
});

// Price ID to token count mapping
export const tokenMap: Record<string, number> = {
  [process.env.STRIPE_PRICE_ID_STARTER!]: 10,
  [process.env.STRIPE_PRICE_ID_POPULAR!]: 25,
  [process.env.STRIPE_PRICE_ID_VALUE!]: 60,
  [process.env.STRIPE_PRICE_ID_BASIC!]: 12,
  [process.env.STRIPE_PRICE_ID_STANDARD!]: 28,
  [process.env.STRIPE_PRICE_ID_PRO!]: 45,
};

// Reverse mapping for display purposes
export const getTokenCountForPriceId = (priceId: string): number => {
  return tokenMap[priceId] || 0;
};

// Get price ID for plan name
export const getPriceIdForPlan = (planName: string): string => {
  const planMap: Record<string, string> = {
    'Basic': process.env.STRIPE_PRICE_ID_BASIC!,
    'Standard': process.env.STRIPE_PRICE_ID_STANDARD!,
    'Pro': process.env.STRIPE_PRICE_ID_PRO!,
    'Starter Pack': process.env.STRIPE_PRICE_ID_STARTER!,
    'Popular Pack': process.env.STRIPE_PRICE_ID_POPULAR!,
    'Value Pack': process.env.STRIPE_PRICE_ID_VALUE!,
  };
  
  return planMap[planName] || '';
};

// Validate price ID exists
export const isValidPriceId = (priceId: string): boolean => {
  return Object.keys(tokenMap).includes(priceId);
}; 