import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        error: 'Missing or invalid Authorization header'
      }, { status: 401 });
    }

    const idToken = authHeader.substring(7);
    
    // Verify the Firebase ID token
    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;
    
    console.log('Debug endpoint - UID from token:', uid);
    console.log('Debug endpoint - Admin DB initialized:', !!adminDb);
    
    // Read the current token balance from Firestore
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json({
        uid,
        exists: false,
        token_balance: 0,
        message: 'User document not found'
      });
    }
    
    const userData = userDoc.data();
    const tokenBalance = userData?.token_balance || 0;
    const updatedAt = userData?.updated_at;
    
    console.log('Debug endpoint - Firestore data:', {
      uid,
      token_balance: tokenBalance,
      updated_at: updatedAt,
      fullDocument: userData
    });
    
    return NextResponse.json({
      uid,
      exists: true,
      token_balance: tokenBalance,
      updated_at: updatedAt,
      firestore_path: userRef.path,
      full_document: userData
    });
    
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 