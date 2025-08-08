"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Lightbulb, Gauge, ClipboardCheck } from "lucide-react";

export default function HowItWorks() {
  const prefersReducedMotion = useReducedMotion();
  const [hasAnimated, setHasAnimated] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  // One-time-per-visit guard
  useEffect(() => {
    try {
      const key = "hiw-animated";
      if (sessionStorage.getItem(key) === "1") {
        setHasAnimated(true);
      }
    } catch {
      // ignore sessionStorage access errors
    }
  }, []);

  useEffect(() => {
    if (!sectionRef.current) return;
    if (prefersReducedMotion) return;

    const key = "hiw-animated";
    const node = sectionRef.current;
    let revealed = false;

    const onReveal = () => {
      if (!revealed) {
        setHasAnimated(true);
        revealed = true;
        try {
          sessionStorage.setItem(key, "1");
        } catch {
          // ignore
        }
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) onReveal();
        });
      },
      { root: null, threshold: 0.2 }
    );

    io.observe(node);
    return () => io.disconnect();
  }, [prefersReducedMotion]);

  const steps = useMemo(
    () => [
      {
        icon: Lightbulb,
        title: "Describe Your Idea",
        body:
          "Type your startup idea in one or two sentences. Guests can try two free mock analyses; signed-in users spend one token per real scan.",
      },
      {
        icon: Gauge,
        title: "Get a Founder‑Grade Review",
        body:
          "Our AI evaluates market potential, differentiation, monetization clarity, and execution difficulty, then returns scores and a clear summary in about a minute.",
      },
      {
        icon: ClipboardCheck,
        title: "Improve with a Checklist",
        body:
          "You'll get actionable steps to raise your score, suggested monetization models and channels, and everything is saved to your dashboard for later.",
      },
    ],
    []
  );

  const containerVariants = {
    hidden: {},
    shown: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    shown: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  // If reduced motion is preferred, or already animated this visit, render statically
  const useMotion = !prefersReducedMotion && !hasAnimated;

  const SectionWrapper: any = useMotion ? motion.section : "section";
  const Card: any = useMotion ? motion.div : "div";
  const Container: any = useMotion ? motion.div : "div";

  return (
    <SectionWrapper
      id="how-it-works"
      ref={sectionRef}
      // scroll-mt fixes anchor offset under sticky header; adjust values to match header height
      className="scroll-mt-24 md:scroll-mt-32 lg:scroll-mt-40"
      {...(useMotion ? { initial: "hidden", whileInView: "shown", viewport: { once: true, margin: "0px 0px -10% 0px" } } : {})}
    >
      <div className="container mx-auto px-4">
        <div className="mb-6 md:mb-10">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">How It Works</h2>
        </div>

        <Container
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
          {...(useMotion ? { variants: containerVariants } : {})}
        >
          {steps.map(({ icon: Icon, title, body }, idx) => (
            <Card
              key={idx}
              className="rounded-2xl border bg-card/60 backdrop-blur-sm p-5 md:p-6 shadow-sm transition-colors"
              {...(useMotion ? { variants: cardVariants } : {})}
            >
              <div className="flex items-start gap-3 md:gap-4">
                <div className="mt-1">
                  <Icon className="w-6 h-6 md:w-7 md:h-7" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-medium">{title}</h3>
                  <p className="text-sm md:text-[15px] leading-relaxed mt-2 text-foreground/80">
                    {body}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </Container>
      </div>
    </SectionWrapper>
  );
}
