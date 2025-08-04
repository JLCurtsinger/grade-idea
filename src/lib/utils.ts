import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Comprehensive token transaction logger for both frontend and backend
export function logTokenTransaction(stage: string, data: Record<string, any>) {
  const log = {
    stage,
    timestamp: new Date().toISOString(),
    ...data,
  };
  
  if (typeof window !== 'undefined') {
    // Frontend
    console.log('[TOKEN_TRANSACTION]', log);
  } else {
    // Backend
    console.info('[TOKEN_TRANSACTION]', log);
  }
  return log;
}

// Specific logging functions for different token operations
export function logTokenFetch(uid: string, balance: number, source: string) {
  return logTokenTransaction('FETCH', {
    uid,
    balance,
    source, // 'firestore', 'cache', 'optimistic'
    location: typeof window !== 'undefined' ? window.location.pathname : 'api'
  });
}

export function logTokenUpdate(uid: string, previousBalance: number, newBalance: number, reason: string) {
  return logTokenTransaction('UPDATE', {
    uid,
    previousBalance,
    newBalance,
    reason, // 'deduction', 'purchase', 'revert', 'optimistic'
    location: typeof window !== 'undefined' ? window.location.pathname : 'api'
  });
}

export function logTokenError(uid: string, error: string, context: string) {
  return logTokenTransaction('ERROR', {
    uid,
    error,
    context,
    location: typeof window !== 'undefined' ? window.location.pathname : 'api'
  });
}

export function logTokenDisplay(uid: string, balance: number, page: string) {
  return logTokenTransaction('DISPLAY', {
    uid,
    balance,
    page,
    timestamp: new Date().toISOString()
  });
}
