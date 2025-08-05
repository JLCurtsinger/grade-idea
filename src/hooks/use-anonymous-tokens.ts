import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export const useAnonymousTokens = () => {
  const { user } = useAuth();
  const [anonymousTokens, setAnonymousTokens] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      // User is signed in, no anonymous tokens
      setAnonymousTokens(null);
      return;
    }

    // Check localStorage for anonymous token count
    const stored = localStorage.getItem('anonymousTokens');
    if (stored) {
      const tokens = parseInt(stored, 10);
      setAnonymousTokens(tokens);
    } else {
      // First time anonymous user
      setAnonymousTokens(2);
      localStorage.setItem('anonymousTokens', '2');
    }
  }, [user]);

  const decrementTokens = () => {
    if (!user && anonymousTokens !== null && anonymousTokens > 0) {
      const newTokens = anonymousTokens - 1;
      setAnonymousTokens(newTokens);
      localStorage.setItem('anonymousTokens', newTokens.toString());
      return newTokens;
    }
    return anonymousTokens;
  };

  return {
    anonymousTokens,
    decrementTokens,
  };
}; 