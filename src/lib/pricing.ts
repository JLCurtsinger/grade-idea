// Client-side price mapping utilities

// Robust plan name normalization
export const normalizePlanName = (plan: string): 'basic' | 'standard' | 'pro' | 'starter' | 'popular' | 'value' | null => {
  if (!plan) return null;
  
  const cleaned = plan.trim().toLowerCase();
  
  // Handle various input formats
  if (cleaned.includes('starter') || cleaned === 'starter pack') return 'starter';
  if (cleaned.includes('popular') || cleaned === 'popular pack') return 'popular';
  if (cleaned.includes('value') || cleaned === 'value pack') return 'value';
  if (cleaned.includes('basic')) return 'basic';
  if (cleaned.includes('standard')) return 'standard';
  if (cleaned.includes('pro')) return 'pro';
  
  return null;
};

// Validate plan name and return normalized version
export const validateAndNormalizePlan = (planName: string): string => {
  const normalized = normalizePlanName(planName);
  if (!normalized) {
    throw new Error(`Invalid plan name: "${planName}". Valid plans are: Starter Pack, Popular Pack, Value Pack, Basic, Standard, Pro`);
  }
  return normalized;
};

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

// Get token count for normalized plan name
export const getTokenCountForNormalizedPlan = (normalizedPlan: string): number => {
  const tokenMap: Record<string, number> = {
    'basic': 12,
    'standard': 28,
    'pro': 45,
    'starter': 10,
    'popular': 25,
    'value': 60,
  };
  
  return tokenMap[normalizedPlan] || 0;
}; 