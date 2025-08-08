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
      if (sessionStorage.getItem("hiw-animated") === "1") setHasAnimated(true);
    } catch {}
  }, []);

  useEffect(() => {
    if (!sectionRef.current || prefersReducedMotion) return;
    const node = sectionRef.current;
    let revealed = false;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !revealed) {
            setHasAnimated(true);
            revealed = true;
            try {
              sessionStorage.setItem("hiw-animated", "1");
            } catch {}
          }
        });
      },
      { threshold: 0.2 }
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

  const useMotion = !prefersReducedMotion && !hasAnimated;

  const containerVariants = {
    hidden: {},
    shown: { transition: { staggerChildren: 0.08 } },
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    shown: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  const Section: any = useMotion ? motion.section : "section";
  const Grid: any = useMotion ? motion.div : "div";
  const Card: any = useMotion ? motion.div : "div";

  return (
    <Section
      id="how-it-works"
      ref={sectionRef}
      className="scroll-mt-24 md:scroll-mt-28 lg:scroll-mt-32 py-16 md:py-24"
      {...(useMotion
        ? { initial: "hidden", whileInView: "shown", viewport: { once: true, margin: "0px 0px -10% 0px" } }
        : {})}
      aria-labelledby="how-it-works-title"
    >
      <div className="container mx-auto px-4 md:px-6">
        <header className="mb-8 md:mb-12">
          <h2
            id="how-it-works-title"
            className="text-3xl md:text-4xl font-semibold tracking-tight"
          >
            How It Works
          </h2>
        </header>

        <Grid
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
          {...(useMotion ? { variants: containerVariants } : {})}
        >
          {steps.map(({ icon: Icon, title, body }, i) => (
            <Card
              key={i}
              className="group rounded-2xl border bg-card/60 backdrop-blur-sm p-6 md:p-8 shadow-sm transition-colors hover:bg-accent/5"
              {...(useMotion ? { variants: cardVariants } : {})}
            >
              <div className="flex items-start gap-4">
                {/* Icon chip to match other sections */}
                <div className="h-10 w-10 rounded-xl ring-1 ring-border/50 bg-foreground/5 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>

                <div>
                  <h3 className="text-lg md:text-xl font-semibold tracking-tight">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm md:text-base leading-relaxed text-foreground/80">
                    {body}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </Grid>
      </div>
    </Section>
  );
}
