import * as admin from "firebase-admin";

let _db: admin.firestore.Firestore | null = null;
let _auth: admin.auth.Auth | null = null;

function haveEnv() {
  return !!process.env.FIREBASE_PROJECT_ID &&
         !!process.env.FIREBASE_CLIENT_EMAIL &&
         !!process.env.FIREBASE_PRIVATE_KEY;
}

function normalizePem(raw: string) {
  // Handle both '\\n' (double-escaped) and '\n'
  return raw
    .replace(/\\\\n/g, "\n")  // turn \\n into real newline first
    .replace(/\\n/g, "\n");   // then \n into real newline
}

export function getAdminDb(): admin.firestore.Firestore {
  if (_db) return _db;

  if (!haveEnv()) {
    // Defer error to runtime; don't crash at build/import time.
    throw new Error("Firebase Admin not configured (missing FIREBASE_* envs).");
  }

  const privateKey = normalizePem(String(process.env.FIREBASE_PRIVATE_KEY));
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey,
      }),
    });
  }
  _db = admin.firestore();
  // Prevent crashes when patch objects contain undefined
  // @ts-ignore
  _db.settings?.({ ignoreUndefinedProperties: true });
  return _db;
}

export function getAdminAuth(): admin.auth.Auth {
  if (_auth) return _auth;

  if (!haveEnv()) {
    // Defer error to runtime; don't crash at build/import time.
    throw new Error("Firebase Admin not configured (missing FIREBASE_* envs).");
  }

  const privateKey = normalizePem(String(process.env.FIREBASE_PRIVATE_KEY));
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey,
      }),
    });
  }
  _auth = admin.auth();
  return _auth;
}

// Legacy exports for backward compatibility
export const adminDb = getAdminDb();
export const adminAuth = getAdminAuth();

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
  baseScore?: number; // Original AI-generated score before checklist interactions
  createdAt: FirebaseFirestore.Timestamp;
  tokensUsed: number;
  status?: string;
}

// Get user's ideas
export const getUserIdeas = async (userId: string, limit: number = 10): Promise<IdeaDocument[]> => {
  const db = getAdminDb();
  const ideasRef = db
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
  const db = getAdminDb();
  const ideaRef = db
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

// Increment user's token balance using Firestore transaction
export const incrementUserTokens = async (userId: string, tokenCount: number, context: 'onboarding' | 'purchase' | 'test' | 'unknown' = 'unknown'): Promise<void> => {
  const db = getAdminDb();
  console.log(`[TOKEN_TRANSACTION] Context: ${context} | User: ${userId} | Tokens: ${tokenCount}`);

  const userRef = db.collection('users').doc(userId);
  
  await db.runTransaction(async (transaction) => {
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
  const db = getAdminDb();
  const userDoc = await db.collection('users').doc(userId).get();
  
  if (!userDoc.exists) {
    return 0;
  }
  
  return userDoc.data()?.token_balance || 0;
};

export type { admin }; 