"use client";

import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  DollarSign, 
  Zap,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Sparkles
} from "lucide-react";
import { useChecklist } from "@/hooks/useChecklist";
import { ChecklistData } from "@/lib/checklist";
import { calculateDynamicScoresFromClient } from "@/lib/scoring";


interface IdeaChecklistProps {
  ideaId: string;
  baseScore?: number;
  onScoreUpdate?: (scores: {
    market_potential: number;
    monetization: number;
    execution: number;
    overall_score: number;
    letter_grade: string;
  }) => void;
}

export function IdeaChecklist({ ideaId, baseScore, onScoreUpdate }: IdeaChecklistProps) {
  const { 
    checklistData, 
    loading, 
    error, 
    updateChecklistItem, 
    refreshChecklist 
  } = useChecklist(ideaId);

  const handleToggleSuggestion = async (sectionKey: keyof ChecklistData, suggestionId: string) => {
    // Prevent updates while loading or if data is invalid
    if (!checklistData || loading) return;
    
    const currentItem = checklistData[sectionKey].suggestions.find(item => item.id === suggestionId);
    if (!currentItem) return;
    
    // Store the new completion state
    const newCompletedState = !currentItem.completed;
    
    // Update the checklist item
    await updateChecklistItem(sectionKey, suggestionId, newCompletedState);
    
    // Safely calculate new scores after the checklist has been updated
    try {
      // Only proceed if all required props are valid
      if (onScoreUpdate && typeof baseScore === 'number' && checklistData) {
        // Create updated checklist data with the new completion state
        const updatedChecklistData = {
          ...checklistData,
          [sectionKey]: {
            ...checklistData[sectionKey],
            suggestions: checklistData[sectionKey].suggestions.map(item =>
              item.id === suggestionId ? { ...item, completed: newCompletedState } : item
            )
          }
        };
        
        // Calculate new scores using the updated data
        const newScores = calculateDynamicScoresFromClient(updatedChecklistData, baseScore);
        onScoreUpdate(newScores);
      }
    } catch (error) {
      console.error('Error calculating dynamic scores:', error);
      // Don't throw the error - just log it to prevent modal crashes
    }
  };

  const handlePlanRequest = (checklistItem: any) => {
    // Placeholder function for AI plan generation
    console.log('Plan with AI requested for:', checklistItem);
    // TODO: Implement AI plan generation logic
  };

  const getSectionIcon = (sectionKey: string) => {
    switch (sectionKey) {
      case "marketPotential":
        return <TrendingUp className="w-5 h-5 text-blue-600" />;
      case "monetizationClarity":
        return <DollarSign className="w-5 h-5 text-green-600" />;
      case "executionDifficulty":
        return <Zap className="w-5 h-5 text-orange-600" />;
      default:
        return <TrendingUp className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSectionTitle = (sectionKey: string) => {
    switch (sectionKey) {
      case "marketPotential":
        return "Market Potential";
      case "monetizationClarity":
        return "Monetization Clarity";
      case "executionDifficulty":
        return "Execution Difficulty";
      default:
        return sectionKey;
    }
  };

  const getCompletedCount = (suggestions: any[]) => {
    return suggestions.filter(suggestion => suggestion.completed).length;
  };

  const getProgressPercentage = (suggestions: any[]) => {
    if (suggestions.length === 0) return 0;
    return (getCompletedCount(suggestions) / suggestions.length) * 100;
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-foreground">Action Items</h3>
          <Badge variant="secondary" className="text-xs">
            Loading...
          </Badge>
        </div>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-foreground/60" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-foreground">Action Items</h3>
          <Badge variant="secondary" className="text-xs">
            Error
          </Badge>
        </div>
        <Card className="p-4">
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-sm">{error}</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshChecklist}
            className="mt-3"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  // No data state
  if (!checklistData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-foreground">Action Items</h3>
          <Badge variant="secondary" className="text-xs">
            No data
          </Badge>
        </div>
        <Card className="p-4">
          <p className="text-foreground/60 text-sm">No checklist data available.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold text-foreground">Action Items</h3>
        <Badge variant="secondary" className="text-xs">
          Track your progress
        </Badge>
      </div>

      {Object.entries(checklistData).map(([sectionKey, section]) => (
        <Card key={sectionKey} className="p-4 transition-all duration-200 hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getSectionIcon(sectionKey)}
              <h4 className="font-medium text-foreground">{getSectionTitle(sectionKey)}</h4>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {getCompletedCount(section.suggestions)}/{section.suggestions.length} done
              </Badge>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4 h-2 bg-surface-elevated rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${getProgressPercentage(section.suggestions)}%` }}
            />
          </div>

          <div className="space-y-3">
            {section.suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-200 ${
                  suggestion.completed
                    ? "bg-green-50/10 border border-green-200/20"
                    : "hover:bg-surface-elevated/50 border border-transparent"
                }`}
              >
                <Checkbox
                  id={suggestion.id}
                  checked={suggestion.completed}
                  onCheckedChange={() => handleToggleSuggestion(sectionKey as keyof ChecklistData, suggestion.id)}
                  className="mt-0.5 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor={suggestion.id}
                    className={`block cursor-pointer select-none transition-all duration-200 ${
                      suggestion.completed
                        ? "text-foreground/60 line-through"
                        : "text-foreground"
                    }`}
                  >
                    {suggestion.text}
                  </label>
                  {/* Plan with AI link - only show if no plan exists */}
                  {!suggestion.plan && (
                    <button
                      onClick={() => handlePlanRequest(suggestion)}
                      className="mt-2 text-xs text-brand hover:text-brand/80 transition-colors flex items-center gap-1 group"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span className="group-hover:underline">Plan with AI (1 token)</span>
                    </button>
                  )}
                </div>
                {suggestion.completed && (
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
} 