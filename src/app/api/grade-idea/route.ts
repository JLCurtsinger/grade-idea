import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, getUserTokenBalance } from '@/lib/firebase-admin';
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
    
    await adminDb.runTransaction(async (transaction) => {
      const userRef = adminDb.collection('users').doc(uid);
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists) {
        console.error('User document does not exist:', uid);
        throw new Error('User not found');
      }
      
      tokenBalance = userDoc.data()?.token_balance || 0;
      console.log('Current token balance:', tokenBalance);
      
      // Check if user has enough tokens
      if (tokenBalance < 1) {
        console.error('Insufficient tokens:', { uid, tokenBalance });
        throw new Error('Not enough tokens');
      }
      
      // Deduct 1 token atomically
      tokensRemaining = tokenBalance - 1;
      transaction.update(userRef, {
        token_balance: tokensRemaining,
        updated_at: new Date(),
      });
      
      console.log('Token deduction successful:', { 
        uid, 
        previousBalance: tokenBalance, 
        newBalance: tokensRemaining 
      });
    });

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
      analysis: mockAnalysis,
      tokens_remaining: tokensRemaining
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
    }

    return NextResponse.json(
      { error: 'Failed to analyze idea' },
      { status: 500 }
    );
  }
} 