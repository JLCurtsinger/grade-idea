import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Types for OpenAI response
interface GradingData {
  overall_score: number;
  market_potential: number;
  competition: number;
  monetization: number;
  execution: number;
  recommendation: string;
  insights: string[];
}

interface ChecklistSuggestion {
  id: string;
  text: string;
  impact_score: number;
  priority: 'high' | 'medium' | 'low';
}

interface ChecklistSection {
  score: number;
  suggestions: ChecklistSuggestion[];
}

interface ChecklistData {
  marketPotential: ChecklistSection;
  monetizationClarity: ChecklistSection;
  executionDifficulty: ChecklistSection;
}

interface OpenAIResponse {
  grading: GradingData;
  checklist: ChecklistData;
}

// System prompt for OpenAI
const SYSTEM_MESSAGE = `You are an expert startup analyst. Analyze the given startup idea and provide:

1. A grading analysis with scores (0-100) for:
   - overall_score: Overall viability
   - market_potential: Market size and opportunity
   - competition: Competitive landscape
   - monetization: Revenue potential
   - execution: Implementation feasibility
   - recommendation: Brief recommendation
   - insights: Array of key insights

2. A structured checklist with actionable suggestions for:
   - marketPotential: Market validation tasks
   - monetizationClarity: Revenue model tasks  
   - executionDifficulty: Implementation tasks

Each checklist section should have:
- score: 1-5 rating
- suggestions: Array of actionable items with id, text, impact_score (1-10), and priority (high/medium/low)

Return ONLY valid JSON with "grading" and "checklist" keys.

Do NOT use markdown formatting. Do NOT wrap your response in triple backticks. Return raw JSON only.`;

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

// Call OpenAI API
const callOpenAI = async (ideaText: string): Promise<OpenAIResponse> => {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_MESSAGE },
        { role: 'user', content: `Startup Idea: ${ideaText}\n\nPlease analyze this startup idea and return the JSON response with "grading" and "checklist" keys.` }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', response.status, errorText);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content received from OpenAI');
  }

  try {
    // Defensive parsing: strip markdown code fences if present
    let cleanContent = content.trim();

    if (cleanContent.startsWith("```json")) {
      cleanContent = cleanContent.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (cleanContent.startsWith("```")) {
      cleanContent = cleanContent.replace(/^```/, "").replace(/```$/, "").trim();
    }

    const parsed = JSON.parse(cleanContent);
    
    // Validate response structure
    if (!parsed.grading || !parsed.checklist) {
      throw new Error('Invalid OpenAI response structure');
    }
    
    return parsed as OpenAIResponse;
  } catch (parseError) {
    console.error('Failed to parse OpenAI response:', content);
    throw new Error('Invalid JSON response from OpenAI');
  }
};

export async function POST(request: NextRequest) {
  console.log('=== IDEA ANALYSIS REQUEST START ===');
  
  let ideaText: string | undefined;
  let idToken: string | undefined;
  let uid: string | undefined;
  
  try {
    // Parse request
    const requestData = await request.json();
    ideaText = requestData.ideaText;
    idToken = requestData.idToken;
    
    console.log('Request parsed:', { 
      ideaLength: ideaText?.length || 0, 
      hasIdToken: !!idToken 
    });

    // Validate input
    if (!ideaText || !idToken) {
      console.error('Missing required fields:', { 
        hasIdeaText: !!ideaText, 
        hasIdToken: !!idToken 
      });
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: ideaText and idToken'
      }, { status: 400 });
    }

    // Authenticate user
    const decoded = await verifyFirebaseIdToken(idToken);
    uid = decoded.uid;
    console.log('User authenticated:', { uid });

    // Check token balance
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.error('User document not found:', { uid });
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    const tokenBalance = userDoc.data()?.token_balance || 0;
    console.log('Current token balance:', { uid, tokenBalance });

    // Validate sufficient tokens
    if (tokenBalance < 1) {
      console.error('Insufficient tokens:', { uid, tokenBalance });
      return NextResponse.json({
        success: false,
        error: 'Not enough tokens'
      }, { status: 403 });
    }

    // Call OpenAI API
    console.log('Calling OpenAI API...');
    const analysis = await callOpenAI(ideaText);
    console.log('OpenAI analysis completed successfully');

    // Deduct 1 token
    const newTokenBalance = tokenBalance - 1;
    console.log('Deducting 1 token:', { 
      uid, 
      previousBalance: tokenBalance, 
      newBalance: newTokenBalance 
    });
    
    await userRef.update({
      token_balance: newTokenBalance,
      updated_at: new Date(),
    });

    // Create idea document
    const ideaRef = adminDb
      .collection("users")
      .doc(uid)
      .collection("ideas")
      .doc();

    const ideaId = ideaRef.id;
    
    await ideaRef.set({
      ideaText,
      createdAt: Timestamp.now(),
      tokensUsed: 1,
      analysis: analysis.grading
    });
    console.log('Idea stored in Firestore:', { ideaId, uid });

    // Create checklist document
    const checklistRef = adminDb.collection("checklists").doc();
    
    await checklistRef.set({
      idea_id: ideaId,
      user_id: uid,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
      sections: analysis.checklist
    });
    console.log('Checklist stored in Firestore:', { 
      checklistId: checklistRef.id, 
      ideaId, 
      uid 
    });

    console.log('=== IDEA ANALYSIS REQUEST SUCCESS ===');
    
    return NextResponse.json({
      success: true,
      ideaId
    });

  } catch (error) {
    console.error('=== IDEA ANALYSIS REQUEST ERROR ===');
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to analyze idea'
    }, { status: 500 });
  }
} 