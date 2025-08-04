import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
const apps = getApps();

if (!apps.length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();

// Increment user's token balance using Firestore transaction
export const incrementUserTokens = async (userId: string, tokenCount: number): Promise<void> => {
  const userRef = adminDb.collection('users').doc(userId);
  
  await adminDb.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    
    if (!userDoc.exists) {
      // Create new user document if it doesn't exist
      transaction.set(userRef, {
        token_balance: tokenCount,
        created_at: new Date(),
        updated_at: new Date(),
      });
    } else {
      // Increment existing token balance
      const currentBalance = userDoc.data()?.token_balance || 0;
      transaction.update(userRef, {
        token_balance: currentBalance + tokenCount,
        updated_at: new Date(),
      });
    }
  });
};

// Get user's current token balance
export const getUserTokenBalance = async (userId: string): Promise<number> => {
  const userDoc = await adminDb.collection('users').doc(userId).get();
  
  if (!userDoc.exists) {
    return 0;
  }
  
  return userDoc.data()?.token_balance || 0;
}; 