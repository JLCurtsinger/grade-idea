"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Star } from "lucide-react";

export const PricingSection = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const subscriptionPlans = [
    {
      name: "Basic",
      price: "$5",
      period: "/mo",
      tokens: 12,
      costPerToken: "$0.42",
      features: ["12 tokens per month", "Auto-refill monthly", "Email support"],
      popular: false,
      buttonText: "Subscribe",
      buttonVariant: "outline" as const
    },
    {
      name: "Standard",
      price: "$10",
      period: "/mo",
      tokens: 28,
      costPerToken: "$0.36",
      features: ["28 tokens per month", "Auto-refill monthly", "Priority support", "Advanced analytics"],
      popular: true,
      buttonText: "Subscribe",
      buttonVariant: "default" as const
    },
    {
      name: "Pro",
      price: "$15",
      period: "/mo",
      tokens: 45,
      costPerToken: "$0.33",
      features: ["45 tokens per month", "Auto-refill monthly", "Priority support", "Advanced analytics", "Custom integrations"],
      popular: false,
      buttonText: "Subscribe",
      buttonVariant: "outline" as const
    }
  ];

  const topUpPlans = [
    {
      name: "Starter Pack",
      price: "$5",
      tokens: 10,
      costPerToken: "$0.50",
      buttonText: "Buy Tokens"
    },
    {
      name: "Popular Pack",
      price: "$10",
      tokens: 25,
      costPerToken: "$0.40",
      buttonText: "Buy Tokens"
    },
    {
      name: "Value Pack",
      price: "$20",
      tokens: 60,
      costPerToken: "$0.33",
      buttonText: "Buy Tokens"
    }
  ];

  const handlePlanSelect = (planName: string) => {
    setSelectedPlan(planName);
    // TODO: Integrate with Stripe flow
    console.log(`Selected plan: ${planName}`);
  };

  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-foreground-muted max-w-2xl mx-auto">
            Choose the plan that fits your building rhythm
          </p>
        </div>

        {/* Subscription Plans */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-foreground mb-2">
              Auto-Refill Plans
            </h3>
            <p className="text-foreground-muted">
              Perfect for regular builders. Tokens refill monthly.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {subscriptionPlans.map((plan, index) => (
              <Card 
                key={plan.name}
                className={`card-elevated p-8 relative transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group ${
                  plan.popular ? 'ring-2 ring-brand/20 shadow-glow' : ''
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-brand text-brand-foreground px-3 py-1 text-sm font-medium">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Plan Header */}
                  <div className="text-center">
                    <h4 className="text-xl font-semibold text-foreground mb-2">
                      {plan.name}
                    </h4>
                    <div className="flex items-baseline justify-center gap-1 mb-4">
                      <span className="text-4xl font-bold text-foreground">
                        {plan.price}
                      </span>
                      <span className="text-foreground-muted">
                        {plan.period}
                      </span>
                    </div>
                  </div>

                  {/* Token Info */}
                  <div className="text-center p-4 bg-surface rounded-lg">
                    <div className="text-2xl font-bold text-foreground mb-1">
                      {plan.tokens} tokens
                    </div>
                    <div className="text-sm text-foreground-muted">
                      {plan.costPerToken} per token
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-success flex-shrink-0" />
                        <span className="text-sm text-foreground-muted">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Button
                    className={`w-full ${
                      plan.popular 
                        ? 'btn-primary' 
                        : 'btn-secondary'
                    }`}
                    onClick={() => handlePlanSelect(plan.name)}
                  >
                    {plan.buttonText}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* One-Time Top-Ups */}
        <div>
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-foreground mb-2">
              One-Time Top-Ups
            </h3>
            <p className="text-foreground-muted">
              Just need a few tokens? Buy only what you need.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {topUpPlans.map((plan, index) => (
              <Card 
                key={plan.name}
                className="card-surface p-8 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group border-2 border-border hover:border-brand/30"
                style={{ animationDelay: `${(index + 3) * 0.1}s` }}
              >
                <div className="space-y-6">
                  {/* Plan Header */}
                  <div className="text-center">
                    <h4 className="text-xl font-semibold text-foreground mb-2">
                      {plan.name}
                    </h4>
                    <div className="flex items-baseline justify-center gap-1 mb-4">
                      <span className="text-4xl font-bold text-foreground">
                        {plan.price}
                      </span>
                    </div>
                  </div>

                  {/* Token Info */}
                  <div className="text-center p-4 bg-surface-elevated rounded-lg">
                    <div className="text-2xl font-bold text-foreground mb-1">
                      {plan.tokens} tokens
                    </div>
                    <div className="text-sm text-foreground-muted">
                      {plan.costPerToken} per token
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button
                    variant="outline"
                    className="w-full border-brand/30 text-brand hover:bg-brand/10 hover:border-brand/50"
                    onClick={() => handlePlanSelect(plan.name)}
                  >
                    {plan.buttonText}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <div className="max-w-2xl mx-auto p-6 bg-surface-elevated rounded-lg border border-border">
            <h4 className="text-lg font-semibold text-foreground mb-3">
              What's included with every plan?
            </h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-foreground-muted">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>Unlimited idea submissions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>Detailed scoring breakdown</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>Competitor analysis</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>Monetization guidance</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>Go-to-market strategies</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>Email support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}; 