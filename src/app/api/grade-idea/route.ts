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
  
  try {
    // Parse request
    const { idea, idToken } = await request.json();
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
    const uid = decoded.uid;
    console.log('User authenticated:', { uid });

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

    // Deduct 1 token and update Firestore
    const newTokenBalance = tokenBalance - 1;
    console.log('Deducting 1 token:', { uid, previousBalance: tokenBalance, newBalance: newTokenBalance });
    logTokenUpdate(uid, tokenBalance, newTokenBalance, 'deduction');
    
    await userRef.update({
      token_balance: newTokenBalance,
      updated_at: new Date(),
    });
    console.log('Token balance updated in Firestore successfully');

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
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });

    // Log error with UID if available
    const uid = 'unknown';
    logTokenError(uid, error instanceof Error ? error.message : 'Unknown error', 'grade_idea_route');

    // Return consistent error response
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze idea'
    }, { status: 500 });
  }
} 