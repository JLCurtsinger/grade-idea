"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { motion, useReducedMotion } from "framer-motion";
import { 
  Lightbulb, 
  BarChart3, 
  CheckSquare2 
} from "lucide-react";

const steps = [
  {
    icon: Lightbulb,
    title: "Describe Your Idea",
    description: "Type your startup idea in one or two sentences. Guests can try two free mock analyses; signed-in users spend one token per real scan."
  },
  {
    icon: BarChart3,
    title: "Get a Founder‑Grade Review",
    description: "Our AI evaluates market potential, differentiation, monetization clarity, and execution difficulty, then returns scores and a clear summary in about a minute."
  },
  {
    icon: CheckSquare2,
    title: "Improve with a Checklist",
    description: "You'll get actionable steps to raise your score, suggested monetization models and channels, and everything is saved to your dashboard for later."
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 20 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

export function HowItWorks() {
  const [hasAnimated, setHasAnimated] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // Check if we've already animated this session
    const animated = sessionStorage.getItem("hiw-animated");
    if (animated) {
      setHasAnimated(true);
    } else {
      // Mark as animated for this session
      sessionStorage.setItem("hiw-animated", "true");
    }
  }, []);

  // If user prefers reduced motion or we've already animated, render static
  const shouldAnimate = !prefersReducedMotion && !hasAnimated;

  return (
    <section id="how-it-works" className="py-16 bg-gradient-to-br from-brand/5 via-transparent to-transparent">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-foreground-muted max-w-2xl mx-auto">
            Get founder-grade insights in minutes with our AI-powered validation process
          </p>
        </div>

        <motion.div 
          className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
          variants={shouldAnimate ? containerVariants : undefined}
          initial={shouldAnimate ? "hidden" : "visible"}
          animate="visible"
        >
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            
            return (
              <motion.div
                key={index}
                variants={shouldAnimate ? cardVariants : undefined}
                className="group"
              >
                <Card className="p-6 h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-border-elevated">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="p-3 bg-brand/10 rounded-lg group-hover:bg-brand/20 transition-colors">
                        <IconComponent className="w-8 h-8 text-brand" />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="text-xl font-semibold text-foreground">
                        {step.title}
                      </h3>
                      <p className="text-foreground-muted leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
