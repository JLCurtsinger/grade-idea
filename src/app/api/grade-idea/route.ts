import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

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
  try {
    const { idea, idToken } = await request.json();

    console.log('=== IDEA GRADING REQUEST ===');
    console.log('Idea length:', idea?.length || 0);

    if (!idea || !idToken) {
      console.error('Missing required fields:', { hasIdea: !!idea, hasIdToken: !!idToken });
      return NextResponse.json(
        { error: 'Missing required fields: idea and idToken' },
        { status: 400 }
      );
    }

    // Verify the Firebase ID token
    const decoded = await verifyFirebaseIdToken(idToken);
    const uid = decoded.uid;
    console.log('Authenticated user:', uid);

    // Use Firestore transaction to safely check and deduct tokens
    let tokenBalance: number;
    let tokensRemaining: number;
    let transactionSuccess = false;
    
    console.log('Starting token deduction transaction for user:', uid);
    
    try {
      await adminDb.runTransaction(async (transaction) => {
        const userRef = adminDb.collection('users').doc(uid);
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists) {
          console.error('User document does not exist:', uid);
          throw new Error('User not found');
        }
        
        const userData = userDoc.data();
        tokenBalance = userData?.token_balance || 0;
        console.log('Current token balance:', { uid, tokenBalance });
        
        // Check if user has enough tokens
        if (tokenBalance < 1) {
          console.error('Insufficient tokens:', { uid, tokenBalance });
          throw new Error('Not enough tokens');
        }
        
        // Deduct 1 token atomically
        tokensRemaining = tokenBalance - 1;
        console.log('Deducting 1 token:', { uid, previousBalance: tokenBalance, newBalance: tokensRemaining });
        
        transaction.update(userRef, {
          token_balance: tokensRemaining,
          updated_at: new Date(),
        });
        
        console.log('Transaction update queued successfully');
      });
      
      transactionSuccess = true;
      console.log('Token deduction transaction completed successfully:', { 
        uid, 
        previousBalance: tokenBalance, 
        newBalance: tokensRemaining 
      });
      
    } catch (transactionError) {
      console.error('Transaction failed:', transactionError);
      throw transactionError;
    }

    // Verify the deduction was actually persisted
    if (transactionSuccess) {
      try {
        const verificationDoc = await adminDb.collection('users').doc(uid).get();
        const actualBalance = verificationDoc.data()?.token_balance || 0;
        console.log('Verification - Actual balance in Firestore:', { uid, actualBalance, expectedBalance: tokensRemaining });
        
        if (actualBalance !== tokensRemaining) {
          console.error('CRITICAL: Token deduction verification failed!', {
            uid,
            expectedBalance: tokensRemaining,
            actualBalance,
            difference: actualBalance - tokensRemaining
          });
          throw new Error('Token deduction verification failed');
        }
      } catch (verificationError) {
        console.error('Error during verification:', verificationError);
        throw new Error('Failed to verify token deduction');
      }
    }

    // TODO: Implement actual idea analysis logic here
    // For now, return a mock analysis
    const mockAnalysis = {
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

    // Store the idea and analysis in Firestore
    const ideaRef = adminDb
      .collection("users")
      .doc(uid)
      .collection("ideas")
      .doc();

    await ideaRef.set({
      ideaText: idea,
      analysis: mockAnalysis,
      createdAt: Timestamp.now(),
      tokensUsed: 1,
    });

    console.log('Idea analysis stored successfully:', { 
      ideaId: ideaRef.id, 
      uid, 
      tokensRemaining 
    });

    return NextResponse.json({
      success: true,
      analysis: mockAnalysis,
      tokens_remaining: tokensRemaining,
      updatedTokenBalance: tokensRemaining
    });

  } catch (error) {
    console.error('Error in grade-idea API:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Invalid ID token') {
        return NextResponse.json(
          { error: 'Authentication failed' },
          { status: 401 }
        );
      }
      
      if (error.message === 'Not enough tokens') {
        return NextResponse.json(
          { error: 'Not enough tokens' },
          { status: 403 }
        );
      }
      
      if (error.message === 'User not found') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      if (error.message === 'Token deduction verification failed') {
        return NextResponse.json(
          { error: 'Token deduction failed - please try again' },
          { status: 500 }
        );
      }
      
      if (error.message === 'Failed to verify token deduction') {
        return NextResponse.json(
          { error: 'Failed to verify token deduction - please try again' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to analyze idea' },
      { status: 500 }
    );
  }
} 