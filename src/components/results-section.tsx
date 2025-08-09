"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { getLetterGrade } from "@/lib/gradingScale";
import { useAuth } from "@/context/AuthContext";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Zap, 
  Target,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Sparkles
} from "lucide-react";

interface ResultsSectionProps {
  idea: string;
  analysis?: {
    overall_score: number;
    market_potential: number;
    competition: number;
    monetization: number;
    execution: number;
    recommendation: string;
    insights: string[];
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
    // Custom fields
    custom?: {
      go_to_market_channels?: string[];
      monetization_models?: string[];
      target_user_archetype?: string;
      target_user_archetypes?: string[];
      key_insights?: string[];
      notes?: Record<string, string>;
      risk_mitigation_plans?: Array<{
        risk: string;
        mitigation: string;
      }>;
    };
  };
}

export const ResultsSection = ({ idea, analysis: apiAnalysis }: ResultsSectionProps) => {
  const [animateScores, setAnimateScores] = useState(false);
  const { user, openModal } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => setAnimateScores(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Use real analysis data if available, otherwise fall back to mock data
  const analysisData = apiAnalysis || {
    overall_score: 85,
    market_potential: 85,
    competition: 72,
    monetization: 90,
    execution: 68,
    recommendation: "Worth Building",
    insights: [
      'Market size appears substantial',
      'Competition is moderate',
      'Clear monetization path identified',
      'Execution complexity is manageable'
    ]
  };

  const analysis = {
    recommendation: analysisData.recommendation,
    recommendationColor: analysisData.recommendation === "Worth Building" ? "success" as "success" | "warning" | "danger" : "warning" as "success" | "warning" | "danger",
    summary: `Analysis of "${idea}": ${analysisData.insights.join('. ')}`,
    similarProducts: analysisData.similar_products || [
      { name: "Competitor A", description: "Example competitor", logo: "🏢" },
      { name: "Competitor B", description: "Example competitor", logo: "💼" },
      { name: "Competitor C", description: "Example competitor", logo: "📈" },
      { name: "Competitor D", description: "Example competitor", logo: "🎯" }
    ],
    monetization: analysisData.monetization_models || ["Subscription", "Marketplace", "Premium Features"],
    gtmChannels: analysisData.gtm_channels || ["Content Marketing", "Community", "Partnerships"],
    scores: [
      {
        id: "market",
        label: "Market Potential",
        score: analysisData.market_potential,
        icon: TrendingUp,
        color: "success" as const,
        justification: analysisData.score_explanations?.market_potential || analysisData.insights[0] || "Market analysis based on current trends"
      },
      {
        id: "competition",
        label: "Competitive Advantage",
        score: analysisData.competition,
        icon: Target,
        color: "brand" as const,
        justification: analysisData.score_explanations?.competition || analysisData.insights[1] || "Competitive landscape analysis"
      },
      {
        id: "monetization",
        label: "Monetization Clarity",
        score: analysisData.monetization,
        icon: DollarSign,
        color: "success" as const,
        justification: analysisData.score_explanations?.monetization || analysisData.insights[2] || "Revenue model assessment"
      },
      {
        id: "execution",
        label: "Execution Difficulty",
        score: analysisData.execution,
        icon: Zap,
        color: "warning" as const,
        justification: analysisData.score_explanations?.execution || analysisData.insights[3] || "Implementation complexity evaluation"
      },
      {
        id: "overall",
        label: "Overall Score",
        score: analysisData.overall_score,
        icon: Users,
        color: "success" as const,
        justification: "Comprehensive evaluation of all factors"
      }
    ]
  };

  const getRecommendationIcon = () => {
    switch (analysis.recommendationColor) {
      case "success": return <CheckCircle className="w-5 h-5" />;
      case "warning": return <AlertTriangle className="w-5 h-5" />;
      case "danger": return <XCircle className="w-5 h-5" />;
      default: return <CheckCircle className="w-5 h-5" />;
    }
  };

  const getScoreColor = (score: number): "success" | "brand" | "warning" | "danger" => {
    if (score >= 80) return "success";
    if (score >= 60) return "brand";
    if (score >= 40) return "warning";
    return "danger";
  };

  return (
    <section className="py-16">
      <div className="container mx-auto px-6">
        {/* Mock Data Banner for Non-Authenticated Users */}
        {!user && (
          <div className="mb-8">
            <Card className="bg-gradient-to-r from-blue-500/10 to-[#95FC0F]/10 border-blue-500/20">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                  <h3 className="text-lg font-semibold text-blue-600">Demo Mode</h3>
                </div>
                <p className="text-blue-700 mb-4">
                  This is mock data. Sign up to run a real AI-powered analysis.
                </p>
                <Button 
                  onClick={() => openModal('signup')}
                  className="btn-primary"
                >
                  Sign Up
                </Button>
              </div>
            </Card>
          </div>
        )}
        
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Panel - Strategic Insights */}
          <div className="space-y-6 animate-slide-up">
            <Card className="card-elevated p-8">
              <div className="space-y-6">
                {/* Recommendation */}
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full border font-semibold ${
                    analysis.recommendationColor === 'success' ? 'score-excellent' :
                    analysis.recommendationColor === 'warning' ? 'score-warning' : 'score-poor'
                  }`}>
                    {getRecommendationIcon()}
                    {analysis.recommendation}
                  </div>
                </div>

                {/* Summary */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">AI Analysis</h3>
                  <p className="text-foreground-muted leading-relaxed">
                    {analysis.summary}
                  </p>
                </div>

                {/* Similar Products */}
                <div>
                  <h4 className="font-semibold mb-3">Similar Products</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {analysis.similarProducts.map((product, index) => (
                      <div
                        key={product.name || index}
                        className="p-3 bg-surface border border-border rounded-lg hover:border-brand/30 transition-colors group cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="font-medium text-sm text-foreground mb-1">
                              {product.name}
                            </div>
                            <div className="text-xs text-foreground-muted leading-relaxed">
                              {product.description}
                            </div>
                          </div>
                          {product.url && (
                            <a
                              href={product.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0"
                            >
                              <ExternalLink className="w-4 h-4 text-foreground-subtle group-hover:text-brand transition-colors" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strategy Pills */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Monetization Models</h4>
                    <div className="flex flex-wrap gap-2">
                      {/* AI-generated models */}
                      {analysis.monetization.map((model) => (
                        <Badge key={model} variant="secondary" className="bg-brand/10 text-brand border-brand/20">
                          {model}
                        </Badge>
                      ))}
                      
                      {/* Custom models - only show for authenticated users */}
                      {user && analysisData.custom?.monetization_models && analysisData.custom.monetization_models.length > 0 && (
                        <>
                          {analysisData.custom.monetization_models.map((model) => (
                            <Badge key={`custom-${model}`} variant="secondary" className="bg-brand/10 text-brand border-brand/20">
                              {model}
                            </Badge>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Go-To-Market Channels</h4>
                    <div className="flex flex-wrap gap-2">
                      {/* AI-generated channels */}
                      {analysis.gtmChannels.map((channel) => (
                        <Badge key={channel} variant="secondary" className="bg-surface-elevated">
                          {channel}
                        </Badge>
                      ))}
                      
                      {/* Custom channels - only show for authenticated users */}
                      {user && analysisData.custom?.go_to_market_channels && analysisData.custom.go_to_market_channels.length > 0 && (
                        <>
                          {analysisData.custom.go_to_market_channels.map((channel) => (
                            <Badge key={`custom-${channel}`} variant="secondary" className="bg-brand/10 text-brand border-brand/20">
                              {channel}
                            </Badge>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Panel - Animated Scorecard */}
          <div className="space-y-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Card className="card-elevated p-8">
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Validation Scorecard</h3>
                
                <div className="space-y-6">
                  {analysis.scores.map((metric, index) => {
                    const Icon = metric.icon;
                    const colorClass = getScoreColor(metric.score);
                    
                    return (
                      <div 
                        key={metric.id} 
                        className="space-y-3"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              colorClass === 'success' ? 'bg-success/20 text-success' :
                              colorClass === 'brand' ? 'bg-brand/20 text-brand' :
                              colorClass === 'warning' ? 'bg-warning/20 text-warning' :
                              'bg-danger/20 text-danger'
                            }`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="font-medium">{metric.label}</span>
                          </div>
                          <span className="text-2xl font-bold">
                            {animateScores ? metric.score : 0}
                          </span>
                        </div>
                        
                        <Progress 
                          value={animateScores ? metric.score : 0} 
                          className="h-3"
                        />
                        
                        <p className="text-sm text-foreground-muted">
                          {metric.justification}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Overall Score */}
                <div className="pt-6 border-t border-border">
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-3">
                      <div className="text-3xl font-bold text-gradient">
                        {animateScores ? Math.round(analysis.scores.reduce((sum, s) => sum + s.score, 0) / analysis.scores.length) : 0}
                      </div>
                      {animateScores && (() => {
                        const overallScore = Math.round(analysis.scores.reduce((sum, s) => sum + s.score, 0) / analysis.scores.length);
                        const { letter, color } = getLetterGrade(overallScore);
                        return (
                          <div className={`text-2xl font-bold ${
                            color === 'green' ? 'text-green-600' :
                            color === 'lime' ? 'text-lime-600' :
                            color === 'yellow' ? 'text-yellow-600' :
                            color === 'orange' ? 'text-orange-600' :
                            color === 'red' ? 'text-red-600' :
                            'text-gray-600'
                          }`}>
                            {letter}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="text-sm text-foreground-muted">Overall Validation Score</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};