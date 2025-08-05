import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getApp } from 'firebase-admin/app';

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
    privateKey: requiredEnvVars.privateKey!.replace(/^"|"$/g, '').replace(/\\n/g, '\n'),
  };
};

// Initialize Firebase Admin SDK
const apps = getApps();

if (!apps.length) {
  // Log environment variable status before initialization
  console.log('[FirebaseAdmin] Checking environment variables:');
  console.log('[FirebaseAdmin] FIREBASE_PROJECT_ID:', {
    present: !!process.env.FIREBASE_PROJECT_ID,
    preview: process.env.FIREBASE_PROJECT_ID ? `${process.env.FIREBASE_PROJECT_ID.substring(0, 10)}...` : 'undefined'
  });
  console.log('[FirebaseAdmin] FIREBASE_CLIENT_EMAIL:', {
    present: !!process.env.FIREBASE_CLIENT_EMAIL,
    preview: process.env.FIREBASE_CLIENT_EMAIL ? `${process.env.FIREBASE_CLIENT_EMAIL.substring(0, 20)}...` : 'undefined'
  });
  console.log('[FirebaseAdmin] FIREBASE_PRIVATE_KEY:', {
    present: !!process.env.FIREBASE_PRIVATE_KEY,
    length: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.length : 0
  });
  
  try {
    const serviceAccount = validateFirebaseConfig();
    
    // Enhanced logging after successful validation
    console.log('[FirebaseAdmin] Environment variables at runtime:', {
      nodeEnv: process.env.NODE_ENV,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      nextPublicFirebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      firebasePrivateKeyPresent: !!process.env.FIREBASE_PRIVATE_KEY,
      firebasePrivateKeyLength: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.length : 0
    });
    
    initializeApp({
      credential: cert(serviceAccount),
      databaseURL: `https://${serviceAccount.projectId}.firebaseio.com`,
    });
    
    console.log('✅ Firebase Admin SDK initialized with full credentials');
    console.log('[FirebaseAdmin] SDK initialized with config:', {
      nodeEnv: process.env.NODE_ENV,
      projectId: serviceAccount.projectId,
      clientEmail: serviceAccount.clientEmail,
      hasPrivateKey: !!serviceAccount.privateKey,
      databaseURL: `https://${serviceAccount.projectId}.firebaseio.com`,
      rawEnvVars: {
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
        FIREBASE_PRIVATE_KEY_PRESENT: !!process.env.FIREBASE_PRIVATE_KEY,
      }
    });
    
    // Success log only when all environment variables are valid and SDK is properly initialized
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    
    // During build time or when env vars are missing, we'll initialize without credentials
    // This allows the build to complete, but Firebase operations will fail at runtime
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
      console.warn('⚠️ Firebase Admin SDK initialized WITHOUT credentials (fallback path)');
      console.warn('[FirebaseAdmin] Fallback triggered because:', {
        nodeEnv: process.env.NODE_ENV,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
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
export const adminDb = getFirestore(getApp());

// One-time startup log (guarded for test environment)
if (process.env.NODE_ENV !== 'test') {
  console.log('[FirebaseAdmin] Initialization completed — Firestore + Auth clients are ready');
}

// Increment user's token balance using Firestore transaction
export const incrementUserTokens = async (userId: string, tokenCount: number, context: 'onboarding' | 'purchase' | 'test' | 'unknown' = 'unknown'): Promise<void> => {
  if (!isFirebaseInitialized()) {
    throw new Error('Firebase Admin SDK not initialized');
  }

  console.log(`[TOKEN_TRANSACTION] Context: ${context} | User: ${userId} | Tokens: ${tokenCount}`);

  const userRef = adminDb.collection('users').doc(userId);
  
  await adminDb.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    
    if (!userDoc.exists) {
      // Create new user document if it doesn't exist
      transaction.set(userRef, {
        token_balance: tokenCount,
        created_at: new Date(),
        updated_at: new Date(),
        last_token_source: context,
      });
      console.log(`[TOKEN_TRANSACTION] Created new user document with ${tokenCount} tokens | Context: ${context}`);
    } else {
      // Increment existing token balance
      const currentBalance = userDoc.data()?.token_balance || 0;
      transaction.update(userRef, {
        token_balance: currentBalance + tokenCount,
        updated_at: new Date(),
        last_token_source: context,
      });
      console.log(`[TOKEN_TRANSACTION] Incremented existing balance from ${currentBalance} to ${currentBalance + tokenCount} | Context: ${context}`);
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

// Ideas collection helper functions
export interface IdeaDocument {
  id: string;
  user_id: string;
  ideaText: string;
  analysis: {
    overall_score: number;
    market_potential: number;
    competition: number;
    monetization: number;
    execution: number;
    recommendation: string;
    insights: string[];
  };
  createdAt: FirebaseFirestore.Timestamp;
  tokensUsed: number;
  status?: string;
}

// Get user's ideas
export const getUserIdeas = async (userId: string, limit: number = 10): Promise<IdeaDocument[]> => {
  if (!isFirebaseInitialized()) {
    throw new Error('Firebase Admin SDK not initialized');
  }

  const ideasRef = adminDb
    .collection("users")
    .doc(userId)
    .collection("ideas");

  const snapshot = await ideasRef
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    user_id: userId,
    ...doc.data()
  })) as IdeaDocument[];
};

// Delete user's idea
export const deleteUserIdea = async (userId: string, ideaId: string): Promise<boolean> => {
  if (!isFirebaseInitialized()) {
    throw new Error('Firebase Admin SDK not initialized');
  }

  const ideaRef = adminDb
    .collection("users")
    .doc(userId)
    .collection("ideas")
    .doc(ideaId);

  const ideaDoc = await ideaRef.get();
  
  if (!ideaDoc.exists) {
    throw new Error('Idea not found');
  }

  await ideaRef.delete();
  return true;
}; 