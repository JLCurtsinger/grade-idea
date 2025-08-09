"use client";

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Target, 
  DollarSign, 
  Zap,
  X,
  Lightbulb
} from "lucide-react";
import { getLetterGrade } from "@/lib/gradingScale";

interface PublicIdea {
  id: string;
  ideaText: string;
  baseScores: {
    market: number;
    differentiation: number;
    monetization: number;
    execution: number;
    growth: number;
    overall: number;
  };
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  recommendation?: string | null;
}

interface TopIdeaModalProps {
  idea: PublicIdea | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TopIdeaModal({ idea, isOpen, onClose }: TopIdeaModalProps) {
  if (!idea) return null;

  const formatDate = (timestamp: { seconds: number; nanoseconds: number }) => {
    if (!timestamp || !timestamp.seconds) {
      return "Unknown Date";
    }
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const generateIdeaSummary = (ideaText: string, recommendation?: string | null) => {
    // Use the actual AI recommendation if available
    if (recommendation) {
      return recommendation;
    }
    
    // Fallback to generic summary if no recommendation available
    const words = ideaText.toLowerCase().split(' ');
    const keyTerms = words.filter(word => 
      ['saas', 'app', 'platform', 'service', 'tool', 'system', 'solution'].includes(word)
    );
    
    if (keyTerms.length > 0) {
      return `This idea proposes a ${keyTerms[0]} solution that addresses a specific market need.`;
    }
    
    return "This idea presents an innovative solution to address market opportunities.";
  };

  const generateEvaluationSummary = (scores: PublicIdea['baseScores']) => {
    const { letter } = getLetterGrade(scores.overall);
    
    return `The AI evaluation gave this idea an overall grade of ${letter} (${scores.overall}%). The idea shows ${scores.market >= 70 ? 'strong' : scores.market >= 50 ? 'moderate' : 'limited'} market potential, ${scores.monetization >= 70 ? 'clear' : scores.monetization >= 50 ? 'some' : 'unclear'} monetization pathways, ${scores.differentiation >= 70 ? 'strong' : scores.differentiation >= 50 ? 'moderate' : 'limited'} competitive positioning, and ${scores.execution >= 70 ? 'feasible' : scores.execution >= 50 ? 'moderately complex' : 'challenging'} execution requirements.`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-auto px-4">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Lightbulb className="w-6 h-6 text-brand" />
            <DialogTitle className="text-xl font-bold text-foreground">
              Top-Rated Idea Analysis
            </DialogTitle>
          </div>
          <DialogDescription className="text-foreground-muted">
            Detailed evaluation of this public startup idea
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Original Idea */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Original Idea</h3>
            <Card className="p-4 bg-surface">
              <p className="text-foreground leading-relaxed">{idea.ideaText}</p>
            </Card>
          </div>

          {/* Idea Summary */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Summary</h3>
            <p className="text-foreground-muted leading-relaxed">
              {generateIdeaSummary(idea.ideaText, idea.recommendation)}
            </p>
          </div>

          {/* AI Evaluation Summary */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">AI Evaluation</h3>
            <p className="text-foreground-muted leading-relaxed">
              {generateEvaluationSummary(idea.baseScores)}
            </p>
          </div>

          {/* Score Breakdown */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Score Breakdown</h3>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-foreground">Market Potential</h4>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${getScoreColor(idea.baseScores.market)}`}>
                    {idea.baseScores.market}%
                  </span>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Target className="w-5 h-5 text-[#95FC0F]" />
                  <h4 className="font-medium text-foreground">Competition</h4>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${getScoreColor(idea.baseScores.differentiation)}`}>
                    {idea.baseScores.differentiation}%
                  </span>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-foreground">Monetization</h4>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${getScoreColor(idea.baseScores.monetization)}`}>
                    {idea.baseScores.monetization}%
                  </span>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="w-5 h-5 text-orange-600" />
                  <h4 className="font-medium text-foreground">Execution</h4>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${getScoreColor(idea.baseScores.execution)}`}>
                    {idea.baseScores.execution}%
                  </span>
                </div>
              </Card>
            </div>
          </div>

          {/* Overall Grade */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Overall Grade</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-foreground">
                  {idea.baseScores.overall}%
                </span>
                {(() => {
                  const { letter, color } = getLetterGrade(idea.baseScores.overall);
                  return (
                    <Badge 
                      variant="outline" 
                      className={`text-lg font-medium px-3 py-1 ${
                        color === 'green' ? 'text-green-600 border-green-200' :
                        color === 'lime' ? 'text-lime-600 border-lime-200' :
                        color === 'yellow' ? 'text-yellow-600 border-yellow-200' :
                        color === 'orange' ? 'text-orange-600 border-orange-200' :
                        color === 'red' ? 'text-red-600 border-red-200' :
                        'text-gray-600 border-gray-200'
                      }`}
                    >
                      {letter}
                    </Badge>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-foreground-muted">
              Submitted on {formatDate(idea.createdAt)}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 