"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";

import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { getLetterGrade } from "@/lib/gradingScale";
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
  XCircle,
  Globe,
  Lock
} from "lucide-react";
import { IdeaChecklist } from "./IdeaChecklist";
import { calculateDynamicScores } from "@/lib/scoring";

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
  public?: boolean;
  summary_analysis?: string; // AI Analysis summary
  // New structured fields from backend
  similar_products?: Array<{
    name: string;
    description: string;
    url?: string;
  }>;
  monetization_models?: string[];
  gtm_channels?: string[];
  score_explanations?: {
    market_potential: string;
    competition: string;
    monetization: string;
    execution: string;
  };
}

interface IdeaDetailModalProps {
  idea: Idea | null;
  isOpen: boolean;
  onClose: () => void;
  onScoreUpdate?: (scores: {
    market_potential: number;
    monetization: number;
    execution: number;
    overall_score: number;
  }) => void; // Callback to refresh dashboard with specific scores
}

export function IdeaDetailModal({ idea, isOpen, onClose, onScoreUpdate }: IdeaDetailModalProps) {
  const { user } = useAuth();
  const [dynamicScores, setDynamicScores] = useState<{
    market_potential: number;
    monetization: number;
    execution: number;
    overall_score: number;
    letter_grade: string;
  } | null>(null);
  const [isPublic, setIsPublic] = useState(idea?.public || false);
  const [isToggling, setIsToggling] = useState(false);

  // Update isPublic when idea changes
  useEffect(() => {
    setIsPublic(idea?.public || false);
  }, [idea?.public]);

  // Reset dynamicScores when idea changes
  useEffect(() => {
    setDynamicScores(null);
  }, [idea?.id]);



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
        return "text-green-600";
      case "Needs Work":
        return "text-yellow-600";
      case "Not Recommended":
        return "text-red-600";
      default:
        return "text-foreground-muted";
    }
  };

  const handlePublicToggle = async (checked: boolean) => {
    if (!user) return;
    
    setIsToggling(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/toggle-idea-public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ideaId: idea.id,
          idToken,
          public: checked
        }),
      });

      if (response.ok) {
        setIsPublic(checked);
      } else {
        console.error('Failed to toggle public status');
      }
    } catch (error) {
      console.error('Error toggling public status:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleScoreUpdate = async (scores: {
    market_potential: number;
    monetization: number;
    execution: number;
    overall_score: number;
    letter_grade: string;
  }) => {
    setDynamicScores(scores);
    
    // Persist updated scores to Firestore
    try {
      if (user && idea) {
        const idToken = await user.getIdToken();
        const response = await fetch('/api/update-idea-scores', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ideaId: idea.id,
            idToken,
            scores: {
              market_potential: scores.market_potential,
              monetization: scores.monetization,
              execution: scores.execution,
              overall_score: scores.overall_score,
              letter_grade: scores.letter_grade
            }
          }),
        });

        if (!response.ok) {
          console.error('Failed to persist score updates to Firestore');
        }
      }
    } catch (error) {
      console.error('Error persisting score updates:', error);
    }
    
    // Notify parent component with specific scores
    if (onScoreUpdate) {
      onScoreUpdate({
        market_potential: scores.market_potential,
        monetization: scores.monetization,
        execution: scores.execution,
        overall_score: scores.overall_score
      });
    }
  };

  // Get base score from idea data
  const baseScore = (idea as any)?.baseScore || idea.analysis.overall_score;

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

          {/* AI Analysis */}
          {idea.summary_analysis && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">AI Analysis</h3>
              <Card className="p-4 bg-surface">
                <p className="text-foreground-muted leading-relaxed">{idea.summary_analysis}</p>
              </Card>
            </div>
          )}

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

          {/* Public Toggle */}
          {user && (
            <div className="flex items-center justify-between p-3 bg-surface-elevated rounded-lg border border-border">
              <div className="flex items-center gap-3">
                {isPublic ? (
                  <Globe className="w-4 h-4 text-brand" />
                ) : (
                  <Lock className="w-4 h-4 text-foreground-muted" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Make this idea public?
                  </p>
                  <p className="text-xs text-foreground-muted">
                    {isPublic ? 'This idea is visible to other users' : 'This idea is private'}
                  </p>
                </div>
              </div>
              <Switch
                checked={isPublic}
                onCheckedChange={handlePublicToggle}
                disabled={isToggling}
              />
            </div>
          )}

          {/* Overall Recommendation */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Recommendation</h3>
            <div className="space-y-3">
              <p className={`text-lg font-medium ${getRecommendationColor(idea.analysis.recommendation)}`}>
                {idea.analysis.recommendation}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground-muted">Overall Score:</span>
                <span className={`text-lg font-bold transition-all duration-300 ${
                  dynamicScores ? getScoreColor(dynamicScores.overall_score) : getScoreColor(idea.analysis.overall_score)
                }`}>
                  {dynamicScores ? dynamicScores.overall_score : idea.analysis.overall_score}%
                </span>
                {(() => {
                  if (dynamicScores) {
                    // Use the letter_grade from dynamicScores
                    const { letter, color } = getLetterGrade(dynamicScores.overall_score);
                    return (
                      <span className={`text-lg font-bold transition-all duration-300 ${
                        color === 'green' ? 'text-green-600' :
                        color === 'lime' ? 'text-lime-600' :
                        color === 'yellow' ? 'text-yellow-600' :
                        color === 'orange' ? 'text-orange-600' :
                        color === 'red' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {letter}
                      </span>
                    );
                  } else {
                    // Use original idea analysis for letter grade
                    const { letter, color } = getLetterGrade(idea.analysis.overall_score);
                    return (
                      <span className={`text-lg font-bold transition-all duration-300 ${
                        color === 'green' ? 'text-green-600' :
                        color === 'lime' ? 'text-lime-600' :
                        color === 'yellow' ? 'text-yellow-600' :
                        color === 'orange' ? 'text-orange-600' :
                        color === 'red' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {letter}
                      </span>
                    );
                  }
                })()}
                {/* Show base score indicator if different from current score */}
                {dynamicScores && dynamicScores.overall_score > baseScore && (
                  <span className="text-xs text-green-600 font-medium">
                    ↑ from {baseScore}%
                  </span>
                )}
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
                  <span className={`text-2xl font-bold transition-all duration-300 ${
                    dynamicScores ? getScoreColor(dynamicScores.market_potential) : getScoreColor(idea.analysis.market_potential)
                  }`}>
                    {dynamicScores ? dynamicScores.market_potential : idea.analysis.market_potential}%
                  </span>
                  {getScoreIcon(dynamicScores ? dynamicScores.market_potential : idea.analysis.market_potential)}
                </div>
                <div className="mt-2 h-2 bg-surface-elevated rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      (dynamicScores ? dynamicScores.market_potential : idea.analysis.market_potential) >= 80 ? 'bg-green-500' :
                      (dynamicScores ? dynamicScores.market_potential : idea.analysis.market_potential) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${dynamicScores ? dynamicScores.market_potential : idea.analysis.market_potential}%` }}
                  />
                </div>
                {idea.score_explanations?.market_potential && (
                  <p className="text-xs text-foreground-muted mt-2 leading-relaxed">
                    {idea.score_explanations.market_potential}
                  </p>
                )}
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Target className="w-5 h-5 text-purple-600" />
                  <h4 className="font-medium text-foreground">Competition</h4>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold transition-all duration-300 ${
                    dynamicScores ? getScoreColor(dynamicScores.market_potential) : getScoreColor(idea.analysis.competition)
                  }`}>
                    {dynamicScores ? dynamicScores.market_potential : idea.analysis.competition}%
                  </span>
                  {getScoreIcon(dynamicScores ? dynamicScores.market_potential : idea.analysis.competition)}
                </div>
                <div className="mt-2 h-2 bg-surface-elevated rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      (dynamicScores ? dynamicScores.market_potential : idea.analysis.competition) >= 80 ? 'bg-green-500' :
                      (dynamicScores ? dynamicScores.market_potential : idea.analysis.competition) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${dynamicScores ? dynamicScores.market_potential : idea.analysis.competition}%` }}
                  />
                </div>
                {idea.score_explanations?.competition && (
                  <p className="text-xs text-foreground-muted mt-2 leading-relaxed">
                    {idea.score_explanations.competition}
                  </p>
                )}
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-foreground">Monetization</h4>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold transition-all duration-300 ${
                    dynamicScores ? getScoreColor(dynamicScores.monetization) : getScoreColor(idea.analysis.monetization)
                  }`}>
                    {dynamicScores ? dynamicScores.monetization : idea.analysis.monetization}%
                  </span>
                  {getScoreIcon(dynamicScores ? dynamicScores.monetization : idea.analysis.monetization)}
                </div>
                <div className="mt-2 h-2 bg-surface-elevated rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      (dynamicScores ? dynamicScores.monetization : idea.analysis.monetization) >= 80 ? 'bg-green-500' :
                      (dynamicScores ? dynamicScores.monetization : idea.analysis.monetization) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${dynamicScores ? dynamicScores.monetization : idea.analysis.monetization}%` }}
                  />
                </div>
                {idea.score_explanations?.monetization && (
                  <p className="text-xs text-foreground-muted mt-2 leading-relaxed">
                    {idea.score_explanations.monetization}
                  </p>
                )}
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="w-5 h-5 text-orange-600" />
                  <h4 className="font-medium text-foreground">Execution</h4>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold transition-all duration-300 ${
                    dynamicScores ? getScoreColor(dynamicScores.execution) : getScoreColor(idea.analysis.execution)
                  }`}>
                    {dynamicScores ? dynamicScores.execution : idea.analysis.execution}%
                  </span>
                  {getScoreIcon(dynamicScores ? dynamicScores.execution : idea.analysis.execution)}
                </div>
                <div className="mt-2 h-2 bg-surface-elevated rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      (dynamicScores ? dynamicScores.execution : idea.analysis.execution) >= 80 ? 'bg-green-500' :
                      (dynamicScores ? dynamicScores.execution : idea.analysis.execution) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${dynamicScores ? dynamicScores.execution : idea.analysis.execution}%` }}
                  />
                </div>
                {idea.score_explanations?.execution && (
                  <p className="text-xs text-foreground-muted mt-2 leading-relaxed">
                    {idea.score_explanations.execution}
                  </p>
                )}
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

          {/* Similar Products */}
          {idea.similar_products && idea.similar_products.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">Similar Products</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {idea.similar_products.map((product, index) => (
                  <Card key={index} className="p-4 hover:border-brand/30 transition-colors">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{product.name}</h4>
                          <p className="text-sm text-foreground-muted mt-1">{product.description}</p>
                        </div>
                        {product.url && (
                          <a
                            href={product.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0"
                          >
                            <Globe className="w-4 h-4 text-foreground-muted hover:text-brand transition-colors" />
                          </a>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Strategy Section */}
          {(idea.monetization_models || idea.gtm_channels) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Strategy</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Monetization Models */}
                {idea.monetization_models && idea.monetization_models.length > 0 && (
                  <Card className="p-4">
                    <h4 className="font-medium text-foreground mb-3">Monetization Models</h4>
                    <div className="flex flex-wrap gap-2">
                      {idea.monetization_models.map((model, index) => (
                        <Badge key={index} variant="secondary" className="bg-brand/10 text-brand border-brand/20">
                          {model}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}

                {/* GTM Channels */}
                {idea.gtm_channels && idea.gtm_channels.length > 0 && (
                  <Card className="p-4">
                    <h4 className="font-medium text-foreground mb-3">Go-To-Market Channels</h4>
                    <div className="flex flex-wrap gap-2">
                      {idea.gtm_channels.map((channel, index) => (
                        <Badge key={index} variant="secondary" className="bg-surface-elevated">
                          {channel}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Action Items Checklist */}
          <div className="space-y-3">
            <IdeaChecklist ideaId={idea.id} baseScore={baseScore} onScoreUpdate={handleScoreUpdate} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 