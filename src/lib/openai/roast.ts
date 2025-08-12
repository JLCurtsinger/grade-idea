export async function generateRoast(idea: string, harshness: 1|2|3) {
  return {
    title: "Demo Roast Title",
    zingers: [
      "This pitch is wearing Crocs to a VC meeting.",
      "Your TAM sounds like a wish and a prayer.",
      "If buzzwords were revenue, you'd be profitable."
    ],
    insights: [
      "Tighten the ICP—who buys first?",
      "Validate CAC for your top channel.",
      "Show a 10x wedge over incumbents."
    ],
    verdict: "Promising, but needs sharper positioning and proof.",
    risk_score: 6
  };
}
