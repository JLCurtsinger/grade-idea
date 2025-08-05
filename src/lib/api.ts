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

export interface MockAnalysisResponse {
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
}

export interface MockAnalysisError {
  success: false;
  error: string;
}

export type MockAnalysisResult = MockAnalysisResponse | MockAnalysisError;

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

/**
 * Submit an idea for mock analysis using the grade-idea API (for non-authenticated users)
 * @param ideaText - The startup idea text to analyze
 * @returns Promise with the mock analysis result
 */
export async function submitIdeaForMockAnalysis(
  ideaText: string
): Promise<MockAnalysisResult> {
  try {
    // Call the grade-idea API (which returns mock data)
    const response = await fetch('/api/grade-idea', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idea: ideaText,
        idToken: 'mock_token', // Mock token for non-authenticated users
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('GradeIdea API error:', {
        status: response.status,
        error: data.error,
        ideaLength: ideaText.length
      });
      
      return {
        success: false,
        error: data.error || 'Failed to analyze idea'
      };
    }

    if (data.success && data.analysis) {
      console.log('Mock idea analysis completed successfully:', {
        ideaLength: ideaText.length
      });
      
      return {
        success: true,
        analysis: data.analysis
      };
    } else {
      console.error('Invalid response from gradeIdea API:', data);
      return {
        success: false,
        error: 'Invalid response from server'
      };
    }
  } catch (error) {
    console.error('Error calling gradeIdea API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
} 