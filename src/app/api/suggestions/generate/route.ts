import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateUser } from "@/lib/api-auth";
import { generateAnchorTextWithLLM } from "@/lib/llm-anchor";

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "can", "shall", "to", "of", "in", "for",
  "on", "with", "at", "by", "from", "as", "into", "through", "during",
  "before", "after", "above", "below", "between", "out", "off", "over",
  "under", "again", "further", "then", "once", "here", "there", "when",
  "where", "why", "how", "all", "each", "every", "both", "few", "more",
  "most", "other", "some", "such", "no", "nor", "not", "only", "own",
  "same", "so", "than", "too", "very", "just", "because", "but", "and",
  "or", "if", "while", "that", "this", "these", "those", "it", "its",
  "what", "which", "who", "whom", "about", "up", "your", "you", "we",
  "our", "they", "their", "them", "his", "her", "she", "he", "my", "me",
  "i", "also", "new", "like", "get", "make", "use", "way", "many",
]);

function extractKeywords(text: string): string[] {
  const words = text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").split(/\s+/);
  const freq: Record<string, number> = {};
  for (const w of words) {
    if (w.length >= 3 && !STOP_WORDS.has(w)) {
      freq[w] = (freq[w] || 0) + 1;
    }
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([w]) => w);
}

function keywordOverlap(kw1: string[], kw2: string[]): number {
  const set1 = new Set(kw1);
  const set2 = new Set(kw2);
  const common = [...set1].filter((w) => set2.has(w));
  const allUnique = new Set([...set1, ...set2]);
  return allUnique.size > 0 ? common.length / allUnique.size : 0;
}

function pickAnchorText(targetTitle: string, targetHeadings: string[]): string {
  const words = targetTitle
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w.toLowerCase()));

  if (words.length >= 3) {
    return words.slice(0, 3).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  }
  if (words.length >= 2) {
    return words.slice(0, 2).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  }

  const headingWords =
    targetHeadings[0]
      ?.replace(/[^a-zA-Z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !STOP_WORDS.has(w.toLowerCase())) || [];
  return (
    headingWords.slice(0, 3).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ") ||
    "learn more"
  );
}

function generateSurroundingText(textContent: string): string {
  const sentences = textContent.split(/[.!?]+/).filter((s) => s.trim().length > 20);
  if (sentences.length === 0) return textContent.slice(0, 50);
  const idx = Math.floor(Math.random() * sentences.length);
  const sentence = sentences[idx].trim();
  const start = Math.max(0, Math.floor(sentence.length / 2) - 25);
  const end = Math.min(sentence.length, start + 50);
  return (start > 0 ? "..." : "") + sentence.slice(start, end) + (end < sentence.length ? "..." : "");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteId, userId } = body;

    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    if (userId) {
      const user = await validateUser(userId);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 401 });
      }
    }

    const site = await db.site.findUnique({ where: { id: siteId } });
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    if (userId && site.userId !== userId) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const pages = await db.page.findMany({
      where: { siteId },
    });

    if (pages.length < 2) {
      return NextResponse.json({ error: "Need at least 2 pages to generate suggestions" }, { status: 400 });
    }

    // Delete existing pending suggestions
    await db.linkSuggestion.deleteMany({
      where: { siteId, status: "pending" },
    });

    // Extract keywords for each page
    const pageKeywords = pages.map((p) => ({
      ...p,
      parsedHeadings: JSON.parse(p.headings || "[]") as string[],
      keywords: extractKeywords(p.title + " " + p.headings + " " + p.textContent.slice(0, 500)),
    }));

    // Compute pairwise TF-overlap scores
    const suggestions: {
      siteId: string;
      sourcePageId: string;
      targetPageId: string;
      anchorText: string;
      surroundingText: string;
      score: number;
      status: string;
    }[] = [];

    for (let i = 0; i < pageKeywords.length; i++) {
      for (let j = 0; j < pageKeywords.length; j++) {
        if (i === j) continue;

        const sourceKw = new Set(pageKeywords[i].keywords);
        const targetKw = new Set(pageKeywords[j].keywords);
        const common = [...sourceKw].filter((w) => targetKw.has(w));
        const allUnique = new Set([...sourceKw, ...targetKw]);
        const overlap = common.length / allUnique.size;

        if (overlap > 0.15) {
          const anchorText = pickAnchorText(pageKeywords[j].title, pageKeywords[j].parsedHeadings);
          const surroundingText = generateSurroundingText(pageKeywords[i].textContent);

          suggestions.push({
            siteId,
            sourcePageId: pageKeywords[i].id,
            targetPageId: pageKeywords[j].id,
            anchorText,
            surroundingText,
            score: Math.round(overlap * 100) / 100,
            status: "pending",
          });
        }
      }
    }

    // Sort by score desc, cap at 30
    suggestions.sort((a, b) => b.score - a.score);
    const capped = suggestions.slice(0, 30);

    // Enhance top suggestions with LLM-generated anchor text
    const topForLLM = capped.slice(0, 10);
    if (topForLLM.length > 0) {
      const llmPairs = topForLLM.map((s) => {
        const sourcePage = pageKeywords.find((p) => p.id === s.sourcePageId);
        const targetPage = pageKeywords.find((p) => p.id === s.targetPageId);
        return {
          sourcePageId: s.sourcePageId,
          targetPageId: s.targetPageId,
          source: {
            title: sourcePage?.title || "",
            headings: sourcePage?.parsedHeadings || [],
            textContent: sourcePage?.textContent || "",
          },
          target: {
            title: targetPage?.title || "",
            headings: targetPage?.parsedHeadings || [],
            textContent: targetPage?.textContent || "",
          },
          score: s.score,
        };
      });

      try {
        const llmResults = await generateAnchorTextWithLLM(llmPairs);
        for (const suggestion of capped) {
          const key = `${suggestion.sourcePageId}::${suggestion.targetPageId}`;
          const llmResult = llmResults.get(key);
          if (llmResult) {
            suggestion.anchorText = llmResult.anchorText;
            if (llmResult.surroundingText) {
              suggestion.surroundingText = llmResult.surroundingText;
            }
          }
        }
        console.log(`[Generate] LLM enhanced ${llmResults.size}/${llmPairs.length} anchor texts`);
      } catch (error) {
        console.error("[Generate] LLM anchor generation failed, using algorithmic fallback:", error);
      }
    }

    if (capped.length > 0) {
      await db.linkSuggestion.createMany({ data: capped });
    }

    // Update site linksCount
    await db.site.update({
      where: { id: siteId },
      data: { linksCount: capped.length },
    });

    // Fetch the created suggestions with page info
    const created = await db.linkSuggestion.findMany({
      where: { siteId },
      orderBy: { score: "desc" },
      include: {
        sourcePage: { select: { id: true, title: true, url: true } },
        targetPage: { select: { id: true, title: true, url: true } },
      },
    });

    return NextResponse.json({
      suggestions: created,
      count: capped.length,
    });
  } catch (error: unknown) {
    console.error("Generate suggestions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}