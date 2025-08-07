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
  console.log('=== ADD CUSTOM GTM CHANNEL REQUEST START ===');
  
  try {
    // Parse request
    const requestData = await request.json();
    const { ideaId, channel, idToken } = requestData;
    
    console.log('Request parsed:', { 
      ideaId,
      channel,
      hasIdToken: !!idToken 
    });

    // Validate input
    if (!ideaId || !channel || !idToken) {
      console.error('Missing required fields:', { 
        hasIdeaId: !!ideaId, 
        hasChannel: !!channel,
        hasIdToken: !!idToken 
      });
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: ideaId, channel, and idToken'
      }, { status: 400 });
    }

    // Authenticate user
    const decoded = await verifyFirebaseIdToken(idToken);
    const uid = decoded.uid;
    console.log('User authenticated:', { uid });

    // Get the idea document to verify ownership
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

    // Get current custom channels or initialize empty array
    const ideaData = ideaDoc.data();
    const currentCustomChannels = ideaData?.custom?.go_to_market_channels || [];

    // Check if channel already exists
    if (currentCustomChannels.includes(channel)) {
      console.error('Channel already exists:', { channel, ideaId });
      return NextResponse.json({
        success: false,
        error: 'Channel already exists'
      }, { status: 400 });
    }

    // Add the new channel to the custom channels array
    const updatedCustomChannels = [...currentCustomChannels, channel];

    // Update the idea document with the new custom channels
    await ideaRef.update({
      'custom.go_to_market_channels': updatedCustomChannels,
      updated_at: new Date(),
    });

    console.log('Custom GTM channel added successfully:', { 
      ideaId, 
      uid, 
      channel,
      totalCustomChannels: updatedCustomChannels.length 
    });

    console.log('=== ADD CUSTOM GTM CHANNEL REQUEST SUCCESS ===');
    
    return NextResponse.json({
      success: true,
      customChannels: updatedCustomChannels
    });

  } catch (error) {
    console.error('=== ADD CUSTOM GTM CHANNEL REQUEST ERROR ===');
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to add custom GTM channel'
    }, { status: 500 });
  }
}
