"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { getLetterGrade } from "@/lib/gradingScale";
import { useAuth } from "@/context/AuthContext";
import Reveal from "@/components/ui/Reveal";
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
  Sparkles,
  Search
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

  const getScoreColorClass = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-brand";
    if (score >= 40) return "text-warning";
    return "text-danger";
  };

  const getMetricIconBgColor = (color: "success" | "brand" | "warning" | "danger") => {
    switch (color) {
      case "success": return "bg-success/20";
      case "brand": return "bg-brand/20";
      case "warning": return "bg-warning/20";
      case "danger": return "bg-danger/20";
      default: return "bg-gray-200";
    }
  };

  const getMetricIconColor = (color: "success" | "brand" | "warning" | "danger") => {
    switch (color) {
      case "success": return "text-success";
      case "brand": return "text-brand";
      case "warning": return "text-warning";
      case "danger": return "text-danger";
      default: return "text-gray-600";
    }
  };

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <Reveal>
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Your Idea Analysis
            </h1>
            <p className="text-lg text-foreground-muted max-w-2xl mx-auto">
              {analysis.summary}
            </p>
          </div>
        </Reveal>

        {/* Overall Score */}
        <Reveal delay={0.06}>
          <Card className="card-glow p-8 mb-8 text-center">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                {getRecommendationIcon()}
                <h2 className="text-2xl font-bold text-foreground">
                  {analysis.recommendation}
                </h2>
              </div>
              <div className="text-6xl font-bold">
                <span className={getScoreColorClass(analysisData.overall_score)}>
                  {getLetterGrade(analysisData.overall_score).letter}
                </span>
              </div>
              <div className="text-2xl font-semibold text-foreground-muted">
                {analysisData.overall_score}%
              </div>
            </div>
          </Card>
        </Reveal>

        {/* Score Breakdown */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: "Market Potential", score: analysisData.market_potential, icon: TrendingUp, color: "success" as const },
            { label: "Competition", score: analysisData.competition, icon: Users, color: "brand" as const },
            { label: "Monetization", score: analysisData.monetization, icon: DollarSign, color: "success" as const },
            { label: "Execution", score: analysisData.execution, icon: Zap, color: "warning" as const }
          ].map((metric, index) => (
            <Reveal key={metric.label} delay={0.12 + (index * 0.06)}>
              <Card className="card-elevated p-6 text-center">
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className={`p-3 rounded-lg ${getMetricIconBgColor(metric.color)}`}>
                      <metric.icon size={24} strokeWidth={2} aria-hidden="true" className={getMetricIconColor(metric.color)} />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {metric.label}
                  </h3>
                  <div className="text-3xl font-bold">
                    <span className={getScoreColorClass(metric.score)}>
                      {metric.score}%
                    </span>
                  </div>
                  <Progress value={metric.score} className="h-2" />
                </div>
              </Card>
            </Reveal>
          ))}
        </div>

        {/* Key Insights */}
        <Reveal delay={0.24}>
          <Card className="card-elevated p-8 mb-12">
            <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-brand" />
              Key Insights
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {analysisData.insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle size={16} strokeWidth={2} aria-hidden="true" className="text-success mt-1 flex-shrink-0" />
                  <span className="text-foreground-muted">{insight}</span>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>

        {/* Similar Products */}
        <Reveal delay={0.3}>
          <Card className="card-elevated p-8 mb-12">
            <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <Search className="w-5 h-5 text-brand" />
              Similar Products
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {analysis.similarProducts.map((product, index) => (
                <div key={index} className="text-center p-4 bg-surface rounded-lg border border-border">
                  <div className="text-2xl mb-2">{product.logo}</div>
                  <h4 className="font-semibold text-foreground mb-1">{product.name}</h4>
                  <p className="text-sm text-foreground-muted">{product.description}</p>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>

        {/* Monetization & GTM */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Reveal delay={0.36}>
            <Card className="card-elevated p-8">
              <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-success" />
                Monetization Models
              </h3>
              <div className="space-y-3">
                {analysis.monetization.map((model, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-success rounded-full" />
                    <span className="text-foreground-muted">{model}</span>
                  </div>
                ))}
              </div>
            </Card>
          </Reveal>

          <Reveal delay={0.42}>
            <Card className="card-elevated p-8">
              <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand" />
                Go-to-Market Channels
              </h3>
              <div className="space-y-3">
                {analysis.gtmChannels.map((channel, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-brand rounded-full" />
                    <span className="text-foreground-muted">{channel}</span>
                  </div>
                ))}
              </div>
            </Card>
          </Reveal>
        </div>

        {/* Action Buttons */}
        <Reveal delay={0.48}>
          <div className="text-center space-y-4">
            {user && (
              <Button 
                onClick={() => window.location.href = '/dashboard'}
                className="btn-primary text-lg px-8 py-4"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                View Full Report
              </Button>
            )}
            <div className="text-sm text-foreground-muted">
              Your analysis has been saved to your dashboard
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};