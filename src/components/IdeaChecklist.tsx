"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  DollarSign, 
  Zap,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react";

interface ChecklistSuggestion {
  id: string;
  text: string;
  completed: boolean;
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

interface IdeaChecklistProps {
  checklistData: ChecklistData;
}

export function IdeaChecklist({ checklistData }: IdeaChecklistProps) {
  const [data, setData] = useState<ChecklistData>(checklistData);

  const handleToggleSuggestion = (sectionKey: keyof ChecklistData, suggestionId: string) => {
    setData(prevData => ({
      ...prevData,
      [sectionKey]: {
        ...prevData[sectionKey],
        suggestions: prevData[sectionKey].suggestions.map(suggestion =>
          suggestion.id === suggestionId
            ? { ...suggestion, completed: !suggestion.completed }
            : suggestion
        )
      }
    }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return "text-green-600";
    if (score >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 4) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (score >= 3) return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    return <XCircle className="w-4 h-4 text-red-600" />;
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

  const getCompletedCount = (suggestions: ChecklistSuggestion[]) => {
    return suggestions.filter(suggestion => suggestion.completed).length;
  };

  const getProgressPercentage = (suggestions: ChecklistSuggestion[]) => {
    if (suggestions.length === 0) return 0;
    return (getCompletedCount(suggestions) / suggestions.length) * 100;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold text-foreground">Action Items</h3>
        <Badge variant="secondary" className="text-xs">
          Track your progress
        </Badge>
      </div>

      {Object.entries(data).map(([sectionKey, section]) => (
        <Card key={sectionKey} className="p-4 transition-all duration-200 hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getSectionIcon(sectionKey)}
              <h4 className="font-medium text-foreground">{getSectionTitle(sectionKey)}</h4>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {getScoreIcon(section.score)}
                <span className={`text-sm font-medium ${getScoreColor(section.score)}`}>
                  Score: {section.score}/5
                </span>
              </div>
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
                <label
                  htmlFor={suggestion.id}
                  className={`flex-1 cursor-pointer select-none transition-all duration-200 ${
                    suggestion.completed
                      ? "text-foreground/60 line-through"
                      : "text-foreground"
                  }`}
                >
                  {suggestion.text}
                </label>
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

// Mock data for testing
export const mockChecklistData: ChecklistData = {
  marketPotential: {
    score: 3,
    suggestions: [
      { id: 'mkt-1', text: 'Estimate your TAM using industry benchmarks', completed: false },
      { id: 'mkt-2', text: 'Validate interest with a short landing page MVP', completed: false },
      { id: 'mkt-3', text: 'Conduct 10 customer interviews', completed: false }
    ]
  },
  monetizationClarity: {
    score: 2,
    suggestions: [
      { id: 'mon-1', text: 'Define 2–3 pricing tiers', completed: true },
      { id: 'mon-2', text: 'Research competitor pricing models', completed: false },
      { id: 'mon-3', text: 'Create a revenue projection model', completed: false }
    ]
  },
  executionDifficulty: {
    score: 4,
    suggestions: [
      { id: 'exec-1', text: 'Outline the core features in a v1 product', completed: false },
      { id: 'exec-2', text: 'Identify technical requirements and stack', completed: false }
    ]
  }
}; 