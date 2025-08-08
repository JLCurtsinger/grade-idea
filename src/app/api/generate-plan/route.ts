import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, incrementUserTokens, getUserTokenBalance } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Request interface
interface GeneratePlanRequest {
  ideaId: string;
  checklistItemId: string;
  checklistItemText: string;
  ideaDescription: string;
  idToken: string;
}

// Response interface
interface GeneratePlanResponse {
  plan: string;
}

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

// Call OpenAI API for plan generation
const callOpenAIForPlan = async (ideaDescription: string, checklistItemText: string): Promise<string> => {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `The user is building this startup idea: ${ideaDescription}

Help them complete this action item: ${checklistItemText}

Return a step-by-step plan in paragraph or list format that is practical and actionable. Focus on concrete steps that a founder can take immediately.`;

  // Log the full prompt string before calling OpenAI
  console.log('=== OPENAI PROMPT ===');
  console.log('Full prompt:', prompt);
  console.log('Prompt length:', prompt.length, 'characters');

  const requestBody = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a startup advisor helping founders execute on their ideas. Provide practical, actionable advice.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.4,
    max_tokens: 500,
  };

  console.log('=== OPENAI REQUEST ===');
  console.log('Request body:', JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('=== OPENAI RESPONSE STATUS ===');
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('=== OPENAI API ERROR ===');
      console.error('Error status:', response.status);
      console.error('Error text:', errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Log the full raw response object (sanitized to avoid long token dumps)
    console.log('=== OPENAI RESPONSE DATA ===');
    console.log('Response structure:', {
      id: data.id,
      object: data.object,
      created: data.created,
      model: data.model,
      choices: data.choices ? {
        length: data.choices.length,
        firstChoice: data.choices[0] ? {
          index: data.choices[0].index,
          finishReason: data.choices[0].finish_reason,
          message: data.choices[0].message ? {
            role: data.choices[0].message.role,
            contentLength: data.choices[0].message.content?.length || 0,
            contentPreview: data.choices[0].message.content?.substring(0, 100) + '...'
          } : 'No message'
        } : 'No choice'
      } : 'No choices',
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      } : 'No usage data'
    });

    // Validate the structure of the OpenAI response
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error('=== OPENAI RESPONSE VALIDATION ERROR ===');
      console.error('Invalid response structure - no choices array:', data);
      throw new Error('Invalid OpenAI response structure: no choices array');
    }

    const firstChoice = data.choices[0];
    if (!firstChoice.message || !firstChoice.message.content) {
      console.error('=== OPENAI RESPONSE VALIDATION ERROR ===');
      console.error('Invalid choice structure - no message content:', firstChoice);
      throw new Error('Invalid OpenAI response structure: no message content');
    }

    const content = firstChoice.message.content;
    
    console.log('=== OPENAI CONTENT EXTRACTION ===');
    console.log('Extracted content length:', content.length, 'characters');
    console.log('Content preview (first 200 chars):', content.substring(0, 200) + (content.length > 200 ? '...' : ''));

    if (!content || content.trim().length === 0) {
      console.error('=== OPENAI CONTENT VALIDATION ERROR ===');
      console.error('Empty or whitespace-only content received');
      throw new Error('No content received from OpenAI');
    }

    const trimmedContent = content.trim();
    console.log('=== OPENAI FINAL RESULT ===');
    console.log('Final trimmed content length:', trimmedContent.length, 'characters');
    
    return trimmedContent;

  } catch (error) {
    console.error('=== OPENAI CALL ERROR ===');
    console.error('Error calling OpenAI API:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });
    throw error;
  }
};

// Update checklist item with plan in Firestore
const updateChecklistItemWithPlan = async (userId: string, ideaId: string, checklistItemId: string, plan: string) => {
  try {
    // First, find the checklist document
    const checklistsRef = adminDb.collection("checklists");
    const q = checklistsRef.where("idea_id", "==", ideaId).where("user_id", "==", userId);
    const querySnapshot = await q.get();
    
    if (querySnapshot.empty) {
      throw new Error('Checklist not found');
    }

    const checklistDoc = querySnapshot.docs[0];
    const checklistData = checklistDoc.data();
    
    // Log the checklist document ID that is found
    console.log('Found checklist document ID:', checklistDoc.id);
    
    // Find and update the specific checklist item
    let updated = false;
    const updatedSections = { ...checklistData.sections };
    
    for (const [sectionKey, section] of Object.entries(updatedSections)) {
      const sectionData = section as any;
      const suggestions = sectionData.suggestions || [];
      const updatedSuggestions = suggestions.map((item: any) => {
        if (item.id === checklistItemId) {
          updated = true;
          // Log the checklist item being updated
          console.log('Updating checklist item:', { 
            id: item.id, 
            text: item.text || 'No text',
            sectionKey 
          });
          return { ...item, plan };
        }
        return item;
      });
      
      if (updatedSuggestions.length > 0) {
        updatedSections[sectionKey] = {
          ...sectionData,
          suggestions: updatedSuggestions
        };
      }
    }
    
    if (!updated) {
      throw new Error('Checklist item not found');
    }
    
    // Update the checklist document
    await checklistDoc.ref.update({
      sections: updatedSections,
      updated_at: Timestamp.now()
    });
    
    // Log confirmation after the Firestore update is committed
    console.log('Firestore update committed successfully:', { 
      checklistDocId: checklistDoc.id,
      ideaId, 
      checklistItemId 
    });
    
  } catch (error) {
    console.error('Error updating checklist item with plan:', error);
    throw error;
  }
};

export async function POST(request: NextRequest) {
  console.log('=== GENERATE PLAN REQUEST START ===');
  
  let userId: string | undefined;
  let ideaId: string | undefined;
  let checklistItemId: string | undefined;
  let checklistItemText: string | undefined;
  let ideaDescription: string | undefined;
  
  try {
    // Parse request
    const requestData: GeneratePlanRequest = await request.json();
    ideaId = requestData.ideaId;
    checklistItemId = requestData.checklistItemId;
    checklistItemText = requestData.checklistItemText;
    ideaDescription = requestData.ideaDescription;
    const idToken = requestData.idToken;
    
    console.log('Request parsed:', { 
      ideaId,
      checklistItemId,
      textLength: checklistItemText?.length || 0,
      ideaLength: ideaDescription?.length || 0,
      hasIdToken: !!idToken 
    });

    // Validate input
    if (!ideaId || !checklistItemId || !checklistItemText || !ideaDescription || !idToken) {
      console.error('Missing required fields:', { 
        hasIdeaId: !!ideaId,
        hasChecklistItemId: !!checklistItemId,
        hasChecklistItemText: !!checklistItemText,
        hasIdeaDescription: !!ideaDescription,
        hasIdToken: !!idToken 
      });
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Authenticate user
    const decoded = await verifyFirebaseIdToken(idToken);
    userId = decoded.uid;
    console.log('User authenticated:', { userId });

    // Check token balance
    const currentBalance = await getUserTokenBalance(userId);
    console.log('Current token balance:', { userId, currentBalance });

    if (currentBalance < 1) {
      console.error('Insufficient tokens:', { userId, currentBalance });
      return NextResponse.json({
        success: false,
        error: 'Not enough tokens'
      }, { status: 403 });
    }

    // Deduct 1 token
    console.log('Deducting 1 token for plan generation:', { userId, previousBalance: currentBalance });
    await incrementUserTokens(userId, -1, 'unknown');

    // Call OpenAI API
    console.log('Calling OpenAI API for plan generation...');
    const plan = await callOpenAIForPlan(ideaDescription, checklistItemText);
    console.log('OpenAI plan generation completed successfully');
    
    // Log a preview (first 100 chars) of the plan returned from OpenAI
    const planPreview = plan.length > 100 ? plan.substring(0, 100) + '...' : plan;
    console.log('Plan preview (first 100 chars):', planPreview);

    // Store plan in Firestore
    console.log('Storing plan in Firestore...');
    await updateChecklistItemWithPlan(userId, ideaId, checklistItemId, plan);
    console.log('Plan stored in Firestore successfully');

    console.log('=== GENERATE PLAN REQUEST SUCCESS ===');
    
    return NextResponse.json({
      success: true,
      plan
    } as GeneratePlanResponse);

  } catch (error) {
    console.error('=== GENERATE PLAN REQUEST ERROR ===');
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });

    // If we deducted tokens but failed later, we should consider refunding
    // For now, we'll just log the error and let the user know
    if (userId) {
      console.error('Token was deducted but plan generation failed. Consider refunding token to user:', userId);
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to generate plan'
    }, { status: 500 });
  }
} 