import OpenAI from "openai";

function getMiniMaxClient(): OpenAI {
  const key = process.env.MINIMAX_API_KEY;
  if (!key) {
    throw new Error(
      "MINIMAX_API_KEY is not set. Add it in Vercel Project Settings → Environment Variables."
    );
  }
  return new OpenAI({
    apiKey: key,
    baseURL: "https://api.minimax.io/v1",
  });
}

export async function callMiniMax(
  systemPrompt: string,
  userPrompt: string,
  maxRetries = 3
): Promise<string> {
  const minimax = getMiniMaxClient();

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await minimax.chat.completions.create({
        model: "MiniMax-M2.7",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 8192,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error("Empty response from MiniMax");
      return content;
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw new Error("Max retries exceeded");
}

export function parseJSONFromLLM(text: string): Record<string, unknown> {
  const cleaned = text.trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // noop
  }

  const codeBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      // noop
    }
  }

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    } catch {
      // noop
    }
  }

  throw new Error(`Failed to parse JSON from LLM response: ${cleaned.slice(0, 200)}...`);
}
