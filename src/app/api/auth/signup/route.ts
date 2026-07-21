import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";

function stripPasswordHash<T extends { passwordHash?: string | null }>(obj: T): Omit<T, "passwordHash"> {
  const { passwordHash: _, ...rest } = obj;
  return rest;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, password } = body;
    const normalizedEmail = email.toLowerCase().trim();

    // Validate inputs
    if (!normalizedEmail || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    if (password.length > 128) {
      return NextResponse.json({ error: "Password is too long" }, { status: 400 });
    }

    if (name && name.length > 200) {
      return NextResponse.json({ error: "Name is too long" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.user.findFirst({ where: { email: { equals: normalizedEmail, mode: "insensitive" } } });
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

    // Create user
    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        name: name || null,
        passwordHash: await hashPassword(password),
        emailVerified: true, // Auto-verified for demo; add email service for production
      },
    });

    // Create a demo site
    const demoSite = await db.site.create({
      data: {
        name: "My SEO Blog",
        url: "https://example-seo-blog.com",
        platform: "wordpress",
        status: "ready",
        pageLimit: 50,
        pagesCount: 10,
        linksCount: 0,
        userId: user.id,
        lastCrawled: new Date(),
      },
    });

    // Create sample pages for the demo site
    const samplePosts = [
      { title: "Complete Guide to Internal Linking for SEO", slug: "/internal-linking-guide-seo", headings: ["What is Internal Linking?", "Why Internal Links Matter for SEO", "Best Practices for Internal Linking", "How Many Internal Links Per Page?", "Internal Linking vs External Linking"], wordCount: 2400 },
      { title: "On-Page SEO Checklist for 2025", slug: "/on-page-seo-checklist-2025", headings: ["Title Tag Optimization", "Meta Description Best Practices", "Header Tag Hierarchy", "Image Alt Text Guidelines", "URL Structure Tips"], wordCount: 1800 },
      { title: "How to Build Topic Clusters for Content Strategy", slug: "/topic-clusters-content-strategy", headings: ["What Are Topic Clusters?", "Pillar Content vs Cluster Content", "Finding Content Gaps", "Linking Between Clusters", "Measuring Topic Cluster Performance"], wordCount: 2100 },
      { title: "Schema Markup Guide: Structured Data for SEO", slug: "/schema-markup-guide-structured-data", headings: ["Introduction to Schema Markup", "Article Schema", "FAQ Schema", "How-To Schema", "Breadcrumb Schema"], wordCount: 3200 },
      { title: "Content Pruning: Removing Old Content That Hurts SEO", slug: "/content-pruning-guide", headings: ["What is Content Pruning?", "When to Prune Content", "How to Audit Your Content", "What to Do With Pruned Content", "Measuring Results"], wordCount: 1900 },
      { title: "Link Building Strategies That Actually Work", slug: "/link-building-strategies-2025", headings: ["Why Link Building Still Matters", "Guest Posting That Works", "Digital PR Campaigns", "Broken Link Building", "Resource Page Link Building"], wordCount: 2800 },
      { title: "Technical SEO Audit: A Step-by-Step Guide", slug: "/technical-seo-audit-guide", headings: ["Crawlability Check", "Index Coverage Analysis", "Page Speed Optimization", "Mobile-Friendliness", "Structured Data Validation"], wordCount: 3500 },
      { title: "Keyword Research Guide for Modern SEO", slug: "/keyword-research-guide", headings: ["Understanding Search Intent", "Long-Tail Keywords", "Competitor Keyword Analysis", "Keyword Difficulty Metrics", "Content Mapping to Keywords"], wordCount: 2600 },
      { title: "E-E-A-T and Google's Quality Guidelines", slug: "/eeat-google-quality-guidelines", headings: ["What is E-E-A-T?", "Experience Factor", "Expertise Signals", "Authoritative Content", "Trustworthiness Indicators"], wordCount: 2200 },
      { title: "Core Web Vitals Optimization Guide", slug: "/core-web-vitals-optimization", headings: ["LCP: Largest Contentful Paint", "INP: Interaction to Next Paint", "CLS: Cumulative Layout Shift", "Measuring Core Web Vitals", "Common Fixes and Tips"], wordCount: 2900 },
    ];

    const pageCreates = samplePosts.map((post) => {
      const textContent = generatePostContent(post.title, post.headings, post.wordCount);
      return {
        url: `https://example-seo-blog.com${post.slug}`,
        title: post.title,
        content: `<article><h1>${post.title}</h1><p>${textContent.slice(0, 200)}</p><p>${textContent.slice(200, 400)}</p><p>${textContent.slice(400)}</p></article>`,
        textContent,
        headings: JSON.stringify(post.headings),
        wordCount: post.wordCount,
        status: "active",
        siteId: demoSite.id,
      };
    });

    await db.page.createMany({ data: pageCreates });

    const createdPages = await db.page.findMany({ where: { siteId: demoSite.id } });

    // Generate some link suggestions
    await generateAndStoreSuggestions(demoSite.id, createdPages);

    const safeUser = stripPasswordHash(user);

    // Determine admin status at runtime (not build-time)
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
    const isAdmin = adminEmail ? safeUser.email?.toLowerCase().trim() === adminEmail : false;

    return NextResponse.json({
      user: { ...safeUser, isAdmin },
      site: demoSite,
    }, { status: 201 });
  } catch (error: unknown) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function generatePostContent(title: string, headings: string[], targetWords: number): string {
  const paragraphs: string[] = [];

  paragraphs.push(`${title}. This comprehensive guide covers everything you need to know about this critical SEO topic. In today's competitive digital landscape, understanding and implementing these strategies can make the difference between ranking on page one and being buried in search results. We'll walk through each aspect step by step, providing actionable insights you can apply to your website right away.`);

  for (const heading of headings) {
    paragraphs.push(`## ${heading}. When it comes to ${heading.toLowerCase()}, there are several key considerations that every SEO professional should understand. The foundation of a solid strategy starts with proper implementation and consistent monitoring of your results over time. Many websites miss out on significant traffic because they overlook these fundamental elements. By focusing on these core areas, you can build a more robust search presence and drive qualified organic traffic to your pages.`);

    paragraphs.push(`Implementing ${heading.toLowerCase()} correctly requires both technical knowledge and strategic thinking. Start by auditing your current approach, identify gaps and opportunities, then develop a systematic plan for improvement. Remember that SEO is not a one-time task but an ongoing process that evolves with search engine algorithms and user behavior patterns.`);
  }

  let combined = paragraphs.join(" ");
  // Pad or trim to approximate target word count
  const currentWords = combined.split(/\s+/).length;
  if (currentWords < targetWords) {
    const filler = `Search engine optimization continues to evolve, and staying ahead of the curve requires dedication to continuous learning and adaptation. The strategies outlined in this guide represent current best practices backed by industry research and real-world results. Always test changes in controlled environments and measure their impact before rolling them out across your entire site. `;
    const repeats = Math.ceil((targetWords - currentWords) / filler.split(/\s+/).length);
    combined += (filler.repeat(repeats)).slice(0, targetWords * 6);
  }

  return combined.slice(0, targetWords * 6);
}

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

function pickAnchorText(targetTitle: string, targetHeadings: string[]): string {
  const words = targetTitle.replace(/[^a-zA-Z0-9\s]/g, "").split(/\s+/).filter(w => w.length >= 3 && !STOP_WORDS.has(w.toLowerCase()));
  if (words.length >= 3) {
    return words.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  }
  if (words.length >= 2) {
    return words.slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  }
  const headingWords = targetHeadings[0]?.replace(/[^a-zA-Z0-9\s]/g, "").split(/\s+/).filter(w => w.length >= 3 && !STOP_WORDS.has(w.toLowerCase())) || [];
  return headingWords.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ") || "learn more";
}

function generateSurroundingText(textContent: string): string {
  const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 20);
  if (sentences.length === 0) return textContent.slice(0, 50);
  const idx = Math.floor(Math.random() * sentences.length);
  const sentence = sentences[idx].trim();
  const start = Math.max(0, Math.floor(sentence.length / 2) - 25);
  const end = Math.min(sentence.length, start + 50);
  return (start > 0 ? "..." : "") + sentence.slice(start, end) + (end < sentence.length ? "..." : "");
}

async function generateAndStoreSuggestions(siteId: string, pages: { id: string; title: string; textContent: string; headings: string }[]) {
  // Extract keywords for each page
  const pageKeywords = pages.map((p) => ({
    ...p,
    parsedHeadings: JSON.parse(p.headings || "[]") as string[],
    keywords: extractKeywords(p.title + " " + p.headings + " " + p.textContent.slice(0, 500)),
  }));

  const suggestions: { siteId: string; sourcePageId: string; targetPageId: string; anchorText: string; surroundingText: string; score: number; status: string }[] = [];

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

  if (capped.length > 0) {
    await db.linkSuggestion.createMany({ data: capped });
  }
}