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
  let scores: any | undefined;
  let checklistData: any | undefined;
  let uid: string | undefined;
  
  try {
    // Parse request
    const requestData = await request.json();
    ideaId = requestData.ideaId;
    idToken = requestData.idToken;
    scores = requestData.scores;
    checklistData = requestData.checklistData;
    
    console.log('Request parsed:', { 
      ideaId,
      hasIdToken: !!idToken,
      hasScores: !!scores,
      hasChecklistData: !!checklistData
    });

    // Validate input - accept either scores or checklistData
    if (!ideaId || !idToken || (!scores && !checklistData)) {
      console.error('Missing required fields:', { 
        hasIdeaId: !!ideaId, 
        hasIdToken: !!idToken,
        hasScores: !!scores,
        hasChecklistData: !!checklistData
      });
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: ideaId, idToken, and either scores or checklistData'
      }, { status: 400 });
    }

    // Authenticate user
    const decoded = await verifyFirebaseIdToken(idToken);
    uid = decoded.uid;
    console.log('User authenticated:', { uid });

    // Get the current idea document to check for base score
    const ideaRef = adminDb.collection("users").doc(uid).collection("ideas").doc(ideaId);
    const ideaDoc = await ideaRef.get();
    
    if (!ideaDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Idea not found'
      }, { status: 404 });
    }
    
    const ideaData = ideaDoc.data();
    const baseScore = ideaData?.baseScore || ideaData?.analysis?.overall_score;
    
    let dynamicScores;
    
    if (scores) {
      // Use scores directly from modal
      dynamicScores = {
        market_potential: scores.market_potential,
        monetization: scores.monetization,
        execution: scores.execution,
        overall_score: scores.overall_score,
        letter_grade: scores.letter_grade
      };
      console.log('Using scores from modal:', dynamicScores);
    } else if (checklistData) {
      // Calculate dynamic scores with base score protection
      dynamicScores = calculateDynamicScores(checklistData, baseScore);
      console.log('Calculated dynamic scores from checklist:', dynamicScores);
    } else {
      throw new Error('Neither scores nor checklistData provided');
    }

    // Update the idea document with new scores
    const updateData: any = {
      'analysis.market_potential': dynamicScores.market_potential,
      'analysis.monetization': dynamicScores.monetization,
      'analysis.execution': dynamicScores.execution,
      'analysis.overall_score': dynamicScores.overall_score,
      'updated_at': new Date()
    };
    
    // Store base score if it doesn't exist yet
    if (!ideaData?.baseScore) {
      updateData.baseScore = ideaData?.analysis?.overall_score;
    }
    
    await ideaRef.update(updateData);

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