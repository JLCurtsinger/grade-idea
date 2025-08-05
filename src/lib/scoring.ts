import { ChecklistData } from './checklist';
import { getLetterGrade } from './gradingScale';

export interface DynamicScores {
  market_potential: number;
  monetization: number;
  execution: number;
  overall_score: number;
  letter_grade: string;
}

/**
 * Calculate category score based on checklist completion
 * @param suggestions Array of checklist suggestions
 * @returns Score from 0-100
 */
export function calculateCategoryScore(suggestions: Array<{ completed: boolean }>): number {
  if (suggestions.length === 0) return 0;
  
  const completedItems = suggestions.filter(item => item.completed).length;
  const totalItems = suggestions.length;
  
  // Calculate score as (completed/total) * 100
  return Math.round((completedItems / totalItems) * 100);
}

/**
 * Calculate overall score from category scores
 * @param categoryScores Object with category scores
 * @returns Overall score from 0-100
 */
export function calculateOverallScore(categoryScores: {
  market_potential: number;
  monetization: number;
  execution: number;
}): number {
  const scores = Object.values(categoryScores);
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return Math.round(average);
}

/**
 * Calculate dynamic scores from checklist data
 * @param checklistData The checklist data with completion status
 * @param baseScore Optional base score to prevent dropping below original
 * @returns Object with all calculated scores and letter grade
 */
export function calculateDynamicScores(checklistData: ChecklistData, baseScore?: number): DynamicScores {
  // Calculate category scores based on checklist completion
  const market_potential = calculateCategoryScore(checklistData.marketPotential.suggestions);
  const monetization = calculateCategoryScore(checklistData.monetizationClarity.suggestions);
  const execution = calculateCategoryScore(checklistData.executionDifficulty.suggestions);
  
  // Calculate overall score
  let overall_score = calculateOverallScore({
    market_potential,
    monetization,
    execution
  });
  
  // Prevent score from dropping below base score if provided
  if (baseScore !== undefined && overall_score < baseScore) {
    overall_score = baseScore;
  }
  
  // Get letter grade
  const { letter } = getLetterGrade(overall_score);
  
  return {
    market_potential,
    monetization,
    execution,
    overall_score,
    letter_grade: letter
  };
}

/**
 * Calculate dynamic scores from checklist data (client-side only)
 * @param checklistData The checklist data with completion status
 * @param baseScore Optional base score to prevent dropping below original
 * @returns Object with all calculated scores and letter grade
 */
export function calculateDynamicScoresFromClient(checklistData: ChecklistData, baseScore?: number): DynamicScores {
  // Calculate dynamic section scores
  const calculateSectionScore = (section: any, baseSectionScore: number) => {
    const completedItems = section.suggestions.filter((item: any) => item.completed);
    const additionalScore = completedItems.reduce((sum: number, item: any) => sum + (item.impact_score || 0), 0);
    
    // Convert base score from 1-5 scale to 0-100 scale (multiply by 20)
    const baseScore100 = baseSectionScore * 20;
    
    // Calculate dynamic score with protection
    const rawScore = baseScore100 + additionalScore;
    const dynamicScore = Math.min(100, Math.max(baseScore100, rawScore));
    
    return Math.round(dynamicScore);
  };
  
  // Calculate each section's dynamic score
  const market_potential = calculateSectionScore(checklistData.marketPotential, checklistData.marketPotential.score);
  const monetization = calculateSectionScore(checklistData.monetizationClarity, checklistData.monetizationClarity.score);
  const execution = calculateSectionScore(checklistData.executionDifficulty, checklistData.executionDifficulty.score);
  
  // Calculate overall score as average of section scores
  const overall_score = Math.round((market_potential + monetization + execution) / 3);
  
  // Get letter grade
  const { letter } = getLetterGrade(overall_score);
  
  return {
    market_potential,
    monetization,
    execution,
    overall_score,
    letter_grade: letter
  };
} 