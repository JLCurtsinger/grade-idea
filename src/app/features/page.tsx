import { Metadata } from 'next';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Target, 
  DollarSign, 
  Zap,
  Lightbulb,
  CheckCircle,
  BarChart3,
  Users,
  Shield,
  Clock
} from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Features – AI-Powered Startup Idea Validation | GradeIdea.cc',
    description: 'Discover how GradeIdea.cc uses AI to validate startup ideas. Get instant scores for market potential, monetization clarity, competitive differentiation, and growth potential.',
    alternates: { canonical: 'https://gradeidea.cc/features' },
  };
}

export default function FeaturesPage() {
  const features = [
    {
      icon: <TrendingUp className="w-8 h-8 text-blue-600" />,
      title: "AI-Powered Analysis",
      description: "Advanced machine learning algorithms analyze your startup idea across multiple dimensions in seconds.",
      benefits: ["Instant scoring", "Comprehensive evaluation", "Data-driven insights"]
    },
    {
      icon: <Target className="w-8 h-8 text-green-600" />,
      title: "Market Potential Scoring",
      description: "Evaluate market size, demand, and growth potential with industry-specific metrics.",
      benefits: ["Market size analysis", "Demand validation", "Growth trajectory"]
    },
    {
      icon: <DollarSign className="w-8 h-8 text-yellow-600" />,
      title: "Monetization Clarity",
      description: "Identify revenue streams and pricing strategies that maximize your idea's profitability.",
      benefits: ["Revenue model analysis", "Pricing strategy", "Profitability assessment"]
    },
    {
      icon: <Zap className="w-8 h-8 text-purple-600" />,
      title: "Competitive Differentiation",
      description: "Understand your competitive landscape and identify unique positioning opportunities.",
      benefits: ["Competitor analysis", "Differentiation strategy", "Market positioning"]
    },
    {
      icon: <Lightbulb className="w-8 h-8 text-orange-600" />,
      title: "Execution Feasibility",
      description: "Assess technical complexity, resource requirements, and implementation challenges.",
      benefits: ["Technical assessment", "Resource planning", "Risk evaluation"]
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-red-600" />,
      title: "Growth Potential",
      description: "Project scalability and expansion opportunities for long-term success.",
      benefits: ["Scalability analysis", "Expansion planning", "Long-term vision"]
    }
  ];

  const additionalFeatures = [
    {
      icon: <Users className="w-6 h-6 text-blue-600" />,
      title: "Founder Community",
      description: "Connect with other entrepreneurs and share insights"
    },
    {
      icon: <Shield className="w-6 h-6 text-green-600" />,
      title: "Secure & Private",
      description: "Your ideas are protected with enterprise-grade security"
    },
    {
      icon: <Clock className="w-6 h-6 text-purple-600" />,
      title: "Instant Results",
      description: "Get comprehensive analysis in under 60 seconds"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-16 bg-gradient-to-br from-brand/5 via-transparent to-transparent">
        <div className="container mx-auto px-6">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Powerful Features for Startup Validation
            </h1>
            <p className="text-lg text-foreground-muted max-w-3xl mx-auto">
              GradeIdea.cc combines cutting-edge AI with proven startup frameworks to give you the insights you need to make informed decisions about your business idea.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12">
        {/* Main Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-all duration-200">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {feature.icon}
                  <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                </div>
                <p className="text-foreground-muted leading-relaxed">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-foreground-muted">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>

        {/* Additional Features */}
        <div className="bg-muted/50 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">
            Everything You Need to Succeed
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {additionalFeatures.map((feature, index) => (
              <div key={index} className="text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-background rounded-full flex items-center justify-center">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-foreground-muted">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Ready to Validate Your Startup Idea?
          </h2>
          <p className="text-foreground-muted mb-6 max-w-2xl mx-auto">
            Join thousands of entrepreneurs who have used GradeIdea.cc to make data-driven decisions about their business ideas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-brand text-white font-medium rounded-lg hover:bg-brand/90 transition-colors"
            >
              Start Validating Now
            </a>
            <a 
              href="/examples"
              className="inline-flex items-center justify-center px-6 py-3 border border-border text-foreground font-medium rounded-lg hover:bg-muted transition-colors"
            >
              View Examples
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
