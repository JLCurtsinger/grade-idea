import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { ideaId, idToken, public: isPublic } = await request.json();

    // Validate input
    if (!ideaId || !idToken || typeof isPublic !== 'boolean') {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: ideaId, idToken, and public status'
      }, { status: 400 });
    }

    // Authenticate user
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const uid = decoded.uid;

    // Get the idea document
    const ideaRef = getAdminDb()
      .collection("users")
      .doc(uid)
      .collection("ideas")
      .doc(ideaId);

    const ideaDoc = await ideaRef.get();

    if (!ideaDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Idea not found'
      }, { status: 404 });
    }

    // Update the public status
    await ideaRef.update({
      public: isPublic,
      updated_at: new Date()
    });

    console.log('Idea public status updated:', { ideaId, uid, public: isPublic });

    return NextResponse.json({
      success: true,
      public: isPublic
    });

  } catch (error) {
    console.error('Error toggling idea public status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update idea public status'
    }, { status: 500 });
  }
} 