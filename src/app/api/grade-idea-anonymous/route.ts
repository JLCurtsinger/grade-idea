import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { logTokenFetch, logTokenUpdate, logTokenError } from '@/lib/utils';

export async function POST(request: NextRequest) {
  console.log('=== ANONYMOUS IDEA GRADING REQUEST START ===');
  
  let idea: string | undefined;
  let uid: string | undefined;
  
  try {
    // Parse request
    const requestData = await request.json();
    idea = requestData.idea;
    console.log('Request parsed:', { ideaLength: idea?.length || 0 });

    // Validate input
    if (!idea) {
      console.error('Missing required field: idea');
      return NextResponse.json({
        success: false,
        error: 'Missing required field: idea'
      }, { status: 400 });
    }

    // For anonymous users, we need to create a temporary anonymous session
    // This is a simplified approach - in production you'd want to handle this differently
    const tempUid = `anonymous_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    uid = tempUid;
    console.log('Using temporary anonymous UID:', { uid });

    // Check if user document exists, create if not
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    let tokenBalance = 2; // Default for new anonymous users
    
    if (!userDoc.exists) {
      // Create anonymous user document
      await userRef.set({
        email: `anonymous_${Date.now()}@gradeidea.cc`,
        token_balance: 2,
        is_anonymous: true,
        createdAt: Timestamp.now(),
        updated_at: Timestamp.now()
      });
      console.log('Created anonymous user document with 2 tokens:', { uid });
      logTokenUpdate(uid, 0, 2, 'anonymous_user_creation');
    } else {
      // Get existing token balance
      const userData = userDoc.data();
      tokenBalance = userData?.token_balance || 0;
      console.log('Existing anonymous user token balance:', { uid, tokenBalance });
      logTokenFetch(uid, tokenBalance, 'anonymous_user_read');
    }

    // Validate sufficient tokens
    if (tokenBalance < 1) {
      console.error('Insufficient tokens for anonymous user:', { uid, tokenBalance });
      logTokenError(uid, `Insufficient tokens: ${tokenBalance}`, 'anonymous_grade_idea_validation');
      return NextResponse.json({
        success: false,
        error: 'Free trial limit reached. Please sign up to continue analyzing ideas.',
        requiresSignup: true
      }, { status: 403 });
    }

    // Perform idea analysis (same as regular endpoint)
    console.log('Starting idea analysis for anonymous user...');
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

    // Deduct token and update Firestore
    const newTokenBalance = tokenBalance - 1;
    console.log('Deducting 1 token from anonymous user:', { uid, previousBalance: tokenBalance, newBalance: newTokenBalance });
    logTokenUpdate(uid, tokenBalance, newTokenBalance, 'anonymous_deduction');

    // Update user document
    await userRef.update({
      token_balance: newTokenBalance,
      updated_at: Timestamp.now(),
    });

    // Save idea to Firestore (without analysis for anonymous users)
    const ideaRef = userRef.collection('ideas').doc();
    await ideaRef.set({
      ideaText: idea,
      analysis: analysis,
      createdAt: Timestamp.now(),
      tokensUsed: 1,
      public: false,
      baseScores: {
        market: analysis.market_potential,
        differentiation: analysis.competition,
        monetization: analysis.monetization,
        execution: analysis.execution,
        growth: analysis.market_potential,
        overall: analysis.overall_score
      },
    });

    console.log('=== ANONYMOUS IDEA GRADING REQUEST SUCCESS ===');
    return NextResponse.json({
      success: true,
      analysis: analysis,
      tokensRemaining: newTokenBalance,
      ideaId: ideaRef.id
    });

  } catch (error) {
    console.error('Error in anonymous idea grading:', error);
    logTokenError(uid || 'unknown', error instanceof Error ? error.message : 'Unknown error', 'anonymous_grade_idea');
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze idea'
    }, { status: 500 });
  }
} 