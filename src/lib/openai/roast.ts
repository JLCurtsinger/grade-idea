import OpenAI from 'openai';

export async function generateRoast(idea: string, harshness: 1|2|3) {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  // Environment check logging
  console.log(`[roast][llm][env] → { hasKey: ${!!openaiApiKey}, runtime: "${process.env.NEXT_RUNTIME || 'nodejs'}" }`);
  
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY environment variable not set');
  }

  console.log(`[roast][llm][start] → { idea: "${idea.slice(0, 50)}...", harshness: ${harshness} }`);

  try {
    const openai = new OpenAI({
      apiKey: openaiApiKey,
      timeout: 45000, // 45 second timeout
      maxRetries: 2,
    });

    const harshnessLevels = {
      1: "gentle and constructive",
      2: "moderately critical but fair", 
      3: "brutally honest and direct"
    };

    const prompt = `You are a startup mentor and investor who gives ${harshnessLevels[harshness]} feedback on business ideas. 

Analyze this startup idea: "${idea}"

Provide a roast-style analysis with these exact keys in JSON format:
- title: A catchy, critical title (max 60 chars)
- zingers: Array of 3-4 sharp, memorable critiques (each max 120 chars)
- insights: Array of 3-4 actionable improvement suggestions (each max 120 chars)  
- verdict: Overall assessment in 1-2 sentences (max 200 chars)
- risk_score: Number 1-10 where 1=low risk, 10=high risk

Be ${harshnessLevels[harshness]} but constructive. Focus on market validation, execution risks, and founder blind spots.

Return ONLY valid JSON, no other text.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 800,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Safe JSON parsing
    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error('[roast][llm][error] JSON parse failed:', parseError);
      throw new Error('Invalid response format from OpenAI');
    }

    // Validate required fields
    const requiredFields = ['title', 'zingers', 'insights', 'verdict', 'risk_score'];
    for (const field of requiredFields) {
      if (!(field in result)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate risk_score is a number 1-10
    if (typeof result.risk_score !== 'number' || result.risk_score < 1 || result.risk_score > 10) {
      result.risk_score = Math.max(1, Math.min(10, Number(result.risk_score) || 5));
    }

    console.log(`[roast][llm][done] → { ok: true }`);
    return result;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[roast][llm][error] → { message: "${errorMessage}" }`);
    
    // Re-throw with clear message for webhook handling
    throw new Error(`Roast generation failed: ${errorMessage}`);
  }
}
