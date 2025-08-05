"use client";

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Calendar, 
  Coins, 
  TrendingUp, 
  Target, 
  DollarSign, 
  Zap,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react";
import { IdeaChecklist } from "./IdeaChecklist";

interface Idea {
  id: string;
  ideaText: string;
  analysis: {
    overall_score: number;
    market_potential: number;
    competition: number;
    monetization: number;
    execution: number;
    recommendation: string;
    insights: string[];
  };
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  tokensUsed: number;
}

interface IdeaDetailModalProps {
  idea: Idea | null;
  isOpen: boolean;
  onClose: () => void;
}

export function IdeaDetailModal({ idea, isOpen, onClose }: IdeaDetailModalProps) {
  if (!idea) return null;

  const formatDate = (timestamp: { seconds: number; nanoseconds: number }) => {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 60) return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case "Worth Building":
        return "bg-green-100 text-green-800 border-green-200";
      case "Needs Work":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Not Recommended":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            Idea Analysis Details
          </DialogTitle>
          <DialogDescription className="text-foreground-muted">
            Detailed breakdown of your idea evaluation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Idea Text */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Your Idea</h3>
            <Card className="p-4 bg-surface">
              <p className="text-foreground leading-relaxed">{idea.ideaText}</p>
            </Card>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-4 text-sm text-foreground-muted">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {formatDate(idea.createdAt)}
            </div>
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4" />
              {idea.tokensUsed} token{idea.tokensUsed !== 1 ? 's' : ''} used
            </div>
          </div>

          {/* Overall Recommendation */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Recommendation</h3>
            <div className="flex items-center gap-3">
              <Badge 
                variant="outline" 
                className={`text-sm font-medium px-3 py-1 ${getRecommendationColor(idea.analysis.recommendation)}`}
              >
                {idea.analysis.recommendation}
              </Badge>
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground-muted">Overall Score:</span>
                <span className={`text-lg font-bold ${getScoreColor(idea.analysis.overall_score)}`}>
                  {idea.analysis.overall_score}%
                </span>
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Score Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-foreground">Market Potential</h4>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${getScoreColor(idea.analysis.market_potential)}`}>
                    {idea.analysis.market_potential}%
                  </span>
                  {getScoreIcon(idea.analysis.market_potential)}
                </div>
                <div className="mt-2 h-2 bg-surface-elevated rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      idea.analysis.market_potential >= 80 ? 'bg-green-500' :
                      idea.analysis.market_potential >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${idea.analysis.market_potential}%` }}
                  />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Target className="w-5 h-5 text-purple-600" />
                  <h4 className="font-medium text-foreground">Competition</h4>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${getScoreColor(idea.analysis.competition)}`}>
                    {idea.analysis.competition}%
                  </span>
                  {getScoreIcon(idea.analysis.competition)}
                </div>
                <div className="mt-2 h-2 bg-surface-elevated rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      idea.analysis.competition >= 80 ? 'bg-green-500' :
                      idea.analysis.competition >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${idea.analysis.competition}%` }}
                  />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-foreground">Monetization</h4>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${getScoreColor(idea.analysis.monetization)}`}>
                    {idea.analysis.monetization}%
                  </span>
                  {getScoreIcon(idea.analysis.monetization)}
                </div>
                <div className="mt-2 h-2 bg-surface-elevated rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      idea.analysis.monetization >= 80 ? 'bg-green-500' :
                      idea.analysis.monetization >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${idea.analysis.monetization}%` }}
                  />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="w-5 h-5 text-orange-600" />
                  <h4 className="font-medium text-foreground">Execution</h4>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${getScoreColor(idea.analysis.execution)}`}>
                    {idea.analysis.execution}%
                  </span>
                  {getScoreIcon(idea.analysis.execution)}
                </div>
                <div className="mt-2 h-2 bg-surface-elevated rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      idea.analysis.execution >= 80 ? 'bg-green-500' :
                      idea.analysis.execution >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${idea.analysis.execution}%` }}
                  />
                </div>
              </Card>
            </div>
          </div>

          {/* Key Insights */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-brand" />
              <h3 className="text-lg font-semibold text-foreground">Key Insights</h3>
            </div>
            <Card className="p-4">
              <ul className="space-y-3">
                {idea.analysis.insights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-brand rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-foreground leading-relaxed">{insight}</p>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Action Items Checklist */}
          <div className="space-y-3">
            <IdeaChecklist ideaId={idea.id} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 