import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentIdeaId = params.id;
    
    if (!currentIdeaId) {
      return NextResponse.json({
        success: false,
        error: 'Idea ID is required'
      }, { status: 400 });
    }

    // Get all public ideas except the current one
    const ideasSnapshot = await getAdminDb()
      .collectionGroup('ideas')
      .where('public', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const ideas = [];

    for (const doc of ideasSnapshot.docs) {
      // Skip the current idea
      if (doc.id === currentIdeaId) {
        continue;
      }

      const data = doc.data();
      
      // Only include ideas that have ideaText
      if (!data.ideaText) {
        continue;
      }

      // Use baseScores for public ranking (original LLM evaluation only)
      // Fallback to initial_scores for legacy data, never use analysis (modified scores)
      let baseScores = data.baseScores;
      if (!baseScores && data.initial_scores) {
        // Legacy data fallback - use initial_scores if baseScores doesn't exist
        baseScores = data.initial_scores;
      }
      if (!baseScores && data.analysis) {
        // Last resort fallback - convert analysis to baseScores format
        // This ensures we never use modified scores for public ranking
        baseScores = {
          market: data.analysis.market_potential || 0,
          differentiation: data.analysis.competition || 0,
          monetization: data.analysis.monetization || 0,
          execution: data.analysis.execution || 0,
          growth: data.analysis.market_potential || 0, // Using market potential as growth proxy
          overall: data.analysis.overall_score || 0
        };
      }

      if (baseScores && data.ideaText) {
        ideas.push({
          id: doc.id,
          title: data.ideaText, // Using title for consistency with the frontend
          ideaText: data.ideaText,
          baseScores: baseScores,
          createdAt: data.createdAt,
          recommendation: data.analysis?.recommendation || data.grading?.recommendation || null
        });
      }
    }

    // Sort by overall score and limit to 5 related ideas
    ideas.sort((a, b) => b.baseScores.overall - a.baseScores.overall);
    const relatedIdeas = ideas.slice(0, 5);

    console.log('Fetched related ideas:', { count: relatedIdeas.length, currentIdeaId });

    return NextResponse.json({
      success: true,
      relatedIdeas: relatedIdeas
    });

  } catch (error) {
    console.error('Error fetching related ideas:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch related ideas'
    }, { status: 500 });
  }
}
