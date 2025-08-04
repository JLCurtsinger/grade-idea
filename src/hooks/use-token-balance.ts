import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
        console.log('Token balance fetched from Firestore:', { uid: user.uid, balance });
      } else {
        setTokenBalance(0);
        console.log('User document not found, setting balance to 0');
      }
    } catch (error) {
      console.error('Error fetching token balance:', error);
      setTokenBalance(0);
    } finally {
      setLoading(false);
    }
  };

  // Fetch token balance when user changes or refresh is triggered
  useEffect(() => {
    fetchTokenBalance();
  }, [user, refreshKey]);

  // Refresh token balance manually
  const refreshBalance = () => {
    console.log('Manually refreshing token balance...');
    setRefreshKey(prev => prev + 1);
  };

  // Optimistically update balance (for immediate UI feedback)
  const updateBalanceOptimistically = (newBalance: number) => {
    console.log('Optimistically updating token balance:', { 
      previousBalance: tokenBalance, 
      newBalance 
    });
    setTokenBalance(newBalance);
  };

  // Revert optimistic update
  const revertBalance = (originalBalance: number) => {
    console.log('Reverting optimistic token balance update:', { 
      currentBalance: tokenBalance, 
      originalBalance 
    });
    setTokenBalance(originalBalance);
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
        console.log('Force refresh completed - new balance:', { uid: user.uid, balance });
      } else {
        setTokenBalance(0);
        console.log('Force refresh - user document not found, setting to 0');
      }
    } catch (error) {
      console.error('Error during force refresh:', error);
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