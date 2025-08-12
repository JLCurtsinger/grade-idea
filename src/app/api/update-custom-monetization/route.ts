import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

// Verify Firebase ID token
const verifyFirebaseIdToken = async (idToken: string) => {
  try {
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    throw new Error('Invalid ID token');
  }
};

export async function POST(request: NextRequest) {
  console.log('=== UPDATE CUSTOM MONETIZATION REQUEST START ===');
  
  let ideaId: string | undefined;
  let idToken: string | undefined;
  let customMonetization: string[] | undefined;
  let uid: string | undefined;
  
  try {
    // Parse request
    const requestData = await request.json();
    ideaId = requestData.ideaId;
    idToken = requestData.idToken;
    customMonetization = requestData.customMonetization;
    
    console.log('Request parsed:', { 
      ideaId,
      hasIdToken: !!idToken,
      customMonetization
    });

    // Validate input
    if (!ideaId || !idToken || !Array.isArray(customMonetization)) {
      console.error('Missing required fields:', { 
        hasIdeaId: !!ideaId, 
        hasIdToken: !!idToken,
        hasCustomMonetization: Array.isArray(customMonetization)
      });
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: ideaId, idToken, and customMonetization array'
      }, { status: 400 });
    }

    // Authenticate user
    const decoded = await verifyFirebaseIdToken(idToken);
    uid = decoded.uid;
    console.log('User authenticated:', { uid });

    // Get the current idea document
    const ideaRef = getAdminDb().collection("users").doc(uid).collection("ideas").doc(ideaId);
    const ideaDoc = await ideaRef.get();
    
    if (!ideaDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Idea not found'
      }, { status: 404 });
    }
    
    // Remove duplicates and trim whitespace
    const cleanedMonetization = [...new Set(customMonetization.map(model => model.trim()).filter(model => model.length > 0))];

    // Update the idea document with custom monetization models
    const updateData: any = {
      'custom.monetization_models': cleanedMonetization,
      'updated_at': new Date()
    };
    
    await ideaRef.update(updateData);

    console.log('=== UPDATE CUSTOM MONETIZATION REQUEST SUCCESS ===');
    
    return NextResponse.json({
      success: true,
      customMonetization: cleanedMonetization
    });

  } catch (error) {
    console.error('=== UPDATE CUSTOM MONETIZATION REQUEST ERROR ===');
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to update custom monetization models'
    }, { status: 500 });
  }
}
