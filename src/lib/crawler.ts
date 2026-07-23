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
  const skipExts = [".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".mp4", ".mp3", ".pdf", ".xml", ".rss", ".css", ".js", ".ico", ".woff", ".woff2", ".ttf", ".eot", ".webmanifest", ".json"];
  if (skipExts.some((ext) => lower.includes(ext))) return true;
  // Skip common non-content paths
  const skipPaths = ["/feed", "/wp-json", "/wp-content/plugins", "/wp-content/themes", "/wp-admin", "/wp-login", "/wp-includes", "/api/", "/_static/", "/static/", "/assets/"];
  if (skipPaths.some((p) => lower.includes(p))) return true;
  return false;
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
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
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

    // Skip URLs with query strings that look like API/embed calls
    if (href.includes("?") && (href.includes("format=") || href.includes("embed") || href.includes("action="))) {
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

/**
 * Fetch a page using native fetch() with a timeout.
 * Returns { html, title, text } or null on failure.
 */
async function fetchPageContent(url: string, timeoutMs: number = 10000): Promise<{ html: string; title: string; text: string } | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LinkForgeBot/1.0; +https://linkforge.digital)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      redirect: "follow",
    });

    clearTimeout(timer);

    if (!response.ok) {
      console.log(`[Crawler] fetch returned ${response.status} for ${url}`);
      return null;
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      console.log(`[Crawler] Skipping non-HTML content (${contentType}) for ${url}`);
      return null;
    }

    const html = await response.text();

    if (!html || html.length < 100) {
      console.log(`[Crawler] Empty/short response for ${url} (${html?.length || 0} chars)`);
      return null;
    }

    // Extract <title> tag
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? stripHtml(titleMatch[1]).trim() : "";
    const text = stripHtml(html);

    return { html, title, text };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown";
    if (msg.includes("abort") || msg.includes("timeout")) {
      console.log(`[Crawler] Timeout fetching ${url} after ${timeoutMs}ms`);
    } else {
      console.log(`[Crawler] Failed to fetch ${url}: ${msg}`);
    }
    return null;
  }
}

/**
 * Discover internal URLs from a page (homepage or sitemap)
 */
async function discoverUrls(siteUrl: string, maxUrls: number): Promise<string[]> {
  const base = normalizeUrl(siteUrl);
  const discovered = new Set<string>();

  // Try sitemap.xml and homepage in parallel
  const [sitemapResult, homeResult] = await Promise.all([
    fetchPageContent(`${base}/sitemap.xml`, 6000).catch(() => null),
    fetchPageContent(base, 10000).catch(() => null),
  ]);

  if (sitemapResult) {
    // Parse XML <loc> tags from sitemap
    const locRegex = /<loc[^>]*>([^<]+)<\/loc>/gi;
    let locMatch: RegExpExecArray | null;
    while ((locMatch = locRegex.exec(sitemapResult.html)) !== null) {
      const loc = locMatch[1].trim();
      if (loc.startsWith("http") && isInternalLink(loc, base) && !isContentTypeUrl(loc)) {
        discovered.add(normalizeUrl(loc));
      }
    }
    // Also extract href links from sitemap
    const sitemapLinks = extractLinks(sitemapResult.html, base);
    for (const link of sitemapLinks) {
      if (!isContentTypeUrl(link) && link !== base) {
        discovered.add(link);
      }
    }
    console.log(`[Crawler] Sitemap found ${discovered.size} URLs`);
  }

  // Always add links from homepage too
  if (homeResult) {
    const homeLinks = extractLinks(homeResult.html, base);
    for (const link of homeLinks) {
      if (link !== base && link !== `${base}/`) {
        discovered.add(link);
      }
    }
    console.log(`[Crawler] Total discovered: ${discovered.size} URLs`);
  }

  // Add the homepage itself (always first priority)
  discovered.add(base);

  // Prioritize the homepage and common content paths
  const urlList = Array.from(discovered);
  // Move homepage to front
  const idx = urlList.indexOf(base);
  if (idx > 0) {
    urlList.splice(idx, 1);
    urlList.unshift(base);
  }

  // Return up to maxUrls
  return urlList.slice(0, maxUrls);
}

/**
 * Fetch and parse a single page
 */
async function crawlSinglePage(url: string): Promise<CrawledPage | null> {
  const result = await fetchPageContent(url, 8000);
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
 * Full site crawl — discover URLs then fetch each page.
 * Uses native fetch() for speed and reliability (no external SDK dependency).
 * Optimized for serverless functions: higher concurrency, aggressive timeouts.
 */
export async function crawlSite(siteUrl: string, maxPages: number = 30): Promise<CrawlResult> {
  const base = normalizeUrl(siteUrl);
  console.log(`[Crawler] Starting crawl of ${base}, max ${maxPages} pages`);

  const result: CrawlResult = {
    pages: [],
    errors: [],
    discoveredUrlCount: 0,
  };

  // Step 1: Discover URLs (sitemap + homepage in parallel)
  const urls = await discoverUrls(base, maxPages);
  result.discoveredUrlCount = urls.length;

  if (urls.length === 0) {
    console.log(`[Crawler] No URLs discovered for ${base}`);
    return result;
  }

  console.log(`[Crawler] Crawling ${urls.length} URLs with concurrency 4`);

  // Step 2: Fetch pages in parallel batches
  const CONCURRENCY = 4;
  let processedCount = 0;

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
    processedCount += batch.length;

    // Stop if we have enough pages
    if (result.pages.length >= maxPages) {
      break;
    }
  }

  console.log(`[Crawler] Crawl complete: ${result.pages.length} pages, ${result.errors.length} errors`);
  return result;
}
