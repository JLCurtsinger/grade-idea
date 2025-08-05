import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Timestamp } from 'firebase/firestore';

export const useAnonymousTokens = () => {
  const { user } = useAuth();
  const [anonymousTokens, setAnonymousTokens] = useState<number | null>(null);
  const [anonymousUser, setAnonymousUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      // User is signed in, no anonymous tokens
      setAnonymousTokens(null);
      setAnonymousUser(null);
      return;
    }

    // Create anonymous user if not exists
    const createAnonymousUser = async () => {
      try {
        setIsLoading(true);
        console.log('Creating anonymous user...');
        const anonymousAuth = await signInAnonymously(auth);
        console.log('Anonymous user created:', anonymousAuth.user.uid);
        setAnonymousUser(anonymousAuth.user);
        
        // Check if user document exists in Firestore
        const userRef = doc(db, 'users', anonymousAuth.user.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          // Create anonymous user document
          console.log('Creating anonymous user document in Firestore...');
          await setDoc(userRef, {
            token_balance: 2,
            is_anonymous: true,
            createdAt: Timestamp.now(),
            updated_at: Timestamp.now()
          });
          setAnonymousTokens(2);
          console.log('Anonymous user document created with 2 tokens');
        } else {
          // Get existing token balance
          const userData = userDoc.data();
          const tokens = userData.token_balance || 0;
          setAnonymousTokens(tokens);
          console.log('Existing anonymous user found with', tokens, 'tokens');
        }
      } catch (error) {
        console.error('Error creating anonymous user:', error);
        setAnonymousTokens(0);
        setAnonymousUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    createAnonymousUser();
  }, [user]);

  const decrementTokens = async () => {
    if (!user && anonymousUser && anonymousTokens !== null && anonymousTokens > 0) {
      try {
        const newTokens = anonymousTokens - 1;
        setAnonymousTokens(newTokens);
        
        // Update Firestore
        const userRef = doc(db, 'users', anonymousUser.uid);
        await updateDoc(userRef, {
          token_balance: newTokens,
          updated_at: Timestamp.now()
        });
        
        return newTokens;
      } catch (error) {
        console.error('Error decrementing tokens:', error);
        return anonymousTokens;
      }
    }
    return anonymousTokens;
  };

  return {
    anonymousTokens,
    decrementTokens,
    anonymousUser,
    isLoading,
  };
}; 