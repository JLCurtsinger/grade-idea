import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Types for regrade request
interface RegradeRequest {
  ideaId: string;
  ideaText: string;
  customFields: {
    target_user_archetype?: string[];
    risk_mitigation_plans?: string[];
    key_insights?: string[];
    checklist_notes?: Record<string, string>;
  };
  checklist: {
    category: string;
    item: string;
    completed: boolean;
  }[];
  userContextNote?: string;
  idToken: string;
}

// Types for AI analysis response
interface GradingData {
  overall_score: number;
  market_potential: number;
  competition: number;
  monetization: number;
  execution: number;
  recommendation: string;
  insights: string[];
}

interface ScoreExplanation {
  market_potential: string;
  competition: string;
  monetization: string;
  execution: string;
}

interface AIActionItem {
  category: string;
  items: string[];
}

interface RegradeResponse {
  success: boolean;
  analysis: {
    overall_score: number;
    market_potential: number;
    competition: number;
    monetization: number;
    execution: number;
    recommendation: string;
    insights: string[];
  };
  summary_analysis?: string;
  ai_action_items?: AIActionItem[];
  ai_key_insights?: string[];
  ai_key_risks?: string[];
  score_explanations?: ScoreExplanation;
}

// System prompt for regrade analysis
const REGRADE_SYSTEM_MESSAGE = `You are a veteran startup analyst re-evaluating a startup idea with additional context provided by the founder. Your job is to provide an updated assessment considering new information and progress made.

1. Grading Analysis (0–100) — Provide updated numeric scores with 1–2 sentence justifications:
   - overall_score: Total viability considering all dimensions and new context
   - market_potential: Size, urgency, segmentation considering new insights
   - competition: Market saturation, competitive edge with new positioning
   - monetization: Revenue clarity, pricing feasibility with new models
   - execution: Technical and operational feasibility with new context
   - recommendation: Updated one-line summary of whether to pursue and why
   - insights: 4–6 high-signal observations incorporating new context

2. Summary Analysis:
   - Provide a concise, one-paragraph summary of the updated analysis
   - Highlight how the new context changes the assessment
   - Include key strengths and remaining concerns

3. Optional Structured Data (if relevant):
   - ai_action_items: Array of action items by category (e.g., "Market Research", "Technical Development")
   - ai_key_insights: Array of 2-3 key strategic insights
   - ai_key_risks: Array of 2-3 updated risk considerations
   - score_explanations: One-sentence rationale for each scoring dimension

Return ONLY valid JSON with these top-level keys: "analysis", "summary_analysis", and optionally "ai_action_items", "ai_key_insights", "ai_key_risks", "score_explanations".

The response must be strictly parseable by JSON.parse(). Focus on actionable, founder-grade insight that incorporates the new context provided.`;

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

// Call OpenAI API for regrade
const callOpenAIForRegrade = async (
  ideaText: string,
  customFields: RegradeRequest['customFields'],
  checklist: RegradeRequest['checklist'],
  userContextNote?: string
): Promise<RegradeResponse> => {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Build context from custom fields and checklist
  let contextString = '';
  
  if (customFields.target_user_archetype?.length) {
    contextString += `\nTarget User Archetypes: ${customFields.target_user_archetype.join(', ')}`;
  }
  
  if (customFields.key_insights?.length) {
    contextString += `\nKey Insights: ${customFields.key_insights.join(', ')}`;
  }
  
  if (customFields.risk_mitigation_plans?.length) {
    contextString += `\nRisk Mitigation Plans: ${customFields.risk_mitigation_plans.join(', ')}`;
  }
  
  if (checklist.length) {
    const completedItems = checklist.filter(item => item.completed).map(item => item.item);
    const pendingItems = checklist.filter(item => !item.completed).map(item => item.item);
    
    if (completedItems.length) {
      contextString += `\nCompleted Checklist Items: ${completedItems.join(', ')}`;
    }
    if (pendingItems.length) {
      contextString += `\nPending Checklist Items: ${pendingItems.join(', ')}`;
    }
  }
  
  if (customFields.checklist_notes && Object.keys(customFields.checklist_notes).length) {
    const notes = Object.entries(customFields.checklist_notes)
      .map(([item, note]) => `${item}: ${note}`)
      .join('; ');
    contextString += `\nChecklist Notes: ${notes}`;
  }

  const userMessage = `Original Startup Idea: ${ideaText}

Additional Context:${contextString}

${userContextNote ? `\nUser Notes: ${userContextNote}` : ''}

Please re-evaluate this startup idea considering the additional context provided. Focus on how the new information changes the assessment and what the updated recommendation should be.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: REGRADE_SYSTEM_MESSAGE },
        { role: 'user', content: userMessage }
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

    console.log('Attempting to parse OpenAI regrade response:', cleanContent.substring(0, 500) + '...');

    const parsed = JSON.parse(cleanContent);
    
    // Validate response structure
    if (!parsed.analysis) {
      throw new Error('Invalid OpenAI response structure - missing analysis');
    }
    
    return parsed as RegradeResponse;
  } catch (parseError) {
    console.error('Failed to parse OpenAI regrade response. Raw content:', content);
    console.error('Parse error details:', parseError);
    throw new Error(`Invalid JSON response from OpenAI. Raw output logged. Error: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
  }
};

export async function POST(request: NextRequest) {
  console.log('=== IDEA REGRADE REQUEST START ===');
  
  try {
    // Parse request
    const requestData: RegradeRequest = await request.json();
    const { ideaId, ideaText, customFields, checklist, userContextNote, idToken } = requestData;
    
    console.log('Regrade request parsed:', { 
      ideaId,
      ideaLength: ideaText?.length || 0, 
      hasIdToken: !!idToken,
      hasUserContext: !!userContextNote
    });

    // Validate input
    if (!ideaId || !ideaText || !idToken) {
      console.error('Missing required fields:', { 
        hasIdeaId: !!ideaId,
        hasIdeaText: !!ideaText, 
        hasIdToken: !!idToken 
      });
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: ideaId, ideaText, and idToken'
      }, { status: 400 });
    }

    // Authenticate user
    const decoded = await verifyFirebaseIdToken(idToken);
    const uid = decoded.uid;
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

    // Call OpenAI API for regrade
    console.log('Calling OpenAI API for regrade...');
    const regradeAnalysis = await callOpenAIForRegrade(ideaText, customFields, checklist, userContextNote);
    console.log('OpenAI regrade analysis completed successfully');

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

    // Update idea document with new analysis
    const ideaRef = adminDb
      .collection("users")
      .doc(uid)
      .collection("ideas")
      .doc(ideaId);

    const updateData: any = {
      analysis: regradeAnalysis.analysis,
      last_regraded_at: Timestamp.now(),
    };

    // Add optional fields if they exist
    if (regradeAnalysis.summary_analysis) {
      updateData.summary_analysis = regradeAnalysis.summary_analysis;
    }
    
    if (regradeAnalysis.ai_action_items) {
      updateData.ai_action_items = regradeAnalysis.ai_action_items;
    }
    
    if (regradeAnalysis.ai_key_insights) {
      updateData.ai_key_insights = regradeAnalysis.ai_key_insights;
    }
    
    if (regradeAnalysis.ai_key_risks) {
      updateData.ai_key_risks = regradeAnalysis.ai_key_risks;
    }
    
    if (regradeAnalysis.score_explanations) {
      updateData.score_explanations = regradeAnalysis.score_explanations;
    }

    await ideaRef.update(updateData);
    console.log('Idea updated in Firestore:', { ideaId, uid });

    console.log('=== IDEA REGRADE REQUEST SUCCESS ===');
    
    return NextResponse.json({
      success: true,
      analysis: regradeAnalysis.analysis,
      summary_analysis: regradeAnalysis.summary_analysis,
      ai_action_items: regradeAnalysis.ai_action_items,
      ai_key_insights: regradeAnalysis.ai_key_insights,
      ai_key_risks: regradeAnalysis.ai_key_risks,
      score_explanations: regradeAnalysis.score_explanations,
    });

  } catch (error) {
    console.error('=== IDEA REGRADE REQUEST ERROR ===');
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to regrade idea'
    }, { status: 500 });
  }
}
