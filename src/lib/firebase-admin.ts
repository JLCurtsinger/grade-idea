import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Validate Firebase Admin SDK environment variables
const validateFirebaseConfig = () => {
  const requiredEnvVars = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Firebase Admin SDK environment variables: ${missingVars.join(', ')}`
    );
  }

  return {
    projectId: requiredEnvVars.projectId!,
    clientEmail: requiredEnvVars.clientEmail!,
    privateKey: requiredEnvVars.privateKey!.replace(/\\n/g, '\n'),
  };
};

// Initialize Firebase Admin SDK
const apps = getApps();

if (!apps.length) {
  try {
    const serviceAccount = validateFirebaseConfig();
    
    initializeApp({
      credential: cert(serviceAccount),
    });
    
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    
    // During build time or when env vars are missing, we'll initialize without credentials
    // This allows the build to complete, but Firebase operations will fail at runtime
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
      console.warn('Initializing Firebase Admin SDK without credentials - operations will fail at runtime');
      try {
        initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID || 'placeholder',
        });
      } catch (initError) {
        console.warn('Could not initialize Firebase Admin SDK:', initError);
      }
    } else {
      // In production, we should fail the build
      throw error;
    }
  }
}

// Check if Firebase Admin SDK is properly initialized
const isFirebaseInitialized = () => {
  try {
    getAuth();
    getFirestore();
    return true;
  } catch (error) {
    return false;
  }
};

export const adminAuth = getAuth();
export const adminDb = getFirestore();

// Increment user's token balance using Firestore transaction
export const incrementUserTokens = async (userId: string, tokenCount: number): Promise<void> => {
  if (!isFirebaseInitialized()) {
    throw new Error('Firebase Admin SDK not initialized');
  }

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
  if (!isFirebaseInitialized()) {
    throw new Error('Firebase Admin SDK not initialized');
  }

  const userDoc = await adminDb.collection('users').doc(userId).get();
  
  if (!userDoc.exists) {
    return 0;
  }
  
  return userDoc.data()?.token_balance || 0;
}; 