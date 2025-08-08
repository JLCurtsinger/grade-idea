import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

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
  console.log('=== UPDATE CUSTOM KEY INSIGHTS REQUEST START ===');
  
  let ideaId: string | undefined;
  let idToken: string | undefined;
  let customKeyInsights: string[] | undefined;
  let uid: string | undefined;
  
  try {
    // Parse request
    const requestData = await request.json();
    ideaId = requestData.ideaId;
    idToken = requestData.idToken;
    const rawKeyInsights = requestData.customKeyInsights;
    
    console.log('Request parsed:', { 
      ideaId,
      hasIdToken: !!idToken,
      hasCustomKeyInsights: Array.isArray(rawKeyInsights)
    });

    // Validate input
    if (!ideaId || !idToken || !Array.isArray(rawKeyInsights)) {
      console.error('Missing required fields:', { 
        hasIdeaId: !!ideaId, 
        hasIdToken: !!idToken,
        hasCustomKeyInsights: Array.isArray(rawKeyInsights)
      });
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: ideaId, idToken, and customKeyInsights array'
      }, { status: 400 });
    }

    // Authenticate user
    const decoded = await verifyFirebaseIdToken(idToken);
    uid = decoded.uid;
    console.log('User authenticated:', { uid });

    // Get the current idea document
    const ideaRef = adminDb.collection("users").doc(uid).collection("ideas").doc(ideaId);
    const ideaDoc = await ideaRef.get();
    
    if (!ideaDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Idea not found'
      }, { status: 404 });
    }
    
    // Remove duplicates and trim whitespace
    const cleanedKeyInsights = [...new Set(rawKeyInsights.map(insight => insight.trim()).filter(insight => insight.length > 0))];

    // Update the idea document with custom key insights
    const updateData: any = {
      'custom.key_insights': cleanedKeyInsights,
      'updated_at': new Date()
    };
    
    await ideaRef.update(updateData);

    console.log('=== UPDATE CUSTOM KEY INSIGHTS REQUEST SUCCESS ===');
    
    return NextResponse.json({
      success: true,
      customKeyInsights: cleanedKeyInsights
    });

  } catch (error) {
    console.error('=== UPDATE CUSTOM KEY INSIGHTS REQUEST ERROR ===');
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to update custom key insights'
    }, { status: 500 });
  }
}
