import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { logTokenFetch, logTokenUpdate, logTokenError } from '@/lib/utils';

// Verify Firebase ID token
const verifyFirebaseIdToken = async (idToken: string) => {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    throw new Error('Invalid ID token');
  }
};

export async function POST(request: NextRequest) {
  console.log('=== IDEA GRADING REQUEST START ===');
  
  // Declare variables at function level for catch block access
  let idea: string | undefined;
  let idToken: string | undefined;
  let uid: string | undefined;
  
  try {
    // Parse request
    const requestData = await request.json();
    idea = requestData.idea;
    idToken = requestData.idToken;
    console.log('Request parsed:', { ideaLength: idea?.length || 0, hasIdToken: !!idToken });

    // Validate input
    if (!idea || !idToken) {
      console.error('Missing required fields:', { hasIdea: !!idea, hasIdToken: !!idToken });
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: idea and idToken'
      }, { status: 400 });
    }

    // Authenticate user
    const decoded = await verifyFirebaseIdToken(idToken);
    uid = decoded.uid;
    console.log('User authenticated:', { uid });
    
    // TEST 2: UID Verification
    console.log('=== UID VERIFICATION ===');
    console.log('API UID:', uid);
    console.log('API UID type:', typeof uid);
    console.log('API UID length:', uid.length);
    console.log('API UID matches pattern:', /^[a-zA-Z0-9]{28}$/.test(uid));

    // Read current token balance from Firestore
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.error('User document not found:', { uid });
      logTokenError(uid, 'User document not found', 'grade_idea_route');
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    const tokenBalance = userDoc.data()?.token_balance || 0;
    console.log('Current token balance from Firestore:', { uid, tokenBalance });
    logTokenFetch(uid, tokenBalance, 'grade_idea_read');

    // Validate sufficient tokens
    if (tokenBalance < 1) {
      console.error('Insufficient tokens:', { uid, tokenBalance });
      logTokenError(uid, `Insufficient tokens: ${tokenBalance}`, 'grade_idea_validation');
      return NextResponse.json({
        success: false,
        error: 'Not enough tokens'
      }, { status: 403 });
    }

    // Perform idea analysis (mock for now)
    console.log('Starting idea analysis...');
    const analysis = {
      overall_score: Math.floor(Math.random() * 40) + 60, // 60-100
      market_potential: Math.floor(Math.random() * 30) + 70,
      competition: Math.floor(Math.random() * 40) + 60,
      monetization: Math.floor(Math.random() * 30) + 70,
      execution: Math.floor(Math.random() * 40) + 60,
      recommendation: Math.random() > 0.5 ? 'Worth Building' : 'Needs Refinement',
      insights: [
        'Market size appears substantial',
        'Competition is moderate',
        'Clear monetization path identified',
        'Execution complexity is manageable'
      ]
    };
    console.log('Idea analysis completed successfully');

    // Ensure we reach the token deduction logic
    console.log('=== REACHING TOKEN DEDUCTION LOGIC ===');
    console.log('About to deduct token:', { uid, currentBalance: tokenBalance });

    // Deduct 1 token and update Firestore
    const newTokenBalance = tokenBalance - 1;
    console.log('Deducting 1 token:', { uid, previousBalance: tokenBalance, newBalance: newTokenBalance });
    logTokenUpdate(uid, tokenBalance, newTokenBalance, 'deduction');
    
    // Validate UID match and log Firestore path
    console.log('Token deduction - UID being used:', uid);
    console.log('Firestore path:', userRef.path);
    console.log('Admin DB initialized:', !!adminDb);
    
    try {
      console.log('Attempting Firestore token deduction:', {
        uid,
        oldBalance: tokenBalance,
        newTokenBalance,
        userRefPath: userRef.path
      });

      // TEST 3: Check Firestore Write Result
      const updateResult = await userRef.update({
        token_balance: newTokenBalance,
        updated_at: new Date(),
      });
      
      console.log('Firestore update result:', updateResult);
      console.log('Token balance updated in Firestore successfully');

      // Verify the update by reading back the value
      const verifyDoc = await userRef.get();
      const verifiedBalance = verifyDoc.data()?.token_balance || 0;
      const verifiedUpdatedAt = verifyDoc.data()?.updated_at;
      
      console.log('Post-update Firestore check:', {
        uid,
        expectedBalance: newTokenBalance,
        actualBalance: verifiedBalance,
        updateSuccessful: verifiedBalance === newTokenBalance,
        verifiedUpdatedAt,
        fullDocument: verifyDoc.data()
      });

      if (verifiedBalance !== newTokenBalance) {
        console.error('CRITICAL: Firestore update verification failed!', {
          uid,
          expected: newTokenBalance,
          actual: verifiedBalance,
          difference: newTokenBalance - verifiedBalance
        });
      }

    } catch (err) {
      console.error('Firestore token_balance update failed:', {
        uid,
        error: err,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
        errorStack: err instanceof Error ? err.stack : undefined
      });
      throw err; // Re-throw to trigger the outer catch block
    }

    // Store the idea and analysis in Firestore
    const ideaRef = adminDb
      .collection("users")
      .doc(uid)
      .collection("ideas")
      .doc();

    await ideaRef.set({
      ideaText: idea,
      analysis: analysis,
      createdAt: Timestamp.now(),
      tokensUsed: 1,
    });
    console.log('Idea analysis stored in Firestore:', { ideaId: ideaRef.id, uid });

    console.log('=== IDEA GRADING REQUEST SUCCESS ===');
    console.log('Final token balance returned:', { uid, tokenBalance: newTokenBalance });
    
    return NextResponse.json({
      success: true,
      tokenBalance: newTokenBalance,
      analysis: analysis
    });

  } catch (error) {
    console.error('=== IDEA GRADING REQUEST ERROR ===');
    console.error('NO TOKEN DEDUCTED — FINAL FALLBACK HIT');
    console.error('Raw request context:', {
      ideaPresent: !!idea,
      idTokenPresent: !!idToken,
      uidKnown: typeof uid !== 'undefined' ? uid : 'unknown',
      projectId: process.env.FIREBASE_PROJECT_ID || 'unknown'
    });
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });

    // Log error with UID if available
    logTokenError(uid || 'unknown', error instanceof Error ? error.message : 'Unknown error', 'grade_idea_route');

    // Return consistent error response
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze idea'
    }, { status: 500 });
  }
} 