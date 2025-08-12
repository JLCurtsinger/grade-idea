import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

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
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const uid = decoded.uid;
    
    console.log('Debug endpoint - UID from token:', uid);
    console.log('Debug endpoint - Admin DB initialized:', !!getAdminDb());
    
    // TEST 1: Hardcoded Write Check
    console.log('=== TESTING FIRESTORE WRITE ===');
    try {
      await getAdminDb().collection('debug-check').doc('test-write').set({
        timestamp: new Date(),
        test: 'write-from-api',
        uid: uid,
        message: 'Testing if we can write to the correct Firestore instance'
      });
      console.log('✅ Hardcoded write test SUCCESSFUL');
    } catch (writeError) {
      console.error('❌ Hardcoded write test FAILED:', writeError);
      return NextResponse.json({
        error: 'Firestore write test failed',
        writeError: writeError instanceof Error ? writeError.message : 'Unknown error'
      }, { status: 500 });
    }
    
    // Read the current token balance from Firestore
    const userRef = getAdminDb().collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json({
        uid,
        exists: false,
        token_balance: 0,
        message: 'User document not found',
        firestore_path: userRef.path
      });
    }
    
    const userData = userDoc.data();
    const tokenBalance = userData?.token_balance || 0;
    const updatedAt = userData?.updated_at;
    const lastTokenSource = userData?.last_token_source || 'unknown';
    
    console.log('Debug endpoint - Firestore data:', {
      uid,
      token_balance: tokenBalance,
      updated_at: updatedAt,
      last_token_source: lastTokenSource,
      fullDocument: userData
    });
    
    return NextResponse.json({
      uid,
      exists: true,
      token_balance: tokenBalance,
      updated_at: updatedAt,
      last_token_source: lastTokenSource,
      firestore_path: userRef.path,
      full_document: userData,
      write_test: 'successful'
    });
    
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 