import { User } from 'firebase/auth';

export interface AnalyzeIdeaResponse {
  success: boolean;
  ideaId: string;
}

export interface AnalyzeIdeaError {
  success: false;
  error: string;
}

export type AnalyzeIdeaResult = AnalyzeIdeaResponse | AnalyzeIdeaError;

/**
 * Submit an idea for analysis using the analyzeIdea API
 * @param ideaText - The startup idea text to analyze
 * @param user - The authenticated Firebase user
 * @returns Promise with the analysis result
 */
export async function submitIdeaForAnalysis(
  ideaText: string, 
  user: User
): Promise<AnalyzeIdeaResult> {
  try {
    // Get the current user's ID token
    const idToken = await user.getIdToken();
    
    // Call the analyzeIdea API
    const response = await fetch('/api/analyzeIdea', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ideaText,
        idToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('AnalyzeIdea API error:', {
        status: response.status,
        error: data.error,
        ideaLength: ideaText.length,
        userId: user.uid
      });
      
      return {
        success: false,
        error: data.error || 'Failed to analyze idea'
      };
    }

    if (data.success && data.ideaId) {
      console.log('Idea analysis completed successfully:', {
        ideaId: data.ideaId,
        userId: user.uid,
        ideaLength: ideaText.length
      });
      
      return {
        success: true,
        ideaId: data.ideaId
      };
    } else {
      console.error('Invalid response from analyzeIdea API:', data);
      return {
        success: false,
        error: 'Invalid response from server'
      };
    }
  } catch (error) {
    console.error('Error calling analyzeIdea API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
} 