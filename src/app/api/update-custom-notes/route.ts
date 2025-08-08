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
  console.log('=== UPDATE CUSTOM NOTES REQUEST START ===');
  
  let ideaId: string | undefined;
  let idToken: string | undefined;
  let customNotes: Record<string, string> | undefined;
  let uid: string | undefined;
  
  try {
    // Parse request
    const requestData = await request.json();
    ideaId = requestData.ideaId;
    idToken = requestData.idToken;
    const rawNotes = requestData.customNotes;
    
    console.log('Request parsed:', { 
      ideaId,
      hasIdToken: !!idToken,
      hasCustomNotes: typeof rawNotes === 'object' && rawNotes !== null
    });

    // Validate input
    if (!ideaId || !idToken || typeof rawNotes !== 'object' || rawNotes === null) {
      console.error('Missing required fields:', { 
        hasIdeaId: !!ideaId, 
        hasIdToken: !!idToken,
        hasCustomNotes: typeof rawNotes === 'object' && rawNotes !== null
      });
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: ideaId, idToken, and customNotes object'
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
    
    // Clean and validate notes object
    const cleanedNotes: Record<string, string> = {};
    for (const [key, value] of Object.entries(rawNotes)) {
      if (typeof key === 'string' && typeof value === 'string' && value.trim().length > 0) {
        cleanedNotes[key] = value.trim();
      }
    }

    // Update the idea document with custom notes
    const updateData: any = {
      'custom.notes': cleanedNotes,
      'updated_at': new Date()
    };
    
    await ideaRef.update(updateData);

    console.log('=== UPDATE CUSTOM NOTES REQUEST SUCCESS ===');
    
    return NextResponse.json({
      success: true,
      customNotes: cleanedNotes
    });

  } catch (error) {
    console.error('=== UPDATE CUSTOM NOTES REQUEST ERROR ===');
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to update custom notes'
    }, { status: 500 });
  }
}
