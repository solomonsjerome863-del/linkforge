import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateUser } from "@/lib/api-auth";
import { execSync } from "child_process";

function extractInternalLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const regex = /href=["']([^"']+)["']/gi;
  let match;
  const base = new URL(baseUrl);

  while ((match = regex.exec(html)) !== null) {
    try {
      const href = match[1];
      const url = new URL(href, baseUrl);
      if (
        url.hostname === base.hostname &&
        !url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|css|js|ico|woff|woff2|ttf|eot|mp4|mp3|pdf|zip)/i) &&
        url.pathname !== "/" &&
        url.pathname.length > 1
      ) {
        const normalized = `${url.protocol}//${url.hostname}${url.pathname}`;
        if (!links.includes(normalized)) {
          links.push(normalized);
        }
      }
    } catch {
      // Skip invalid URLs
    }
  }
  return links;
}

function extractHeadings(text: string): string[] {
  const headings: string[] = [];
  const htmlRegex = /<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi;
  let match;
  while ((match = htmlRegex.exec(text)) !== null) {
    const clean = match[1].replace(/<[^>]*>/g, "").trim();
    if (clean) headings.push(clean);
  }
  return headings;
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function readPageViaCLI(url: string): { title: string; html: string; text: string } | null {
  try {
    const output = execSync(
      `z-ai function -n page_reader -a '${JSON.stringify({ url })}' -o /tmp/linkforge-page-${Date.now()}.json`,
      { timeout: 30000, encoding: "utf-8" }
    );
    // z-ai outputs result to stdout as JSON
    const lines = output.trim().split("\n");
    const jsonLine = lines.find((l) => l.startsWith("{"));
    if (!jsonLine) return null;
    const data = JSON.parse(jsonLine);
    const html = data.data?.html || data.html || "";
    return {
      title: data.data?.title || data.title || url,
      html,
      text: htmlToPlainText(html),
    };
  } catch (err) {
    console.error(`Failed to read ${url}:`, err);
    return null;
  }
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
      data: { siteId: id, status: "running", startedAt: new Date() },
    });

    await db.site.update({
      where: { id },
      data: { status: "crawling", error: null },
    });

    // Delete existing pages and suggestions
    await db.linkSuggestion.deleteMany({ where: { siteId: id } });
    await db.page.deleteMany({ where: { siteId: id } });

    const siteUrl = site.url.replace(/\/$/, "");
    const maxPages = site.pageLimit || 50;

    try {
      // Step 1: Read homepage
      const homepage = readPageViaCLI(siteUrl);

      if (!homepage) {
        throw new Error(`Could not read ${siteUrl}. Make sure the URL is accessible.`);
      }

      const internalLinks = homepage.html
        ? extractInternalLinks(homepage.html, siteUrl)
        : [];
      const urlsToCrawl = [siteUrl, ...internalLinks].slice(0, maxPages);

      // Step 2: Crawl each page
      const pagesToCreate: {
        url: string;
        title: string;
        content: string;
        textContent: string;
        headings: string;
        wordCount: number;
        status: string;
        siteId: string;
      }[] = [];

      // Add homepage
      const hpHeadings = homepage.html ? extractHeadings(homepage.html) : ["Homepage"];
      pagesToCreate.push({
        url: siteUrl,
        title: homepage.title,
        content: homepage.html.slice(0, 50000),
        textContent: homepage.text.slice(0, 30000),
        headings: JSON.stringify(hpHeadings.length > 0 ? hpHeadings : ["Homepage"]),
        wordCount: homepage.text.split(/\s+/).filter(Boolean).length,
        status: "active",
        siteId: id,
      });

      // Crawl discovered pages
      for (let i = 1; i < urlsToCrawl.length; i++) {
        const pageData = readPageViaCLI(urlsToCrawl[i]);
        if (pageData && pageData.text.length > 50) {
          const headings = pageData.html ? extractHeadings(pageData.html) : [];
          pagesToCreate.push({
            url: urlsToCrawl[i],
            title: pageData.title,
            content: pageData.html.slice(0, 50000),
            textContent: pageData.text.slice(0, 30000),
            headings: JSON.stringify(headings.length > 0 ? headings : ["Page"]),
            wordCount: pageData.text.split(/\s+/).filter(Boolean).length,
            status: "active",
            siteId: id,
          });
        }
      }

      // Step 3: Save pages
      if (pagesToCreate.length > 0) {
        await db.page.createMany({ data: pagesToCreate });
      }

      await db.site.update({
        where: { id },
        data: {
          status: "ready",
          pagesCount: pagesToCreate.length,
          lastCrawled: new Date(),
        },
      });

      await db.crawlJob.update({
        where: { id: crawlJob.id },
        data: {
          status: "completed",
          pagesFound: urlsToCrawl.length,
          pagesSaved: pagesToCreate.length,
          completedAt: new Date(),
        },
      });

      return NextResponse.json({
        crawlJob: {
          id: crawlJob.id,
          status: "completed",
          pagesFound: urlsToCrawl.length,
          pagesSaved: pagesToCreate.length,
          completedAt: new Date().toISOString(),
        },
        pagesCount: pagesToCreate.length,
      });
    } catch (crawlError) {
      const errorMessage = crawlError instanceof Error ? crawlError.message : "Crawl failed";

      await db.site.update({
        where: { id },
        data: { status: "error", error: errorMessage },
      });
      await db.crawlJob.update({
        where: { id: crawlJob.id },
        data: { status: "failed", error: errorMessage, completedAt: new Date() },
      });

      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error("Crawl error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}