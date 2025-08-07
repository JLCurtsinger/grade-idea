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
  console.log('=== GET CUSTOM GTM CHANNELS REQUEST START ===');
  
  try {
    // Parse request
    const requestData = await request.json();
    const { ideaId, idToken } = requestData;
    
    console.log('Request parsed:', { 
      ideaId,
      hasIdToken: !!idToken 
    });

    // Validate input
    if (!ideaId || !idToken) {
      console.error('Missing required fields:', { 
        hasIdeaId: !!ideaId, 
        hasIdToken: !!idToken 
      });
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: ideaId and idToken'
      }, { status: 400 });
    }

    // Authenticate user
    const decoded = await verifyFirebaseIdToken(idToken);
    const uid = decoded.uid;
    console.log('User authenticated:', { uid });

    // Get the idea document
    const ideaRef = adminDb
      .collection("users")
      .doc(uid)
      .collection("ideas")
      .doc(ideaId);

    const ideaDoc = await ideaRef.get();
    
    if (!ideaDoc.exists) {
      console.error('Idea document not found:', { ideaId, uid });
      return NextResponse.json({
        success: false,
        error: 'Idea not found'
      }, { status: 404 });
    }

    // Get custom channels from the idea document
    const ideaData = ideaDoc.data();
    const customChannels = ideaData?.custom?.go_to_market_channels || [];

    console.log('Custom GTM channels retrieved successfully:', { 
      ideaId, 
      uid, 
      customChannelsCount: customChannels.length 
    });

    console.log('=== GET CUSTOM GTM CHANNELS REQUEST SUCCESS ===');
    
    return NextResponse.json({
      success: true,
      customChannels
    });

  } catch (error) {
    console.error('=== GET CUSTOM GTM CHANNELS REQUEST ERROR ===');
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to get custom GTM channels'
    }, { status: 500 });
  }
}
