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

    // First, get the current balance to verify we can read from Firestore
    const initialDoc = await adminDb.collection('users').doc(uid).get();
    if (!initialDoc.exists) {
      console.error('User document does not exist:', uid);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const initialBalance = initialDoc.data()?.token_balance || 0;
    console.log('Initial balance from Firestore:', { uid, initialBalance });

    if (initialBalance < 1) {
      console.error('Insufficient tokens:', { uid, initialBalance });
      return NextResponse.json(
        { error: 'Not enough tokens' },
        { status: 403 }
      );
    }

    // Use Firestore transaction to safely deduct tokens
    let tokensRemaining: number;
    let transactionCommitted = false;
    
    console.log('Starting token deduction transaction for user:', uid);
    
    try {
      const result = await adminDb.runTransaction(async (transaction) => {
        const userRef = adminDb.collection('users').doc(uid);
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists) {
          throw new Error('User not found');
        }
        
        const userData = userDoc.data();
        const currentBalance = userData?.token_balance || 0;
        console.log('Transaction - Current balance:', { uid, currentBalance });
        
        // Check if user has enough tokens
        if (currentBalance < 1) {
          throw new Error('Not enough tokens');
        }
        
        // Deduct 1 token atomically
        tokensRemaining = currentBalance - 1;
        console.log('Transaction - Deducting 1 token:', { 
          uid, 
          previousBalance: currentBalance, 
          newBalance: tokensRemaining 
        });
        
        transaction.update(userRef, {
          token_balance: tokensRemaining,
          updated_at: new Date(),
        });
        
        console.log('Transaction - Update queued successfully');
        
        // Return the new balance from the transaction
        return tokensRemaining;
      });
      
      transactionCommitted = true;
      tokensRemaining = result; // Use the result from the transaction
      
      console.log('Token deduction transaction completed successfully:', { 
        uid, 
        previousBalance: initialBalance, 
        newBalance: tokensRemaining 
      });
      
    } catch (transactionError) {
      console.error('Transaction failed:', transactionError);
      throw transactionError;
    }

    // Verify the deduction was actually persisted
    if (transactionCommitted) {
      try {
        // Wait a moment for the transaction to fully commit
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const verificationDoc = await adminDb.collection('users').doc(uid).get();
        const actualBalance = verificationDoc.data()?.token_balance || 0;
        console.log('Verification - Actual balance in Firestore:', { 
          uid, 
          actualBalance, 
          expectedBalance: tokensRemaining,
          initialBalance 
        });
        
        if (actualBalance !== tokensRemaining) {
          console.error('CRITICAL: Token deduction verification failed!', {
            uid,
            initialBalance,
            expectedBalance: tokensRemaining,
            actualBalance,
            difference: actualBalance - tokensRemaining
          });
          throw new Error('Token deduction verification failed');
        }
        
        console.log('Token deduction verification successful!');
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