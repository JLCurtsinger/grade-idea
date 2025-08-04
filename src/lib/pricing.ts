// Client-side price mapping utilities
export const getPriceIdForPlan = (planName: string): string => {
  const planMap: Record<string, string> = {
    'Basic': process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC || '',
    'Standard': process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STANDARD || '',
    'Pro': process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO || '',
    'Starter Pack': process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER || '',
    'Popular Pack': process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_POPULAR || '',
    'Value Pack': process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_VALUE || '',
  };
  
  return planMap[planName] || '';
};

// Token count mapping for display purposes
export const getTokenCountForPlan = (planName: string): number => {
  const tokenMap: Record<string, number> = {
    'Basic': 12,
    'Standard': 28,
    'Pro': 45,
    'Starter Pack': 10,
    'Popular Pack': 25,
    'Value Pack': 60,
  };
  
  return tokenMap[planName] || 0;
}; 