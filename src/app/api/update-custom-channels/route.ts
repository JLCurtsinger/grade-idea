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
  console.log('=== UPDATE CUSTOM CHANNELS REQUEST START ===');
  
  let ideaId: string | undefined;
  let idToken: string | undefined;
  let customChannels: string[] | undefined;
  let uid: string | undefined;
  
  try {
    // Parse request
    const requestData = await request.json();
    ideaId = requestData.ideaId;
    idToken = requestData.idToken;
    customChannels = requestData.customChannels;
    
    console.log('Request parsed:', { 
      ideaId,
      hasIdToken: !!idToken,
      customChannels
    });

    // Validate input
    if (!ideaId || !idToken || !Array.isArray(customChannels)) {
      console.error('Missing required fields:', { 
        hasIdeaId: !!ideaId, 
        hasIdToken: !!idToken,
        hasCustomChannels: Array.isArray(customChannels)
      });
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: ideaId, idToken, and customChannels array'
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
    const cleanedChannels = [...new Set(customChannels.map(channel => channel.trim()).filter(channel => channel.length > 0))];

    // Update the idea document with custom channels
    const updateData: any = {
      'custom.go_to_market_channels': cleanedChannels,
      'updated_at': new Date()
    };
    
    await ideaRef.update(updateData);

    console.log('=== UPDATE CUSTOM CHANNELS REQUEST SUCCESS ===');
    
    return NextResponse.json({
      success: true,
      customChannels: cleanedChannels
    });

  } catch (error) {
    console.error('=== UPDATE CUSTOM CHANNELS REQUEST ERROR ===');
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to update custom channels'
    }, { status: 500 });
  }
}
