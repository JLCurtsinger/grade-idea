// Client-side price mapping utilities
export const getPriceIdForPlan = (planName: string): string => {
  // These will be resolved server-side in the API route
  const planMap: Record<string, string> = {
    'Basic': 'basic',
    'Standard': 'standard', 
    'Pro': 'pro',
    'Starter Pack': 'starter',
    'Popular Pack': 'popular',
    'Value Pack': 'value',
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