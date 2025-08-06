// MOCK ROUTE — DO NOT CALL OPENAI FROM HERE
import { NextRequest, NextResponse } from 'next/server';

// Types for mock analysis response
interface GradingData {
  overall_score: number;
  market_potential: number;
  competition: number;
  monetization: number;
  execution: number;
  recommendation: string;
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

interface MockAnalysisResponse {
  grading: GradingData;
  insights: string[];
  risks: string[];
  checklist: ChecklistData;
  summary_analysis: string;
  similar_products: Array<{
    name: string;
    description: string;
    url?: string;
  }>;
  monetization_models: string[];
  gtm_channels: string[];
  score_explanations: {
    market_potential: string;
    competition: string;
    monetization: string;
    execution: string;
  };
}

// Static mock data for demo purposes
const getMockAnalysis = (ideaText: string): MockAnalysisResponse => {
  return {
    grading: {
      overall_score: 78,
      market_potential: 82,
      competition: 65,
      monetization: 75,
      execution: 70,
      recommendation: "Worth Building",
    },
    insights: [ // MUST always be defined as array — frontend uses .join()
      "Market size appears substantial with clear demand signals",
      "Competition is moderate but differentiation opportunities exist", 
      "Monetization path is clear with multiple revenue streams possible",
      "Execution complexity is manageable with modern tools",
      "Strong product-market fit potential in target segment",
      "Scalability considerations are well-addressed"
    ],
    risks: [ // MUST always be defined as array — frontend uses .join()
      "Market timing risk - ensure demand is current, not historical",
      "Customer acquisition cost may be higher than expected", 
      "Technical debt could accumulate without proper architecture planning"
    ],
    checklist: {
      marketPotential: {
        score: 4,
        suggestions: [ // MUST always be defined as array
          {
            id: "mp-1",
            text: "Conduct 20 customer interviews to validate demand",
            impact_score: 9,
            priority: "high"
          },
          {
            id: "mp-2",
            text: "Analyze competitor pricing and positioning",
            impact_score: 7,
            priority: "medium"
          },
          {
            id: "mp-3",
            text: "Define your unique value proposition clearly",
            impact_score: 8,
            priority: "high"
          }
        ]
      },
      monetizationClarity: {
        score: 3,
        suggestions: [ // MUST always be defined as array
          {
            id: "mc-1",
            text: "Test pricing with 10 potential customers",
            impact_score: 8,
            priority: "high"
          },
          {
            id: "mc-2",
            text: "Research similar SaaS pricing models",
            impact_score: 6,
            priority: "medium"
          },
          {
            id: "mc-3",
            text: "Create a revenue projection model",
            impact_score: 7,
            priority: "medium"
          }
        ]
      },
      executionDifficulty: {
        score: 4,
        suggestions: [ // MUST always be defined as array
          {
            id: "ed-1",
            text: "Build a no-code MVP in 2 weeks",
            impact_score: 9,
            priority: "high"
          },
          {
            id: "ed-2",
            text: "Set up analytics and user tracking",
            impact_score: 6,
            priority: "medium"
          },
          {
            id: "ed-3",
            text: "Create a technical architecture plan",
            impact_score: 7,
            priority: "medium"
          }
        ]
      }
    },
    summary_analysis: `Analysis of "${ideaText}": This startup idea shows strong potential with a clear market opportunity and viable monetization path. The competitive landscape is manageable, and execution complexity is reasonable for a small team. Key strengths include substantial market size and clear demand signals, while main risks involve market timing and customer acquisition costs. Overall, this idea is worth pursuing with proper validation and execution planning.`,
    similar_products: [ // MUST always be defined as array — frontend uses .map()
      {
        name: "Competitor A",
        description: "Established platform in similar space with strong market presence",
        url: "https://example.com/competitor-a"
      },
      {
        name: "Competitor B", 
        description: "Emerging startup with innovative approach to the problem",
        url: "https://example.com/competitor-b"
      },
      {
        name: "Competitor C",
        description: "Traditional solution that could be disrupted by modern approach"
      },
      {
        name: "Competitor D",
        description: "Adjacent market player with potential for expansion"
      }
    ],
    monetization_models: [ // MUST always be defined as array — frontend uses .map()
      "Subscription", 
      "Freemium", 
      "Marketplace"
    ],
    gtm_channels: [ // MUST always be defined as array — frontend uses .map()
      "Content Marketing", 
      "Community", 
      "Partnerships"
    ],
    score_explanations: { // MUST always be complete object
      market_potential: "Large addressable market with clear demand signals and growth potential.",
      competition: "Moderate competition with opportunities for differentiation and market positioning.",
      monetization: "Clear revenue model with multiple pricing tiers and value-based pricing potential.",
      execution: "Technically feasible with modern tools and reasonable development timeline."
    }
  };
};

export async function POST(request: NextRequest) {
  console.log('=== MOCK IDEA GRADING REQUEST START ===');
  
  try {
    // Parse request
    const requestData = await request.json();
    const idea = requestData.idea;
    const idToken = requestData.idToken;
    
    console.log('Mock request parsed:', { 
      ideaLength: idea?.length || 0, 
      hasIdToken: !!idToken 
    });

    // Validate input
    if (!idea || !idToken) {
      console.error('Missing required fields:', { 
        hasIdea: !!idea, 
        hasIdToken: !!idToken 
      });
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: idea and idToken'
      }, { status: 400 });
    }

    // Generate mock analysis
    console.log('Generating mock analysis...');
    const mockAnalysis = getMockAnalysis(idea);
    console.log('Mock analysis completed successfully');

    console.log('=== MOCK IDEA GRADING REQUEST SUCCESS ===');
    
    return NextResponse.json({
      success: true,
      analysis: mockAnalysis.grading,
      insights: mockAnalysis.insights || [], // MUST always be defined as array — frontend uses .join()
      risks: mockAnalysis.risks || [], // MUST always be defined as array — frontend uses .join()
      checklist: mockAnalysis.checklist || {
        marketPotential: { score: 3, suggestions: [] },
        monetizationClarity: { score: 3, suggestions: [] },
        executionDifficulty: { score: 3, suggestions: [] }
      },
      summary_analysis: mockAnalysis.summary_analysis || "",
      similar_products: mockAnalysis.similar_products || [], // MUST always be defined as array — frontend uses .map()
      monetization_models: mockAnalysis.monetization_models || [], // MUST always be defined as array — frontend uses .map()
      gtm_channels: mockAnalysis.gtm_channels || [], // MUST always be defined as array — frontend uses .map()
      score_explanations: mockAnalysis.score_explanations || {
        market_potential: "",
        competition: "",
        monetization: "",
        execution: ""
      }
    });

  } catch (error) {
    console.error('=== MOCK IDEA GRADING REQUEST ERROR ===');
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate mock analysis'
    }, { status: 500 });
  }
} 