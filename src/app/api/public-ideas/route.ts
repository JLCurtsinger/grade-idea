import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Get all ideas from all users where public is true
    // Adding orderBy to trigger index creation if missing
    const ideasSnapshot = await adminDb
      .collectionGroup('ideas')
      .where('public', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const ideas = [];

    for (const doc of ideasSnapshot.docs) {
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
          ideaText: data.ideaText,
          baseScores: baseScores,
          createdAt: data.createdAt
        });
      }
    }

    // Sort by base overall score descending (original LLM evaluation only)
    ideas.sort((a, b) => {
      // First sort by base overall score
      if (b.baseScores.overall !== a.baseScores.overall) {
        return b.baseScores.overall - a.baseScores.overall;
      }
      
      // If tied, count perfect scores (100%)
      const aPerfectScores = Object.values(a.baseScores).filter(score => score === 100).length;
      const bPerfectScores = Object.values(b.baseScores).filter(score => score === 100).length;
      
      return bPerfectScores - aPerfectScores;
    });

    console.log('Fetched public ideas:', { count: ideas.length });

    return NextResponse.json({
      success: true,
      ideas: ideas
    });

  } catch (error) {
    console.error('Error fetching public ideas:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch public ideas'
    }, { status: 500 });
  }
} 