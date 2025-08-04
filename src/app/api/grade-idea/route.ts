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

    if (!idea || !idToken) {
      return NextResponse.json(
        { error: 'Missing required fields: idea and idToken' },
        { status: 400 }
      );
    }

    // Verify the Firebase ID token
    const decoded = await verifyFirebaseIdToken(idToken);
    const uid = decoded.uid;

    // Get user's token balance
    const tokenBalance = await getUserTokenBalance(uid);

    // Check if user has enough tokens
    if (tokenBalance < 1) {
      return NextResponse.json(
        { error: 'Not enough tokens' },
        { status: 403 }
      );
    }

    // Deduct 1 token
    const userRef = adminDb.collection('users').doc(uid);
    await userRef.update({
      token_balance: tokenBalance - 1,
      updated_at: new Date(),
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

    return NextResponse.json({
      analysis: mockAnalysis,
      tokens_remaining: tokenBalance - 1
    });

  } catch (error) {
    console.error('Error in grade-idea API:', error);
    
    if (error instanceof Error && error.message === 'Invalid ID token') {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to analyze idea' },
      { status: 500 }
    );
  }
} 