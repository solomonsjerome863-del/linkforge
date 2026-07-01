import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateUser } from "@/lib/api-auth";

const SAMPLE_POSTS = [
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

function generatePostContent(title: string, headings: string[], targetWords: number): string {
  const paragraphs: string[] = [];

  paragraphs.push(
    `${title}. This comprehensive guide covers everything you need to know about this critical SEO topic. ` +
    `In today's competitive digital landscape, understanding and implementing these strategies can make the difference between ranking on page one and being buried in search results. ` +
    `We'll walk through each aspect step by step, providing actionable insights you can apply to your website right away. ` +
    `The search engine optimization ecosystem is complex and constantly evolving, so staying informed about the latest best practices is essential for maintaining and improving your organic visibility.`
  );

  for (const heading of headings) {
    paragraphs.push(
      `## ${heading}. When it comes to ${heading.toLowerCase()}, there are several key considerations that every SEO professional should understand. ` +
      `The foundation of a solid strategy starts with proper implementation and consistent monitoring of your results over time. ` +
      `Many websites miss out on significant traffic because they overlook these fundamental elements. ` +
      `By focusing on these core areas, you can build a more robust search presence and drive qualified organic traffic to your pages. ` +
      `The data consistently shows that websites following these guidelines outperform their competitors in both rankings and user engagement metrics.`
    );

    paragraphs.push(
      `Implementing ${heading.toLowerCase()} correctly requires both technical knowledge and strategic thinking. ` +
      `Start by auditing your current approach, identify gaps and opportunities, then develop a systematic plan for improvement. ` +
      `Remember that SEO is not a one-time task but an ongoing process that evolves with search engine algorithms and user behavior patterns. ` +
      `Regular monitoring and iteration are key to long-term success. Tools like Google Search Console, Ahrefs, and SEMrush can provide valuable data to inform your decisions and track your progress over time.`
    );
  }

  let combined = paragraphs.join(" ");
  const currentWords = combined.split(/\s+/).length;
  if (currentWords < targetWords) {
    const filler =
      `Search engine optimization continues to evolve, and staying ahead of the curve requires dedication to continuous learning and adaptation. ` +
      `The strategies outlined in this guide represent current best practices backed by industry research and real-world results. ` +
      `Always test changes in controlled environments and measure their impact before rolling them out across your entire site. ` +
      `Internal linking remains one of the most underutilized SEO tactics available to website owners. ` +
      `A well-structured internal link architecture helps search engines discover and understand the relationship between your pages, ` +
      `distributes page authority throughout your site, and improves user navigation. `;
    const repeats = Math.ceil((targetWords - currentWords) / filler.split(/\s+/).length);
    combined += filler.repeat(repeats);
  }

  // Trim to approximate target
  const words = combined.split(/\s+/);
  if (words.length > targetWords) {
    return words.slice(0, targetWords).join(" ");
  }
  return combined;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.nextUrl.searchParams.get("userId");
    if (userId) {
      const user = await validateUser(userId);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 401 });
      }
    }

    const site = await db.site.findUnique({ where: { id } });
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    if (userId && site.userId !== userId) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Create crawl job
    const crawlJob = await db.crawlJob.create({
      data: {
        siteId: id,
        status: "running",
        startedAt: new Date(),
      },
    });

    // Update site status
    await db.site.update({
      where: { id },
      data: { status: "crawling" },
    });

    // Delete existing pages and suggestions for a fresh crawl
    await db.linkSuggestion.deleteMany({ where: { siteId: id } });
    await db.page.deleteMany({ where: { siteId: id } });

    // Pick 8-12 random posts
    const shuffled = [...SAMPLE_POSTS].sort(() => Math.random() - 0.5);
    const postCount = 8 + Math.floor(Math.random() * 5); // 8-12
    const selectedPosts = shuffled.slice(0, Math.min(postCount, SAMPLE_POSTS.length));

    const siteUrl = site.url.replace(/\/$/, "");

    // Create pages
    const pageCreates = selectedPosts.map((post) => {
      const textContent = generatePostContent(post.title, post.headings, post.wordCount);
      return {
        url: `${siteUrl}${post.slug}`,
        title: post.title,
        content: `<article><h1>${post.title}</h1><p>${textContent.slice(0, 300)}</p><p>${textContent.slice(300, 600)}</p><p>${textContent.slice(600)}</p></article>`,
        textContent,
        headings: JSON.stringify(post.headings),
        wordCount: post.wordCount,
        status: "active",
        siteId: id,
      };
    });

    await db.page.createMany({ data: pageCreates });
    const pages = await db.page.findMany({ where: { siteId: id } });

    // Update site
    await db.site.update({
      where: { id },
      data: {
        status: "ready",
        pagesCount: pages.length,
        lastCrawled: new Date(),
      },
    });

    // Update crawl job
    await db.crawlJob.update({
      where: { id: crawlJob.id },
      data: {
        status: "completed",
        pagesFound: pages.length,
        pagesSaved: pages.length,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      crawlJob: {
        ...crawlJob,
        status: "completed",
        pagesFound: pages.length,
        pagesSaved: pages.length,
        completedAt: new Date().toISOString(),
      },
      pagesCount: pages.length,
    });
  } catch (error: unknown) {
    console.error("Crawl error:", error);

    // Try to mark crawl job as failed
    try {
      const site = await db.site.findUnique({ where: { id: (await params).id } });
      if (site) {
        await db.site.update({
          where: { id: site.id },
          data: { status: "error", error: "Crawl failed" },
        });
        const latestJob = await db.crawlJob.findFirst({
          where: { siteId: site.id, status: "running" },
          orderBy: { createdAt: "desc" },
        });
        if (latestJob) {
          await db.crawlJob.update({
            where: { id: latestJob.id },
            data: {
              status: "failed",
              error: error instanceof Error ? error.message : "Unknown error",
              completedAt: new Date(),
            },
          });
        }
      }
    } catch {
      // Ignore cleanup errors
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}