import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Zap, 
  Target,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ExternalLink
} from "lucide-react";

interface ResultsSectionProps {
  idea: string;
}

export const ResultsSection = ({ idea: _idea }: ResultsSectionProps) => {
  const [animateScores, setAnimateScores] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateScores(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Mock data - would come from API in real app
  const analysis = {
    recommendation: "Worth Building",
    recommendationColor: "success" as "success" | "warning" | "danger",
    summary: "Your AI tool for digital nomads addresses a growing market with clear monetization paths. The remote work trend provides strong tailwinds, though competition is emerging.",
    similarProducts: [
      { name: "Nomad List", logo: "🌍" },
      { name: "Remote Year", logo: "✈️" },
      { name: "WiFi Tribe", logo: "📶" },
      { name: "Hacker Paradise", logo: "💻" }
    ],
    monetization: ["Subscription", "Marketplace", "Premium Features"],
    gtmChannels: ["Content Marketing", "Community", "Partnerships"],
    scores: [
      {
        id: "market",
        label: "Market Potential",
        score: 85,
        icon: TrendingUp,
        color: "success" as const,
        justification: "Large and growing remote work market with 50M+ digital nomads globally"
      },
      {
        id: "competition",
        label: "Competitive Advantage",
        score: 72,
        icon: Target,
        color: "brand" as const,
        justification: "Some existing players but room for differentiation with AI features"
      },
      {
        id: "monetization",
        label: "Monetization Clarity",
        score: 90,
        icon: DollarSign,
        color: "success" as const,
        justification: "Multiple clear revenue streams with proven willingness to pay"
      },
      {
        id: "execution",
        label: "Execution Difficulty",
        score: 68,
        icon: Zap,
        color: "warning" as const,
        justification: "Moderate technical complexity but requires community building"
      },
      {
        id: "growth",
        label: "Growth Potential",
        score: 88,
        icon: Users,
        color: "success" as const,
        justification: "Strong network effects and viral potential in nomad community"
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
                  <div className="grid grid-cols-2 gap-3">
                    {analysis.similarProducts.map((product) => (
                      <div
                        key={product.name}
                        className="flex items-center gap-3 p-3 bg-surface border border-border rounded-lg hover:border-brand/30 transition-colors group cursor-pointer"
                      >
                        <div className="text-2xl">{product.logo}</div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{product.name}</div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-foreground-subtle group-hover:text-brand transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strategy Pills */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Monetization</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.monetization.map((model) => (
                        <Badge key={model} variant="secondary" className="bg-brand/10 text-brand border-brand/20">
                          {model}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">GTM Channels</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.gtmChannels.map((channel) => (
                        <Badge key={channel} variant="secondary" className="bg-surface-elevated">
                          {channel}
                        </Badge>
                      ))}
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
                    <div className="text-3xl font-bold text-gradient">
                      {animateScores ? Math.round(analysis.scores.reduce((sum, s) => sum + s.score, 0) / analysis.scores.length) : 0}
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