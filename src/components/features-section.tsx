import { Card } from "@/components/ui/card";
import { 
  Clock, 
  BarChart3, 
  Search, 
  TrendingUp, 
  Rocket 
} from "lucide-react";

export const FeaturesSection = () => {
  const features = [
    {
      icon: Clock,
      title: "Validate in 60 Seconds",
      description: "Avoid weeks of guesswork. Enter your idea and get instant, founder-grade feedback across market size, competition, monetization, and execution.",
      color: "brand"
    },
    {
      icon: BarChart3,
      title: "5-Part Scorecard, No Fluff",
      description: "Understand your idea's strengths and risks. Each scan breaks down into clear, justified scores—with no jargon or generic advice.",
      color: "success"
    },
    {
      icon: Search,
      title: "Real Competitor Insights",
      description: "See what's already out there. We show similar products, highlight your differentiation, and reveal whitespace in the market.",
      color: "warning"
    },
    {
      icon: TrendingUp,
      title: "Monetization + GTM Guidance",
      description: "We don't just grade you—we guide you. Get tailored monetization models and go-to-market channels that match your concept.",
      color: "brand"
    },
    {
      icon: Rocket,
      title: "Instant MVP Plan (Optional Upgrade)",
      description: "Ready to build? Generate a complete feature roadmap, tech stack suggestion, and execution plan in one click.",
      color: "success"
    }
  ];

  const getIconColor = (color: string) => {
    switch (color) {
      case "brand": return "text-brand";
      case "success": return "text-success";
      case "warning": return "text-warning";
      default: return "text-brand";
    }
  };

  const getIconBgColor = (color: string) => {
    switch (color) {
      case "brand": return "bg-brand/20";
      case "success": return "bg-success/20";
      case "warning": return "bg-warning/20";
      default: return "bg-brand/20";
    }
  };

  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            AI Business Idea Scoring
          </h2>
          <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-4">
            Founder-Grade Startup Validation Reports
          </h3>
          <p className="text-lg text-foreground-muted max-w-2xl mx-auto">
            How GradeIdea helps you decide what's worth building
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 min-h-[600px]">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            
            return (
              <Card 
                key={feature.title}
                className="card-elevated p-8 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="space-y-6">
                  {/* Icon */}
                  <div className={`inline-flex p-3 rounded-lg ${getIconBgColor(feature.color)}`}>
                    <Icon size={24} strokeWidth={2} aria-hidden="true" className={getIconColor(feature.color)} />
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-foreground group-hover:text-brand transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-foreground-muted leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}; 