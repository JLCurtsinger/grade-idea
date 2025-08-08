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
  console.log('=== UPDATE CUSTOM ARCHETYPE REQUEST START ===');
  
  let ideaId: string | undefined;
  let idToken: string | undefined;
  let customArchetype: string[] | undefined;
  let uid: string | undefined;
  
  try {
    // Parse request
    const requestData = await request.json();
    ideaId = requestData.ideaId;
    idToken = requestData.idToken;
    customArchetype = requestData.customArchetype;
    
    console.log('Request parsed:', { 
      ideaId,
      hasIdToken: !!idToken,
      customArchetype
    });

    // Validate input
    if (!ideaId || !idToken || !Array.isArray(customArchetype)) {
      console.error('Missing required fields:', { 
        hasIdeaId: !!ideaId, 
        hasIdToken: !!idToken,
        hasCustomArchetype: Array.isArray(customArchetype)
      });
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: ideaId, idToken, and customArchetype array'
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
    
    // Remove duplicates and trim whitespace, filter out empty strings
    const cleanedArchetype = [...new Set(customArchetype.map(item => item.trim()).filter(item => item.length > 0))];

    // Update the idea document with custom target user archetype
    const updateData: any = {
      'custom.target_user_archetype': cleanedArchetype,
      'updated_at': new Date()
    };
    
    await ideaRef.update(updateData);

    console.log('=== UPDATE CUSTOM ARCHETYPE REQUEST SUCCESS ===');
    
    return NextResponse.json({
      success: true,
      customArchetype: cleanedArchetype
    });

  } catch (error) {
    console.error('=== UPDATE CUSTOM ARCHETYPE REQUEST ERROR ===');
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to update custom target user archetype'
    }, { status: 500 });
  }
}
