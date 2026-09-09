import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveUserId } from "@/lib/session";
import ZAI from "z-ai-web-dev-sdk";

// Source type classification by hostname
function classifySourceType(hostname: string): string {
  const h = hostname.toLowerCase();
  if (h.includes("reddit.com") || h.includes("reddit")) return "reddit";
  if (
    h.includes("twitter.com") ||
    h.includes("x.com") ||
    h.includes("facebook.com") ||
    h.includes("instagram.com") ||
    h.includes("linkedin.com") ||
    h.includes("tiktok.com")
  )
    return "social";
  if (
    h.includes("news.google.com") ||
    h.includes("bbc.com") ||
    h.includes("cnn.com") ||
    h.includes("reuters.com") ||
    h.includes("apnews.com") ||
    h.includes("theguardian.com") ||
    h.includes("nytimes.com") ||
    h.includes("washingtonpost.com") ||
    h.includes("news.") ||
    h.includes("daily.") ||
    h.includes("times.") ||
    h.includes("post.")
  )
    return "news";
  if (
    h.includes("forum.") ||
    h.includes("forums.") ||
    h.includes("community.") ||
    h.includes("stackexchange.com") ||
    h.includes("stackoverflow.com") ||
    h.includes("quora.com") ||
    h.includes("discourse.org")
  )
    return "forum";
  if (
    h.includes("medium.com") ||
    h.includes("substack.com") ||
    h.includes("dev.to") ||
    h.includes("hashnode.dev") ||
    h.includes("ghost.org") ||
    h.includes("wordpress.com")
  )
    return "blog";
  return "other";
}

// Simple authority score based on domain characteristics
function scoreAuthority(hostname: string): number {
  const h = hostname.toLowerCase();
  let score = 30; // base score

  // TLD trust signals
  const trustedTlds = [".edu", ".gov", ".org"];
  for (const tld of trustedTlds) {
    if (h.endsWith(tld)) score += 20;
  }

  // Well-known high-authority domains
  const highAuthority = [
    "wikipedia.org",
    "github.com",
    "stackoverflow.com",
    "medium.com",
    "nytimes.com",
    "bbc.com",
    "reuters.com",
    "theguardian.com",
  ];
  for (const domain of highAuthority) {
    if (h.includes(domain)) score += 25;
  }

  // Shorter domain names tend to be more established
  const domainParts = h.replace(/www\./, "").split(".");
  const mainDomain = domainParts[0];
  if (mainDomain.length <= 6) score += 10;
  if (mainDomain.length <= 3) score += 5;

  // Penalize very long hostnames (subdomain-heavy, less authoritative)
  if (h.length > 30) score -= 5;

  return Math.min(100, Math.max(0, score));
}

// Relevance score based on search position and snippet
function scoreRelevance(
  position: number,
  snippet: string,
  brandName: string
): number {
  let score = 0;

  // Position-based scoring (position 1 = best relevance signal)
  score += Math.max(0, 50 - position * 3);

  // Snippet match scoring
  if (snippet && brandName) {
    const lowerSnippet = snippet.toLowerCase();
    const lowerBrand = brandName.toLowerCase();

    // Exact brand name in snippet
    if (lowerSnippet.includes(lowerBrand)) {
      score += 30;
      // Bonus for brand name appearing in title-like position (early in snippet)
      const brandPos = lowerSnippet.indexOf(lowerBrand);
      if (brandPos < 50) score += 10;
    }
  }

  return Math.min(100, Math.max(0, score));
}

// Opportunity score: composite of authority + relevance + backlink potential
function scoreOpportunity(
  authority: number,
  relevance: number,
  hasBacklink: boolean
): number {
  const baseScore = authority * 0.4 + relevance * 0.6;

  // Massive opportunity boost if no backlink from high-authority, high-relevance source
  if (!hasBacklink) {
    return Math.min(100, Math.round(baseScore * 1.2));
  }

  return Math.round(baseScore);
}

const VALID_STATUSES = [
  "new",
  "reviewed",
  "outreach_sent",
  "converted",
  "dismissed",
];

/**
 * POST /api/citations/scan
 * Scans the web for brand mentions (consumes AI/search resources, so
 * identity from the session cookie — transitional body fallback is
 * logged — and brand ownership are mandatory).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandId } = body;
    const userId = resolveUserId(
      request,
      typeof body.userId === "string" ? body.userId : null
    );

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required. Please log in again." },
        { status: 401 }
      );
    }

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    const brand = await db.citationBrand.findUnique({
      where: { id: brandId },
      include: { site: { select: { userId: true } } },
    });

    if (!brand || brand.site.userId !== userId) {
      return NextResponse.json(
        { error: "Brand not found or access denied" },
        { status: 403 }
      );
    }

    // Perform web search for the brand name
    const zai = await ZAI.create();
    const searchQuery = `"${brand.name}" OR ${brand.name}`;
    const results = await zai.functions.invoke("web_search", {
      query: searchQuery,
      num: 20,
    });

    // ZAI web_search returns results as a direct array, or wrapped in .results/.data
    const searchResults = Array.isArray(results)
      ? results
      : results?.results || results?.data || [];
    let scanned = 0;
    let newCount = 0;

    for (const result of searchResults) {
      scanned++;

      const url = result.url || result.link || result.href;
      const title = result.title || result.name || "";
      const snippet = result.snippet || result.description || result.text || "";

      if (!url) continue;

      // Skip if URL already exists for this brand
      try {
        const existing = await db.citation.findUnique({
          where: { brandId_url: { brandId, url } },
        });
        if (existing) continue;
      } catch {
        continue;
      }

      // Parse hostname
      let hostname = "";
      try {
        hostname = new URL(url).hostname;
      } catch {
        hostname = url.split("/")[2] || "unknown";
      }

      const sourceType = classifySourceType(hostname);
      const authorityScore = scoreAuthority(hostname);
      const relevanceScore = scoreRelevance(scanned, snippet, brand.name);
      const opportunityScore = scoreOpportunity(
        authorityScore,
        relevanceScore,
        false
      );

      await db.citation.create({
        data: {
          brandId,
          siteId: brand.siteId,
          url,
          title,
          snippet,
          sourceType,
          hostName: hostname,
          hasBacklink: false, // Phase 1: default to false
          authorityScore,
          relevanceScore,
          opportunityScore,
          sentiment: "neutral", // Phase 1: default to neutral
          status: "new",
        },
      });

      newCount++;
    }

    // Update brand's lastScanned timestamp
    await db.citationBrand.update({
      where: { id: brandId },
      data: { lastScanned: new Date() },
    });

    return NextResponse.json({
      scanned,
      new: newCount,
      brandId,
    });
  } catch (error: unknown) {
    console.error("Citation scan error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: "Scan failed", details: message },
      { status: 500 }
    );
  }
}
