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
    insights: string[]; // MUST always be defined as array — frontend uses .join()
  };
  insights: string[]; // MUST always be defined as array — frontend uses .join()
  risks: string[]; // MUST always be defined as array — frontend uses .join()
  checklist: {
    marketPotential: {
      score: number;
      suggestions: Array<{
        id: string;
        text: string;
        impact_score: number;
        priority: 'high' | 'medium' | 'low';
      }>;
    };
    monetizationClarity: {
      score: number;
      suggestions: Array<{
        id: string;
        text: string;
        impact_score: number;
        priority: 'high' | 'medium' | 'low';
      }>;
    };
    executionDifficulty: {
      score: number;
      suggestions: Array<{
        id: string;
        text: string;
        impact_score: number;
        priority: 'high' | 'medium' | 'low';
      }>;
    };
  };
}

export interface MockAnalysisError {
  success: false;
  error: string;
}

export type MockAnalysisResult = MockAnalysisResponse | MockAnalysisError;

export interface AddCustomGtmChannelResponse {
  success: boolean;
  customChannels: string[];
}

export interface AddCustomGtmChannelError {
  success: false;
  error: string;
}

export type AddCustomGtmChannelResult = AddCustomGtmChannelResponse | AddCustomGtmChannelError;

export interface GetCustomGtmChannelsResponse {
  success: boolean;
  customChannels: string[];
}

export interface GetCustomGtmChannelsError {
  success: false;
  error: string;
}

export type GetCustomGtmChannelsResult = GetCustomGtmChannelsResponse | GetCustomGtmChannelsError;

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
        analysis: data.analysis,
        insights: data.insights || [],
        risks: data.risks || [],
        checklist: data.checklist || {
          marketPotential: { score: 3, suggestions: [] },
          monetizationClarity: { score: 3, suggestions: [] },
          executionDifficulty: { score: 3, suggestions: [] }
        }
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

/**
 * Add a custom go-to-market channel to an idea
 * @param ideaId - The ID of the idea
 * @param channel - The custom channel to add
 * @param user - The authenticated Firebase user
 * @returns Promise with the result
 */
export async function addCustomGtmChannel(
  ideaId: string,
  channel: string,
  user: User
): Promise<AddCustomGtmChannelResult> {
  try {
    // Get the current user's ID token
    const idToken = await user.getIdToken();
    
    // Call the add-custom-gtm-channel API
    const response = await fetch('/api/add-custom-gtm-channel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ideaId,
        channel,
        idToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Add custom GTM channel API error:', {
        status: response.status,
        error: data.error,
        ideaId,
        channel,
        userId: user.uid
      });
      
      return {
        success: false,
        error: data.error || 'Failed to add custom channel'
      };
    }

    if (data.success && data.customChannels) {
      console.log('Custom GTM channel added successfully:', {
        ideaId,
        channel,
        userId: user.uid,
        totalChannels: data.customChannels.length
      });
      
      return {
        success: true,
        customChannels: data.customChannels
      };
    } else {
      console.error('Invalid response from add-custom-gtm-channel API:', data);
      return {
        success: false,
        error: 'Invalid response from server'
      };
    }
  } catch (error) {
    console.error('Error calling add-custom-gtm-channel API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
}

/**
 * Get custom go-to-market channels for an idea
 * @param ideaId - The ID of the idea
 * @param user - The authenticated Firebase user
 * @returns Promise with the custom channels
 */
export async function getCustomGtmChannels(
  ideaId: string,
  user: User
): Promise<GetCustomGtmChannelsResult> {
  try {
    // Get the current user's ID token
    const idToken = await user.getIdToken();
    
    // Call the get-custom-gtm-channels API
    const response = await fetch('/api/get-custom-gtm-channels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ideaId,
        idToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Get custom GTM channels API error:', {
        status: response.status,
        error: data.error,
        ideaId,
        userId: user.uid
      });
      
      return {
        success: false,
        error: data.error || 'Failed to get custom channels'
      };
    }

    if (data.success && Array.isArray(data.customChannels)) {
      console.log('Custom GTM channels retrieved successfully:', {
        ideaId,
        userId: user.uid,
        channelsCount: data.customChannels.length
      });
      
      return {
        success: true,
        customChannels: data.customChannels
      };
    } else {
      console.error('Invalid response from get-custom-gtm-channels API:', data);
      return {
        success: false,
        error: 'Invalid response from server'
      };
    }
  } catch (error) {
    console.error('Error calling get-custom-gtm-channels API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
} 