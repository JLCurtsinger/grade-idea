import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { calculateDynamicScores } from '@/lib/scoring';

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
  console.log('=== UPDATE IDEA SCORES REQUEST START ===');
  
  let ideaId: string | undefined;
  let idToken: string | undefined;
  let checklistData: any | undefined;
  let uid: string | undefined;
  
  try {
    // Parse request
    const requestData = await request.json();
    ideaId = requestData.ideaId;
    idToken = requestData.idToken;
    checklistData = requestData.checklistData;
    
    console.log('Request parsed:', { 
      ideaId,
      hasIdToken: !!idToken,
      hasChecklistData: !!checklistData
    });

    // Validate input
    if (!ideaId || !idToken || !checklistData) {
      console.error('Missing required fields:', { 
        hasIdeaId: !!ideaId, 
        hasIdToken: !!idToken,
        hasChecklistData: !!checklistData
      });
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: ideaId, idToken, and checklistData'
      }, { status: 400 });
    }

    // Authenticate user
    const decoded = await verifyFirebaseIdToken(idToken);
    uid = decoded.uid;
    console.log('User authenticated:', { uid });

    // Calculate dynamic scores
    const dynamicScores = calculateDynamicScores(checklistData);
    console.log('Calculated dynamic scores:', dynamicScores);

    // Update the idea document with new scores
    const ideaRef = adminDb.collection("users").doc(uid).collection("ideas").doc(ideaId);
    
    await ideaRef.update({
      'analysis.market_potential': dynamicScores.market_potential,
      'analysis.monetization': dynamicScores.monetization,
      'analysis.execution': dynamicScores.execution,
      'analysis.overall_score': dynamicScores.overall_score,
      'updated_at': new Date()
    });

    console.log('=== UPDATE IDEA SCORES REQUEST SUCCESS ===');
    
    return NextResponse.json({
      success: true,
      scores: dynamicScores
    });

  } catch (error) {
    console.error('=== UPDATE IDEA SCORES REQUEST ERROR ===');
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to update idea scores'
    }, { status: 500 });
  }
} 