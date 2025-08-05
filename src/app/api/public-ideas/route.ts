import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Get all ideas from all users where public is true
    const ideasSnapshot = await adminDb
      .collectionGroup('ideas')
      .where('public', '==', true)
      .get();

    const ideas = [];

    for (const doc of ideasSnapshot.docs) {
      const data = doc.data();
      
      // Only include ideas that have initial_scores
      if (data.initial_scores && data.ideaText) {
        ideas.push({
          id: doc.id,
          ideaText: data.ideaText,
          initial_scores: data.initial_scores,
          createdAt: data.createdAt
        });
      }
    }

    // Sort by overall score descending, then by number of perfect scores
    ideas.sort((a, b) => {
      // First sort by overall score
      if (b.initial_scores.overall !== a.initial_scores.overall) {
        return b.initial_scores.overall - a.initial_scores.overall;
      }
      
      // If tied, count perfect scores (100%)
      const aPerfectScores = Object.values(a.initial_scores).filter(score => score === 100).length;
      const bPerfectScores = Object.values(b.initial_scores).filter(score => score === 100).length;
      
      return bPerfectScores - aPerfectScores;
    });

    // Limit to top 20 ideas
    const topIdeas = ideas.slice(0, 20);

    console.log('Fetched public ideas:', { count: topIdeas.length });

    return NextResponse.json({
      success: true,
      ideas: topIdeas
    });

  } catch (error) {
    console.error('Error fetching public ideas:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch public ideas'
    }, { status: 500 });
  }
} 