import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ideaId = params.id;
    
    if (!ideaId) {
      return NextResponse.json({
        success: false,
        error: 'Idea ID is required'
      }, { status: 400 });
    }

    // Search for the idea across all users where public is true
    const ideasSnapshot = await getAdminDb()
      .collectionGroup('ideas')
      .where('public', '==', true)
      .get();

    let foundIdea = null;

    for (const doc of ideasSnapshot.docs) {
      if (doc.id === ideaId) {
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
          foundIdea = {
            id: doc.id,
            ideaText: data.ideaText,
            baseScores: baseScores,
            createdAt: data.createdAt,
            recommendation: data.analysis?.recommendation || data.grading?.recommendation || null
          };
          break;
        }
      }
    }

    if (!foundIdea) {
      return NextResponse.json({
        success: false,
        error: 'Idea not found or not public'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      idea: foundIdea
    });

  } catch (error) {
    console.error('Error fetching public idea:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch public idea'
    }, { status: 500 });
  }
}
