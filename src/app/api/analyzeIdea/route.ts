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

interface SimilarProduct {
  name: string;
  description: string;
  url?: string;
}

interface ScoreExplanation {
  market_potential: string;
  competition: string;
  monetization: string;
  execution: string;
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
  similar_products: SimilarProduct[];
  monetization_models: string[];
  gtm_channels: string[];
  score_explanations: ScoreExplanation;
}

// System prompt for OpenAI
const SYSTEM_MESSAGE = `You are a veteran startup analyst advising experienced founders and early-stage investors. Your job is to assess and critique startup ideas with the same depth and practicality as a founder due diligence session.

1. Grading Analysis (0–100) — Provide numeric scores with 1–2 sentence justifications:
   - overall_score: Total viability considering all dimensions
   - market_potential: Size, urgency, segmentation of the problem
   - competition: Market saturation, dominant players, competitive edge
   - monetization: Revenue clarity, pricing feasibility, business model fit
   - execution: Technical and operational feasibility for a small team
   - recommendation: A one-line summary of whether to pursue or not and why
   - insights: 4–6 high-signal observations with strategic relevance (e.g., niche opportunities, trust barriers, risk areas)

2. User Archetype
   - Define the most likely initial target user (demographics, pain points, behavior)

3. Key Risks or Blind Spots
   - List up to 3 key risks, trust barriers, legal challenges, or founder-fit concerns

4. Structured Action Checklist (by dimension)
   For each of the following, return:
   - score: 1–5 based on how well the idea addresses it
   - suggestions: Array of 3–5 clear, tactical steps (each with id, text, impact_score 1–10, priority: high/medium/low)

   Categories:
   - marketPotential
   - monetizationClarity
   - executionDifficulty

5. Additional Structured Data:
   - similar_products: Array of 2–4 existing products/services that are similar to this idea. Each should have name, description, and optional url
   - monetization_models: Array of 2–3 potential revenue models (e.g., "Subscription", "Freemium", "Marketplace")
   - gtm_channels: Array of 2–3 go-to-market strategies (e.g., "Content Marketing", "Partnerships", "Community")
   - score_explanations: One-sentence rationale for each scoring dimension (market_potential, competition, monetization, execution)

Return ONLY valid JSON with these top-level keys: "grading", "userArchetype", "risks", "checklist", "similar_products", "monetization_models", "gtm_channels", and "score_explanations".

IMPORTANT: All values in the returned JSON must be valid according to strict JSON formatting. 
- Do NOT include numeric ranges like 30-50. Instead, return them as strings (e.g., "30-50").
- All keys and string values must be wrapped in double quotes.
- Do not include trailing commas.
- Do not include comments or JavaScript-style expressions.
- Ensure all numeric values are actual numbers, not expressions.
- Ensure all string values are properly quoted strings.

Do NOT use markdown formatting. Do NOT wrap your response in triple backticks. Return raw JSON only. Focus on actionable, founder-grade insight. Use real-world examples when identifying similar products.

The response must be strictly parseable by JSON.parse().`; 

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
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_MESSAGE },
        { role: 'user', content: `Startup Idea: ${ideaText}\n\nPlease analyze this startup idea and return the JSON response with "grading" and "checklist" keys.` }
      ],
      temperature: 0.4,
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

    console.log('Attempting to parse OpenAI response:', cleanContent.substring(0, 500) + '...');

    const parsed = JSON.parse(cleanContent);
    
    // Validate response structure
    if (!parsed.grading || !parsed.checklist) {
      throw new Error('Invalid OpenAI response structure');
    }
    
    // Validate new required fields
    if (!parsed.similar_products || !Array.isArray(parsed.similar_products)) {
      throw new Error('Missing or invalid similar_products field');
    }
    
    if (!parsed.monetization_models || !Array.isArray(parsed.monetization_models)) {
      throw new Error('Missing or invalid monetization_models field');
    }
    
    if (!parsed.gtm_channels || !Array.isArray(parsed.gtm_channels)) {
      throw new Error('Missing or invalid gtm_channels field');
    }
    
    if (!parsed.score_explanations || typeof parsed.score_explanations !== 'object') {
      throw new Error('Missing or invalid score_explanations field');
    }
    
    return parsed as OpenAIResponse;
  } catch (parseError) {
    console.error('Failed to parse OpenAI response. Raw content:', content);
    console.error('Parse error details:', parseError);
    throw new Error(`Invalid JSON response from OpenAI. Raw output logged. Error: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
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
      analysis: analysis.grading,
      public: false, // Default to private
      initial_scores: {
        market: analysis.grading.market_potential,
        differentiation: analysis.grading.competition,
        monetization: analysis.grading.monetization,
        execution: analysis.grading.execution,
        growth: analysis.grading.market_potential, // Using market potential as growth proxy
        overall: analysis.grading.overall_score
      },
      // Store new structured data
      similar_products: analysis.similar_products,
      monetization_models: analysis.monetization_models,
      gtm_channels: analysis.gtm_channels,
      score_explanations: analysis.score_explanations
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