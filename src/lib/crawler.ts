import ZAI from "z-ai-web-dev-sdk";

// ── Types ──

export interface CrawledPage {
  url: string;
  title: string;
  content: string;       // raw HTML snippet
  textContent: string;   // plain text
  headings: string[];    // h1, h2, h3 texts
  wordCount: number;
}

export interface CrawlResult {
  pages: CrawledPage[];
  errors: { url: string; error: string }[];
  discoveredUrlCount: number;
}

// ── Singleton ──

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

// ── Helpers ──

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return url.replace(/\/+$/, "");
  }
}

function isInternalLink(link: string, baseUrl: string): boolean {
  try {
    const base = new URL(baseUrl);
    const target = new URL(link, baseUrl);
    // Same origin (allow different subdomains)
    return target.hostname === base.hostname && target.protocol === base.protocol;
  } catch {
    return false;
  }
}

function isContentTypeUrl(url: string): boolean {
  const lower = url.toLowerCase();
  // Skip images, videos, PDFs, feeds, assets
  const skipExts = [".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".mp4", ".mp3", ".pdf", ".xml", ".rss", ".css", ".js", ".ico", ".woff", ".woff2", ".ttf", ".eot"];
  return skipExts.some((ext) => lower.includes(ext));
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/\s+/g, " ")
    .trim();
}

function extractHeadings(html: string): string[] {
  const headings: string[] = [];
  const regex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const text = stripHtml(match[2]).trim();
    if (text.length > 2 && text.length < 200) {
      headings.push(text);
    }
  }
  return headings;
}

function extractLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const regex = /href=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    let href = match[1].trim();

    // Skip anchors, javascript, mailto, tel
    if (href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      continue;
    }

    // Resolve relative URLs
    try {
      const resolved = new URL(href, baseUrl).toString();
      if (!isContentTypeUrl(resolved) && isInternalLink(resolved, baseUrl)) {
        links.push(normalizeUrl(resolved));
      }
    } catch {
      // Invalid URL, skip
    }
  }

  return [...new Set(links)];
}

function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

// ── Core Functions ──

async function fetchPageContent(url: string): Promise<{ html: string; title: string; text: string } | null> {
  try {
    const zai = await getZAI();
    const result = await zai.functions.invoke("page_reader", { url });

    if (result.code !== 200 || !result.data?.html) {
      return null;
    }

    const html = result.data.html;
    const title = result.data.title || stripHtml(html).slice(0, 80).trim();
    const text = stripHtml(html);

    return { html, title, text };
  } catch (error) {
    console.error(`[Crawler] Failed to fetch ${url}:`, error instanceof Error ? error.message : "Unknown");
    return null;
  }
}

/**
 * Discover internal URLs from a page (homepage or sitemap)
 */
async function discoverUrls(siteUrl: string, maxUrls: number): Promise<string[]> {
  const base = normalizeUrl(siteUrl);
  const discovered = new Set<string>();

  // Strategy 1: Try sitemap.xml first
  const sitemapUrl = `${base}/sitemap.xml`;
  const sitemapResult = await fetchPageContent(sitemapUrl);
  if (sitemapResult) {
    const sitemapLinks = extractLinks(sitemapResult.html, base);
    for (const link of sitemapLinks) {
      if (!isContentTypeUrl(link) && link !== base) {
        discovered.add(link);
      }
    }
    // Also try parsing XML <loc> tags
    const locRegex = /<loc[^>]*>([^<]+)<\/loc>/gi;
    let locMatch: RegExpExecArray | null;
    while ((locMatch = locRegex.exec(sitemapResult.html)) !== null) {
      const loc = locMatch[1].trim();
      if (loc.startsWith("http") && isInternalLink(loc, base) && !isContentTypeUrl(loc)) {
        discovered.add(normalizeUrl(loc));
      }
    }
    console.log(`[Crawler] Sitemap found ${discovered.size} URLs`);
  }

  // Strategy 2: If sitemap didn't yield enough, crawl the homepage
  if (discovered.size < 3) {
    const homeResult = await fetchPageContent(base);
    if (homeResult) {
      const homeLinks = extractLinks(homeResult.html, base);
      for (const link of homeLinks) {
        if (link !== base && link !== `${base}/`) {
          discovered.add(link);
        }
      }
      console.log(`[Crawler] Homepage discovered ${homeLinks.length} links, total now ${discovered.size}`);
    }
  }

  // Add the homepage itself
  discovered.add(base);

  // Return up to maxUrls (excluding base to keep it under the limit)
  const allUrls = Array.from(discovered).slice(0, maxUrls);
  return allUrls;
}

/**
 * Fetch and parse a single page
 */
async function crawlSinglePage(url: string): Promise<CrawledPage | null> {
  const result = await fetchPageContent(url);
  if (!result) return null;

  const textContent = result.text;
  const headings = extractHeadings(result.html);
  const wordCount = countWords(textContent);

  // Skip very short pages (likely not content pages)
  if (wordCount < 50) {
    console.log(`[Crawler] Skipping ${url} — only ${wordCount} words`);
    return null;
  }

  return {
    url,
    title: result.title,
    content: result.html.slice(0, 5000), // Store first 5k chars of HTML
    textContent: textContent.slice(0, 10000), // Store first 10k chars of text
    headings,
    wordCount,
  };
}

/**
 * Full site crawl — discover URLs then fetch each page
 */
export async function crawlSite(siteUrl: string, maxPages: number = 30): Promise<CrawlResult> {
  const base = normalizeUrl(siteUrl);
  console.log(`[Crawler] Starting crawl of ${base}, max ${maxPages} pages`);

  const result: CrawlResult = {
    pages: [],
    errors: [],
    discoveredUrlCount: 0,
  };

  // Step 1: Discover URLs
  const urls = await discoverUrls(base, maxPages);
  result.discoveredUrlCount = urls.length;

  if (urls.length === 0) {
    console.log(`[Crawler] No URLs discovered for ${base}`);
    return result;
  }

  // Step 2: Fetch each page (sequential to respect rate limits)
  // Process 3 pages concurrently
  const CONCURRENCY = 3;

  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);

    const batchResults = await Promise.allSettled(
      batch.map(async (url) => {
        const page = await crawlSinglePage(url);
        if (page) {
          return page;
        }
        throw new Error(`Failed to crawl or content too short`);
      })
    );

    for (let j = 0; j < batchResults.length; j++) {
      const settled = batchResults[j];
      if (settled.status === "fulfilled") {
        result.pages.push(settled.value);
        console.log(`[Crawler] ✓ ${settled.value.title} (${settled.value.wordCount} words)`);
      } else {
        const url = batch[j];
        result.errors.push({ url, error: settled.reason?.message || "Unknown error" });
        console.log(`[Crawler] ✗ ${url}`);
      }
    }

    // Stop if we have enough pages
    if (result.pages.length >= maxPages) {
      break;
    }

    // Small delay between batches
    if (i + CONCURRENCY < urls.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log(`[Crawler] Crawl complete: ${result.pages.length} pages, ${result.errors.length} errors`);
  return result;
}