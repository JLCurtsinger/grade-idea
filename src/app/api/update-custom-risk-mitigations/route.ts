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

// Type-safe validation for risk mitigation plans
interface RiskMitigation {
  risk: string;
  mitigation: string;
}

const validateRiskMitigation = (data: any): RiskMitigation | null => {
  if (!data || typeof data !== 'object') return null;
  if (typeof data.risk !== 'string' || typeof data.mitigation !== 'string') return null;
  if (!data.risk.trim() || !data.mitigation.trim()) return null;
  return {
    risk: data.risk.trim(),
    mitigation: data.mitigation.trim()
  };
};

export async function POST(request: NextRequest) {
  console.log('=== UPDATE CUSTOM RISK MITIGATIONS REQUEST START ===');
  
  let ideaId: string | undefined;
  let idToken: string | undefined;
  let riskMitigations: RiskMitigation[] | undefined;
  let uid: string | undefined;
  
  try {
    // Parse request
    const requestData = await request.json();
    ideaId = requestData.ideaId;
    idToken = requestData.idToken;
    const rawRiskMitigations = requestData.riskMitigations;
    
    console.log('Request parsed:', { 
      ideaId,
      hasIdToken: !!idToken,
      hasRiskMitigations: Array.isArray(rawRiskMitigations)
    });

    // Validate input
    if (!ideaId || !idToken || !Array.isArray(rawRiskMitigations)) {
      console.error('Missing required fields:', { 
        hasIdeaId: !!ideaId, 
        hasIdToken: !!idToken,
        hasRiskMitigations: Array.isArray(rawRiskMitigations)
      });
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: ideaId, idToken, and riskMitigations array'
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
    
    // Validate and clean risk mitigations
    const validatedMitigations: RiskMitigation[] = [];
    for (const item of rawRiskMitigations) {
      const validated = validateRiskMitigation(item);
      if (validated) {
        validatedMitigations.push(validated);
      }
    }

    // Update the idea document with custom risk mitigation plans
    const updateData: any = {
      'custom.risk_mitigation_plans': validatedMitigations,
      'updated_at': new Date()
    };
    
    await ideaRef.update(updateData);

    console.log('=== UPDATE CUSTOM RISK MITIGATIONS REQUEST SUCCESS ===');
    
    return NextResponse.json({
      success: true,
      riskMitigations: validatedMitigations
    });

  } catch (error) {
    console.error('=== UPDATE CUSTOM RISK MITIGATIONS REQUEST ERROR ===');
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to update custom risk mitigation plans'
    }, { status: 500 });
  }
}
