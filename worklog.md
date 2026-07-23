---
Task ID: 1
Agent: Main Agent
Task: Fix crawl failure - investigate root cause and implement fixes

Work Log:
- Investigated the complete crawl flow: frontend (sites-view.tsx) → API route → auth → DB → after() → crawler
- Found root causes:
  1. Frontend swallowed server error messages (`throw new Error()` without reading response body)
  2. `after()` from next/server could fail silently 
  3. DB operations (deleteMany) before response could slow down the initial response
  4. ZAI page_reader had no timeout, could hang indefinitely on large sites
- Fixed frontend (sites-view.tsx):
  - Now reads and displays actual server error message in toast
  - Changed generic "Failed to start crawl" to "Crawl error: {actual message}"
- Rewrote crawl API route (src/app/api/sites/[id]/crawl/route.ts):
  - Better error logging at every step (auth, site lookup, ownership, URL validation)
  - Wrapped `after()` in try-catch so failure doesn't crash the response
  - Moved expensive deleteMany operations INSIDE after() to not block initial response
  - Added 409 status for "crawl already in progress"
  - Changed ownership error from 401 to 403 with descriptive message
  - Set maxDuration to 60 (Vercel caps at plan limit)
  - Detailed error messages in catch blocks
- Improved crawler (src/lib/crawler.ts):
  - Added 15s timeout to page_reader calls using Promise.race
  - Added 8s timeout for sitemap fetch (less critical)
  - Better logging for page_reader failures

Stage Summary:
- Crawl flow verified working locally (API returns 200 immediately, after() callback runs)
- Key files modified: sites-view.tsx, crawl/route.ts, crawler.ts
- Production deployment needs: prisma db push to ensure CrawlJob table exists
- User should now see actual error message if crawl fails on Vercel
