import { Lightbulb, Gauge, ClipboardCheck } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      icon: Lightbulb,
      title: "Describe Your Idea",
      body:
        "Type your startup idea in one or two sentences. Guests can try two free mock analyses; signed-in users spend one token per real scan.",
      chipClasses: "bg-[#95FC0F]/15 ring-[#95FC0F]/30",
      iconClasses: "text-[#95FC0F]",
    },
    {
      icon: Gauge,
      title: "Get a Founder‑Grade Review",
      body:
        "Our AI evaluates market potential, differentiation, monetization clarity, and execution difficulty, then returns scores and a clear summary in about a minute.",
      chipClasses: "bg-green-500/15 ring-green-500/30",
      iconClasses: "text-green-400",
    },
    {
      icon: ClipboardCheck,
      title: "Improve with a Checklist",
      body:
        "You'll get actionable steps to raise your score, suggested monetization models and channels, and everything is saved to your dashboard for later.",
      chipClasses: "bg-amber-500/15 ring-amber-500/30",
      iconClasses: "text-amber-400",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 md:scroll-mt-28 lg:scroll-mt-32 py-16 md:py-24"
      aria-labelledby="how-it-works-title"
    >
      <div className="container mx-auto px-4 md:px-6">
        <header className="mb-8 md:mb-12">
          <h2
            id="how-it-works-title"
            className="text-3xl md:text-4xl font-semibold tracking-tight"
          >
            How to <span className="accent-text-gradient">validate a startup idea</span>
          </h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 min-h-[400px]">
          {steps.map(({ icon: Icon, title, body, chipClasses, iconClasses }, i) => (
            <div
              key={i}
              className="group rounded-2xl border bg-card/60 backdrop-blur-sm p-6 md:p-8 shadow-sm transition-colors hover:bg-accent/5"
            >
              <div className="flex flex-col">
                {/* Icon chip on top, left-aligned */}
                <div className={`h-10 w-10 rounded-xl ring-1 ${chipClasses} flex items-center justify-center shrink-0`}>
                  <Icon size={20} strokeWidth={2} aria-hidden="true" className={iconClasses} />
                </div>

                {/* Title */}
                <h3 className="mt-4 text-lg md:text-xl font-semibold tracking-tight">
                  {title}
                </h3>

                {/* Body */}
                <p className="mt-2 text-sm md:text-base leading-relaxed text-foreground/80">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
