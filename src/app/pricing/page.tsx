import { Metadata } from 'next';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Star, Zap, Crown } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Pricing – Startup Idea Validation Tokens | GradeIdea.cc',
    description: 'Choose the right plan for your startup validation needs. Purchase tokens to analyze your business ideas with AI-powered insights.',
    alternates: { canonical: 'https://gradeidea.cc/pricing' },
  };
}

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      price: "$9",
      tokens: 10,
      description: "Perfect for testing a few ideas",
      features: [
        "10 AI-powered idea validations",
        "Comprehensive scoring reports",
        "Market potential analysis",
        "Monetization insights",
        "Competitive differentiation",
        "Execution feasibility",
        "Growth potential assessment",
        "Email support"
      ],
      popular: false,
      icon: <Zap className="w-6 h-6 text-yellow-600" />
    },
    {
      name: "Founder",
      price: "$29",
      tokens: 50,
      description: "Ideal for active entrepreneurs",
      features: [
        "50 AI-powered idea validations",
        "All Starter features",
        "Priority processing",
        "Detailed insights",
        "Export reports",
        "Priority email support"
      ],
      popular: true,
      icon: <Star className="w-6 h-6 text-blue-600" />
    },
    {
      name: "Pro",
      price: "$99",
      tokens: 200,
      description: "For teams and agencies",
      features: [
        "200 AI-powered idea validations",
        "All Founder features",
        "Bulk analysis",
        "API access",
        "White-label reports",
        "Dedicated support"
      ],
      popular: false,
      icon: <Crown className="w-6 h-6 text-purple-600" />
    }
  ];

  const additionalFeatures = [
    "No monthly fees - tokens never expire",
    "Secure and private - your ideas stay confidential",
    "Instant results - analysis in under 60 seconds",
    "Mobile-friendly reports",
    "Export to PDF",
    "Share reports with team members"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-16 bg-gradient-to-br from-brand/5 via-transparent to-transparent">
        <div className="container mx-auto px-6">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg text-foreground-muted max-w-3xl mx-auto">
              Choose the plan that fits your startup validation needs. No monthly fees, no hidden costs - just powerful AI insights when you need them.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12">
        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`p-8 relative ${
                plan.popular 
                  ? 'ring-2 ring-brand shadow-lg scale-105' 
                  : 'hover:shadow-lg transition-all duration-200'
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-brand text-white">
                  Most Popular
                </Badge>
              )}
              
              <div className="text-center space-y-6">
                <div className="flex items-center justify-center gap-3">
                  {plan.icon}
                  <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-foreground-muted">/one-time</span>
                  </div>
                  <p className="text-foreground-muted">{plan.description}</p>
                </div>

                <div className="text-center">
                  <span className="text-3xl font-bold text-brand">{plan.tokens}</span>
                  <p className="text-sm text-foreground-muted">AI Validations</p>
                </div>

                <ul className="space-y-3 text-left">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-foreground-muted">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-brand hover:bg-brand/90' 
                      : 'bg-foreground hover:bg-foreground/90'
                  }`}
                >
                  Get Started
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Additional Features */}
        <div className="bg-muted/50 rounded-xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">
            What's Included in Every Plan
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {additionalFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-foreground-muted">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Do tokens expire?</h3>
              <p className="text-foreground-muted">No, tokens never expire. Use them whenever you need to validate an idea.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Can I upgrade my plan?</h3>
              <p className="text-foreground-muted">Yes, you can purchase additional tokens at any time. No need to wait for renewal.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">What if I'm not satisfied?</h3>
              <p className="text-foreground-muted">We offer a 30-day money-back guarantee. If you're not happy, we'll refund your purchase.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Is my data secure?</h3>
              <p className="text-foreground-muted">Absolutely. We use enterprise-grade security and never share your ideas with third parties.</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Ready to Validate Your Startup Ideas?
          </h2>
          <p className="text-foreground-muted mb-6 max-w-2xl mx-auto">
            Join thousands of entrepreneurs who trust GradeIdea.cc to make data-driven decisions about their business ideas.
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
