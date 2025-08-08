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

interface RiskMitigation {
  risk: string;
  mitigation: string;
}

export async function POST(request: NextRequest) {
  console.log('=== UPDATE RISK MITIGATION REQUEST START ===');
  
  let ideaId: string | undefined;
  let idToken: string | undefined;
  let riskMitigationPlans: RiskMitigation[] | undefined;
  let uid: string | undefined;
  
  try {
    // Parse request
    const requestData = await request.json();
    ideaId = requestData.ideaId;
    idToken = requestData.idToken;
    riskMitigationPlans = requestData.riskMitigationPlans;
    
    console.log('Request parsed:', { 
      ideaId,
      hasIdToken: !!idToken,
      riskMitigationPlans
    });

    // Validate input
    if (!ideaId || !idToken || !Array.isArray(riskMitigationPlans)) {
      console.error('Missing required fields:', { 
        hasIdeaId: !!ideaId, 
        hasIdToken: !!idToken,
        hasRiskMitigationPlans: Array.isArray(riskMitigationPlans)
      });
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: ideaId, idToken, and riskMitigationPlans array'
      }, { status: 400 });
    }

    // Validate each mitigation plan has required fields
    for (const plan of riskMitigationPlans) {
      if (typeof plan.risk !== 'string' || typeof plan.mitigation !== 'string') {
        return NextResponse.json({
          success: false,
          error: 'Invalid risk mitigation plan structure'
        }, { status: 400 });
      }
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
    
    // Clean and validate the data
    const cleanedPlans = riskMitigationPlans
      .map(plan => ({
        risk: plan.risk.trim(),
        mitigation: plan.mitigation.trim()
      }))
      .filter(plan => plan.risk.length > 0 && plan.mitigation.length > 0);

    // Update the idea document with risk mitigation plans
    const updateData: any = {
      'custom.risk_mitigation_plans': cleanedPlans,
      'updated_at': new Date()
    };
    
    await ideaRef.update(updateData);

    console.log('=== UPDATE RISK MITIGATION REQUEST SUCCESS ===');
    
    return NextResponse.json({
      success: true,
      riskMitigationPlans: cleanedPlans
    });

  } catch (error) {
    console.error('=== UPDATE RISK MITIGATION REQUEST ERROR ===');
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to update risk mitigation plans'
    }, { status: 500 });
  }
}
