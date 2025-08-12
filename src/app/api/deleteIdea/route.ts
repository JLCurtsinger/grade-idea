import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, deleteUserIdea } from '@/lib/firebase-admin';
import { logTokenError } from '@/lib/utils';

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
  console.log('=== DELETE IDEA REQUEST START ===');
  
  let ideaId: string | undefined;
  let idToken: string | undefined;
  let uid: string | undefined;
  
  try {
    // Parse request
    const requestData = await request.json();
    ideaId = requestData.ideaId;
    idToken = requestData.idToken;
    console.log('Request parsed:', { ideaId, hasIdToken: !!idToken });

    // Validate input
    if (!ideaId || !idToken) {
      console.error('Missing required fields:', { hasIdeaId: !!ideaId, hasIdToken: !!idToken });
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: ideaId and idToken'
      }, { status: 400 });
    }

    // Authenticate user
    const decoded = await verifyFirebaseIdToken(idToken);
    uid = decoded.uid;
    console.log('User authenticated:', { uid });

    // Delete the idea using helper function
    await deleteUserIdea(uid, ideaId);
    console.log('Idea deleted successfully:', { uid, ideaId });

    console.log('=== DELETE IDEA REQUEST SUCCESS ===');
    
    return NextResponse.json({
      success: true,
      message: 'Idea deleted successfully'
    });

  } catch (error) {
    console.error('=== DELETE IDEA REQUEST ERROR ===');
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      uid: uid || 'unknown',
      ideaId: ideaId || 'unknown'
    });

    // Log error with UID if available
    logTokenError(uid || 'unknown', error instanceof Error ? error.message : 'Unknown error', 'delete_idea_route');

    // Return appropriate error response
    if (error instanceof Error && error.message === 'Invalid ID token') {
      return NextResponse.json({
        success: false,
        error: 'Authentication failed'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete idea'
    }, { status: 500 });
  }
} 