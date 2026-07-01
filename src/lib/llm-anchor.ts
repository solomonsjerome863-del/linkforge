import ZAI from "z-ai-web-dev-sdk";

// Singleton SDK instance
let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

interface PageContext {
  title: string;
  headings: string[];
  textContent: string;
}

interface SuggestionPair {
  sourcePageId: string;
  targetPageId: string;
  source: PageContext;
  target: PageContext;
  score: number;
}

interface LLMAnchorResult {
  anchorText: string;
  surroundingText: string;
}

const SYSTEM_PROMPT = `You are an expert SEO specialist who creates optimal internal link anchor text. Your job is to suggest the best anchor text phrase to link from a source page to a target page.

Rules:
1. Anchor text must be 2-5 words, descriptive, and natural-sounding
2. It should accurately represent the TARGET page's content
3. It should read naturally within the SOURCE page's context
4. Prefer using the target page's key topic/phrase, not generic words like "learn more" or "click here"
5. Use title case for the first letter of each major word
6. Never use the exact full title — extract the most link-worthy phrase from it
7. The surroundingText should be a realistic 30-50 character excerpt from the source page where this link would naturally fit

You MUST respond with valid JSON only. No markdown, no explanation, just the JSON array.`;

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/\s+\S*$/, "");
}

export async function generateAnchorTextWithLLM(
  pairs: SuggestionPair[]
): Promise<Map<string, LLMAnchorResult>> {
  const results = new Map<string, LLMAnchorResult>();

  if (pairs.length === 0) return results;

  // Process in batches of 5 to balance quality vs speed
  const BATCH_SIZE = 5;

  for (let i = 0; i < pairs.length; i += BATCH_SIZE) {
    const batch = pairs.slice(i, i + BATCH_SIZE);

    const pairsDesc = batch.map((pair, idx) => {
      const sourceHeadings = pair.source.headings.slice(0, 3).join(", ");
      const targetHeadings = pair.target.headings.slice(0, 3).join(", ");

      return `Pair ${idx + 1}:
  Source page: "${pair.source.title}"
  Source headings: ${sourceHeadings}
  Source content: "${truncate(pair.source.textContent, 400)}"
  
  Target page: "${pair.target.title}"
  Target headings: ${targetHeadings}
  Target content: "${truncate(pair.target.textContent, 400)}"
  Relevance score: ${Math.round(pair.score * 100)}%`;
    }).join("\n\n");

    const userPrompt = `For each of the following source→target page pairs, generate the best internal link anchor text.

${pairsDesc}

Return a JSON array with ${batch.length} objects, each with "anchorText" (2-5 words) and "surroundingText" (30-50 chars). Order must match the pairs above.`;

    try {
      const zai = await getZAI();

      const completion = await zai.chat.completions.create({
        messages: [
          { role: "assistant", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        thinking: { type: "disabled" },
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) continue;

      // Parse JSON response — handle markdown code fences
      let jsonStr = raw.trim();
      const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) jsonStr = fenceMatch[1].trim();

      const parsed: LLMAnchorResult[] = JSON.parse(jsonStr);

      // Map results back to pairs
      for (let j = 0; j < batch.length && j < parsed.length; j++) {
        const result = parsed[j];
        const key = `${batch[j].sourcePageId}::${batch[j].targetPageId}`;

        if (result.anchorText && result.anchorText.length >= 2) {
          results.set(key, {
            anchorText: result.anchorText,
            surroundingText: result.surroundingText || null,
          });
        }
      }
    } catch (error) {
      console.error(
        `[LLM Anchor] Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`,
        error instanceof Error ? error.message : "Unknown error"
      );
      // Continue with next batch — failures don't block others
    }
  }

  return results;
}