import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { logTokenFetch, logTokenUpdate, logTokenError } from '@/lib/utils';

// Types for chained analysis response
interface GradingData {
  overall_score: number;
  market_potential: number;
  competition: number;
  monetization: number;
  execution: number;
  recommendation: string;
}

interface InsightsData {
  insights: string[];
  risks: string[];
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

interface ChainedAnalysisResponse {
  grading: GradingData;
  insights: string[];
  risks: string[];
  checklist: ChecklistData;
}

// System prompts for chained analysis
const STAGE1_SYSTEM_PROMPT = `
You are a veteran startup analyst. Score this startup idea on the following dimensions from 0–100 and include a 1–2 sentence justification for each:
- overall_score
- market_potential
- competition
- monetization
- execution
Also include a one-line recommendation, and return all results in a 'grading' key.
`;

const STAGE2_SYSTEM_PROMPT = `
You are a startup strategist. Based on the previous scoring, return:
- insights[]: 4–6 key strategic insights
- risks[]: up to 3 major risks, red flags, or blind spots
`;

const STAGE3_SYSTEM_PROMPT = `
You are a tactical founder coach. Based on the previous scoring and insights, generate a structured checklist to improve the startup. For each section (marketPotential, monetizationClarity, executionDifficulty), return:
- score: 1–5
- suggestions[]: actionable items with id, text, impact_score (1–10), and priority (high/medium/low)
Return the result under a 'checklist' key.
`;

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

// Chained OpenAI analysis function
const performChainedAnalysis = async (ideaText: string): Promise<ChainedAnalysisResponse> => {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // TODO: Consider parallelizing scoring + insights
  // TODO: Consider caching intermediate results to Firestore
  // TODO: Consider retry logic if a step fails

  // Step 1: Score the idea
  console.log('Step 1: Scoring idea...');
  const stage1Response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: STAGE1_SYSTEM_PROMPT },
        { role: 'user', content: `Startup Idea: ${ideaText}\n\nPlease analyze this startup idea and return the JSON response with "grading" key.` }
      ],
      temperature: 0.4,
    }),
  });

  if (!stage1Response.ok) {
    const errorText = await stage1Response.text();
    console.error('Stage 1 OpenAI API error:', stage1Response.status, errorText);
    throw new Error(`Stage 1 OpenAI API error: ${stage1Response.status}`);
  }

  const stage1Data = await stage1Response.json();
  const stage1Content = stage1Data.choices[0]?.message?.content;
  
  if (!stage1Content) {
    throw new Error('No content received from Stage 1 OpenAI call');
  }

  let stage1Parsed;
  try {
    let cleanContent = stage1Content.trim();
    if (cleanContent.startsWith("```json")) {
      cleanContent = cleanContent.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (cleanContent.startsWith("```")) {
      cleanContent = cleanContent.replace(/^```/, "").replace(/```$/, "").trim();
    }
    stage1Parsed = JSON.parse(cleanContent);
    
    if (!stage1Parsed.grading) {
      throw new Error('Invalid Stage 1 response structure');
    }
  } catch (parseError) {
    console.error('Failed to parse Stage 1 response:', stage1Content);
    throw new Error('Invalid JSON response from Stage 1');
  }

  // Step 2: Generate insights and risks
  console.log('Step 2: Generating insights and risks...');
  const stage2Response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: STAGE2_SYSTEM_PROMPT },
        { role: 'user', content: `Previous scoring: ${JSON.stringify(stage1Parsed.grading)}\n\nStartup Idea: ${ideaText}\n\nPlease generate insights and risks based on the scoring.` }
      ],
      temperature: 0.4,
    }),
  });

  if (!stage2Response.ok) {
    const errorText = await stage2Response.text();
    console.error('Stage 2 OpenAI API error:', stage2Response.status, errorText);
    throw new Error(`Stage 2 OpenAI API error: ${stage2Response.status}`);
  }

  const stage2Data = await stage2Response.json();
  const stage2Content = stage2Data.choices[0]?.message?.content;
  
  if (!stage2Content) {
    throw new Error('No content received from Stage 2 OpenAI call');
  }

  let stage2Parsed;
  try {
    let cleanContent = stage2Content.trim();
    if (cleanContent.startsWith("```json")) {
      cleanContent = cleanContent.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (cleanContent.startsWith("```")) {
      cleanContent = cleanContent.replace(/^```/, "").replace(/```$/, "").trim();
    }
    stage2Parsed = JSON.parse(cleanContent);
    
    if (!stage2Parsed.insights || !stage2Parsed.risks) {
      throw new Error('Invalid Stage 2 response structure');
    }
  } catch (parseError) {
    console.error('Failed to parse Stage 2 response:', stage2Content);
    throw new Error('Invalid JSON response from Stage 2');
  }

  // Step 3: Generate checklist
  console.log('Step 3: Generating checklist...');
  const stage3Response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: STAGE3_SYSTEM_PROMPT },
        { role: 'user', content: `Previous scoring: ${JSON.stringify(stage1Parsed.grading)}\n\nPrevious insights: ${JSON.stringify(stage2Parsed)}\n\nStartup Idea: ${ideaText}\n\nPlease generate a structured checklist based on the scoring and insights.` }
      ],
      temperature: 0.4,
    }),
  });

  if (!stage3Response.ok) {
    const errorText = await stage3Response.text();
    console.error('Stage 3 OpenAI API error:', stage3Response.status, errorText);
    throw new Error(`Stage 3 OpenAI API error: ${stage3Response.status}`);
  }

  const stage3Data = await stage3Response.json();
  const stage3Content = stage3Data.choices[0]?.message?.content;
  
  if (!stage3Content) {
    throw new Error('No content received from Stage 3 OpenAI call');
  }

  let stage3Parsed;
  try {
    let cleanContent = stage3Content.trim();
    if (cleanContent.startsWith("```json")) {
      cleanContent = cleanContent.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (cleanContent.startsWith("```")) {
      cleanContent = cleanContent.replace(/^```/, "").replace(/```$/, "").trim();
    }
    stage3Parsed = JSON.parse(cleanContent);
    
    if (!stage3Parsed.checklist) {
      throw new Error('Invalid Stage 3 response structure');
    }
  } catch (parseError) {
    console.error('Failed to parse Stage 3 response:', stage3Content);
    throw new Error('Invalid JSON response from Stage 3');
  }

  // Combine all results
  return {
    grading: stage1Parsed.grading,
    insights: stage2Parsed.insights,
    risks: stage2Parsed.risks,
    checklist: stage3Parsed.checklist
  };
};

export async function POST(request: NextRequest) {
  console.log('=== IDEA GRADING REQUEST START ===');
  
  // Declare variables at function level for catch block access
  let idea: string | undefined;
  let idToken: string | undefined;
  let uid: string | undefined;
  
  try {
    // Parse request
    const requestData = await request.json();
    idea = requestData.idea;
    idToken = requestData.idToken;
    console.log('Request parsed:', { ideaLength: idea?.length || 0, hasIdToken: !!idToken });

    // Validate input
    if (!idea || !idToken) {
      console.error('Missing required fields:', { hasIdea: !!idea, hasIdToken: !!idToken });
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: idea and idToken'
      }, { status: 400 });
    }

    // Authenticate user (skip for mock tokens)
    let uid: string;
    if (idToken === 'mock_token') {
      uid = 'mock_user';
      console.log('Mock user authenticated for demo');
    } else {
      const decoded = await verifyFirebaseIdToken(idToken);
      uid = decoded.uid;
      console.log('User authenticated:', { uid });
    }
    
    // TEST 2: UID Verification
    console.log('=== UID VERIFICATION ===');
    console.log('API UID:', uid);
    console.log('API UID type:', typeof uid);
    console.log('API UID length:', uid.length);
    console.log('API UID matches pattern:', /^[a-zA-Z0-9]{28}$/.test(uid));

    // Read current token balance from Firestore (skip for mock users)
    let tokenBalance = 0;
    if (uid !== 'mock_user') {
      const userRef = adminDb.collection('users').doc(uid);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        console.error('User document not found:', { uid });
        logTokenError(uid, 'User document not found', 'grade_idea_route');
        return NextResponse.json({
          success: false,
          error: 'User not found'
        }, { status: 404 });
      }

      tokenBalance = userDoc.data()?.token_balance || 0;
      console.log('Current token balance from Firestore:', { uid, tokenBalance });
      logTokenFetch(uid, tokenBalance, 'grade_idea_read');

      // Validate sufficient tokens
      if (tokenBalance < 1) {
        console.error('Insufficient tokens:', { uid, tokenBalance });
        logTokenError(uid, `Insufficient tokens: ${tokenBalance}`, 'grade_idea_validation');
        return NextResponse.json({
          success: false,
          error: 'Not enough tokens'
        }, { status: 403 });
      }
    } else {
      console.log('Mock user - skipping token validation');
    }

    // Perform chained idea analysis
    console.log('Starting chained idea analysis...');
    const analysis = await performChainedAnalysis(idea);
    console.log('Chained idea analysis completed successfully');

    // Ensure we reach the token deduction logic
    console.log('=== REACHING TOKEN DEDUCTION LOGIC ===');
    console.log('About to deduct token:', { uid, currentBalance: tokenBalance });

    // Deduct 1 token and update Firestore (skip for mock users)
    let newTokenBalance = tokenBalance;
    if (uid !== 'mock_user') {
      newTokenBalance = tokenBalance - 1;
      console.log('Deducting 1 token:', { uid, previousBalance: tokenBalance, newBalance: newTokenBalance });
      console.log('[TOKEN_TRANSACTION] Context: deduction | User: ' + uid + ' | Tokens: -1');
      logTokenUpdate(uid, tokenBalance, newTokenBalance, 'deduction');
      
      // Increment total ideas submitted counter
      const userRef = adminDb.collection('users').doc(uid);
      const userDoc = await userRef.get();
      const currentTotalIdeas = userDoc.data()?.totalIdeasSubmitted || 0;
      const newTotalIdeas = currentTotalIdeas + 1;
      console.log('Incrementing total ideas submitted:', { uid, previousTotal: currentTotalIdeas, newTotal: newTotalIdeas });
      
      // Validate UID match and log Firestore path
      console.log('Token deduction - UID being used:', uid);
      console.log('Firestore path:', userRef.path);
      console.log('Admin DB initialized:', !!adminDb);
      
      try {
        console.log('Attempting Firestore token deduction:', {
          uid,
          oldBalance: tokenBalance,
          newTokenBalance,
          userRefPath: userRef.path
        });

        // TEST 3: Check Firestore Write Result
        const updateResult = await userRef.update({
          token_balance: newTokenBalance,
          totalIdeasSubmitted: newTotalIdeas,
          updated_at: new Date(),
        });
        
        console.log('Firestore update result:', updateResult);
        console.log('Token balance updated in Firestore successfully');

        // Verify the update by reading back the value
        const verifyDoc = await userRef.get();
        const verifiedBalance = verifyDoc.data()?.token_balance || 0;
        const verifiedUpdatedAt = verifyDoc.data()?.updated_at;
        
        console.log('Post-update Firestore check:', {
          uid,
          expectedBalance: newTokenBalance,
          actualBalance: verifiedBalance,
          updateSuccessful: verifiedBalance === newTokenBalance,
          verifiedUpdatedAt,
          fullDocument: verifyDoc.data()
        });

        if (verifiedBalance !== newTokenBalance) {
          console.error('CRITICAL: Firestore update verification failed!', {
            uid,
            expected: newTokenBalance,
            actual: verifiedBalance,
            difference: newTokenBalance - verifiedBalance
          });
        }

      } catch (err) {
        console.error('Firestore token_balance update failed:', {
          uid,
          error: err,
          errorMessage: err instanceof Error ? err.message : 'Unknown error',
          errorStack: err instanceof Error ? err.stack : undefined
        });
        throw err; // Re-throw to trigger the outer catch block
      }
    } else {
      console.log('Mock user - skipping token deduction');
    }

    // Store the idea and analysis in Firestore (skip for mock users)
    if (uid !== 'mock_user') {
      const ideaRef = adminDb
        .collection("users")
        .doc(uid)
        .collection("ideas")
        .doc();

      await ideaRef.set({
        ideaText: idea,
        analysis: analysis.grading,
        baseScores: {
          market: analysis.grading.market_potential,
          differentiation: analysis.grading.competition,
          monetization: analysis.grading.monetization,
          execution: analysis.grading.execution,
          growth: analysis.grading.market_potential, // Using market potential as growth proxy
          overall: analysis.grading.overall_score
        },
        createdAt: Timestamp.now(),
        tokensUsed: 1,
        public: false, // Ideas are private by default
      });
      console.log('Idea analysis stored in Firestore:', { ideaId: ideaRef.id, uid });
    } else {
      console.log('Mock user - skipping Firestore storage');
    }

    console.log('=== IDEA GRADING REQUEST SUCCESS ===');
    console.log('Final token balance returned:', { uid, tokenBalance: newTokenBalance });
    
    return NextResponse.json({
      success: true,
      tokenBalance: newTokenBalance,
      analysis: analysis.grading,
      insights: analysis.insights,
      risks: analysis.risks,
      checklist: analysis.checklist
    });

  } catch (error) {
    console.error('=== IDEA GRADING REQUEST ERROR ===');
    console.error('NO TOKEN DEDUCTED — FINAL FALLBACK HIT');
    console.error('Raw request context:', {
      ideaPresent: !!idea,
      idTokenPresent: !!idToken,
      uidKnown: typeof uid !== 'undefined' ? uid : 'unknown',
      projectId: process.env.FIREBASE_PROJECT_ID || 'unknown'
    });
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });

    // Log error with UID if available
    logTokenError(uid || 'unknown', error instanceof Error ? error.message : 'Unknown error', 'grade_idea_route');

    // Return consistent error response
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze idea'
    }, { status: 500 });
  }
} 