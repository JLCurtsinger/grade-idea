import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { logTokenFetch, logTokenUpdate, logTokenError, logTokenDisplay } from '@/lib/utils';

export const useTokenBalance = () => {
  const { user } = useAuth();
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchTokenBalance = async () => {
    if (!user) {
      setTokenBalance(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const balance = docSnap.data().token_balance ?? 0;
        setTokenBalance(balance);
        logTokenFetch(user.uid, balance, 'firestore');
        logTokenDisplay(user.uid, balance, window.location.pathname);
      } else {
        setTokenBalance(0);
        logTokenFetch(user.uid, 0, 'firestore_not_found');
        logTokenDisplay(user.uid, 0, window.location.pathname);
      }
    } catch (error) {
      console.error('Error fetching token balance:', error);
      logTokenError(user?.uid || 'unknown', error instanceof Error ? error.message : 'Unknown error', 'fetch_token_balance');
      setTokenBalance(0);
    } finally {
      setLoading(false);
    }
  };

  // Fetch token balance when user changes or refresh is triggered
  useEffect(() => {
    fetchTokenBalance();
  }, [user, refreshKey]);

  // Reset state when user changes to prevent stale data
  useEffect(() => {
    if (!user) {
      setTokenBalance(null);
      setLoading(false);
    }
  }, [user]);

  // Refresh token balance manually
  const refreshBalance = () => {
    console.log('Manually refreshing token balance...');
    setRefreshKey(prev => prev + 1);
  };

  // Optimistically update balance (for immediate UI feedback)
  const updateBalanceOptimistically = (newBalance: number) => {
    const previousBalance = tokenBalance;
    logTokenUpdate(user?.uid || 'unknown', previousBalance || 0, newBalance, 'optimistic');
    setTokenBalance(newBalance);
    
    // Always force refresh from Firestore after optimistic update
    forceRefreshFromFirestore();
  };

  // Revert optimistic update and force refresh from Firestore
  const revertBalance = async (originalBalance: number) => {
    const currentBalance = tokenBalance;
    logTokenUpdate(user?.uid || 'unknown', currentBalance || 0, originalBalance, 'revert');
    
    // First revert to original balance
    setTokenBalance(originalBalance);
    
    // Then force refresh from Firestore to ensure consistency
    await forceRefreshFromFirestore();
  };

  // Force refresh from Firestore (for after deductions)
  const forceRefreshFromFirestore = async () => {
    if (!user) return;
    
    try {
      console.log('Force refreshing token balance from Firestore...');
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const balance = docSnap.data().token_balance ?? 0;
        setTokenBalance(balance);
        logTokenFetch(user.uid, balance, 'force_refresh');
        logTokenDisplay(user.uid, balance, window.location.pathname);
      } else {
        setTokenBalance(0);
        logTokenFetch(user.uid, 0, 'force_refresh_not_found');
        logTokenDisplay(user.uid, 0, window.location.pathname);
      }
    } catch (error) {
      console.error('Error during force refresh:', error);
      logTokenError(user.uid, error instanceof Error ? error.message : 'Unknown error', 'force_refresh');
    }
  };

  return {
    tokenBalance,
    loading,
    refreshBalance,
    updateBalanceOptimistically,
    revertBalance,
    forceRefreshFromFirestore,
  };
}; 