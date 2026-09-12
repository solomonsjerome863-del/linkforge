import { db } from "@/lib/db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Internal Linking Audit Report",
  robots: { index: false, follow: false },
};

export default async function ReportPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;

  const site = await db.site.findUnique({
    where: { id: siteId },
    select: { name: true, url: true, pagesCount: true, lastCrawled: true },
  });

  if (!site) {
    notFound();
  }

  const pages = await db.page.findMany({
    where: { siteId },
    select: { id: true, title: true, url: true, wordCount: true },
  });

  const suggestions = await db.linkSuggestion.findMany({
    where: { siteId },
    orderBy: [{ opportunityScore: "desc" }, { score: "desc" }],
    include: {
      sourcePage: { select: { title: true, url: true } },
      targetPage: { select: { title: true, url: true } },
    },
  });

  // Inbound internal-link suggestion counts per page
  const inbound: Record<string, number> = {};
  for (const s of suggestions) {
    inbound[s.targetPageId] = (inbound[s.targetPageId] || 0) + 1;
  }

  const orphans = pages.filter((p) => !inbound[p.id]);
  const underlinked = pages.filter(
    (p) => (inbound[p.id] || 0) > 0 && (inbound[p.id] || 0) < 3
  );
  const avgOpportunity =
    suggestions.length > 0
      ? Math.round(
          suggestions.reduce((sum, s) => sum + s.opportunityScore, 0) /
            suggestions.length
        )
      : 0;
  const topOpportunities = suggestions.slice(0, 15);

  const reportDate = new Date().toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="report bg-white text-neutral-900">
      <style>{`
        .report { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 860px; margin: 0 auto; padding: 40px 32px; }
        .report .band { border-bottom: 3px solid #ea580c; padding-bottom: 18px; margin-bottom: 26px; }
        .report .kicker { font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #ea580c; margin-bottom: 6px; }
        .report h1 { font-size: 28px; margin: 0 0 4px; letter-spacing: -0.5px; }
        .report .siteurl { color: #6b7280; font-size: 14px; }
        .report .meta { font-size: 12px; color: #9ca3af; margin-top: 8px; }
        .report h2 { font-size: 17px; margin: 34px 0 12px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; }
        .report .stats { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 8px; }
        .report .stat { flex: 1 1 140px; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 16px; }
        .report .stat .v { font-size: 24px; font-weight: 800; }
        .report .stat .l { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; }
        .report table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .report th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; border-bottom: 2px solid #111827; padding: 8px 10px; }
        .report td { padding: 9px 10px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
        .report .score { font-weight: 800; color: #ea580c; }
        .report .actions li { margin-bottom: 8px; font-size: 13.5px; }
        .report .note { background: #fff7ed; border-left: 4px solid #ea580c; padding: 12px 16px; font-size: 13px; border-radius: 0 8px 8px 0; margin: 10px 0 0; }
        .report .credit { margin-top: 40px; padding-top: 14px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
        .report .printnote { font-size: 12px; color: #9ca3af; background: #f9fafb; border: 1px dashed #d1d5db; border-radius: 8px; padding: 8px 14px; margin-bottom: 20px; }
        @media print { .report .printnote { display: none; } .report { padding: 0; } .pt, .report tr { break-inside: avoid; page-break-inside: avoid; } }
        @media (max-width: 640px) { .report { padding: 24px 16px; } .report .stats { flex-direction: column; } }
      `}</style>

      <p className="printnote">
        💡 To save or share this report as a PDF, press <strong>Ctrl+P</strong> (Windows) or
        <strong> ⌘+P</strong> (Mac) and choose "Save as PDF".
      </p>

      <div className="band">
        <div className="kicker">Internal Linking Audit Report</div>
        <h1>{site.name}</h1>
        <div className="siteurl">{site.url}</div>
        <div className="meta">
          Report date: {reportDate}
          {site.lastCrawled
            ? ` · Last crawl: ${new Date(site.lastCrawled).toLocaleDateString("en-ZA")}`
            : ""}
        </div>
      </div>

      <h2>Summary</h2>
      <div className="stats">
        <div className="stat">
          <div className="v">{pages.length}</div>
          <div className="l">Pages Analyzed</div>
        </div>
        <div className="stat">
          <div className="v">{suggestions.length}</div>
          <div className="l">Opportunities Found</div>
        </div>
        <div className="stat">
          <div className="v">{orphans.length}</div>
          <div className="l">Orphan Pages</div>
        </div>
        <div className="stat">
          <div className="v">{avgOpportunity}</div>
          <div className="l">Avg Opportunity Score</div>
        </div>
      </div>

      <h2>Top Opportunities (prioritized by impact)</h2>
      {topOpportunities.length === 0 ? (
        <p>
          No link opportunities were generated for this site yet. Run a crawl and
          generate suggestions to populate this report.
        </p>
      ) : (
        <table className="pt">
          <thead>
            <tr>
              <th style={{ width: 46 }}>#</th>
              <th>Anchor text</th>
              <th>From</th>
              <th>Link to</th>
              <th style={{ width: 70 }}>Score</th>
            </tr>
          </thead>
          <tbody>
            {topOpportunities.map((s, i) => (
              <tr key={s.id}>
                <td>{i + 1}</td>
                <td>
                  <strong>{s.anchorText}</strong>
                </td>
                <td>
                  {s.sourcePage.title}
                  <br />
                  <span style={{ color: "#9ca3af", fontSize: 11 }}>{s.sourcePage.url}</span>
                </td>
                <td>
                  {s.targetPage.title}
                  <br />
                  <span style={{ color: "#9ca3af", fontSize: 11 }}>{s.targetPage.url}</span>
                </td>
                <td className="score">{s.opportunityScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Orphan Pages ({orphans.length})</h2>
      {orphans.length === 0 ? (
        <p>
          ✅ No orphan pages detected — every analyzed page receives at least one
          internal link opportunity.
        </p>
      ) : (
        <>
          <p style={{ fontSize: 13 }}>
            These pages have no internal links pointing at them. Add contextual links
            from the related pages listed in the opportunities above.
          </p>
          <table className="pt">
            <thead>
              <tr>
                <th>Page</th>
                <th>URL</th>
                <th style={{ width: 90 }}>Words</th>
              </tr>
            </thead>
            <tbody>
              {orphans.slice(0, 20).map((p) => (
                <tr key={p.id}>
                  <td>{p.title}</td>
                  <td>
                    <span style={{ color: "#6b7280", fontSize: 12 }}>{p.url}</span>
                  </td>
                  <td>{p.wordCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {orphans.length > 20 && (
            <p style={{ fontSize: 12, color: "#9ca3af" }}>
              …and {orphans.length - 20} more.
            </p>
          )}
        </>
      )}

      <h2>Underlinked Pages ({underlinked.length})</h2>
      {underlinked.length === 0 ? (
        <p>✅ No underlinked pages detected.</p>
      ) : (
        <p style={{ fontSize: 13 }}>
          These pages receive 1–2 internal links. Pages targeting 3+ internal links
          consistently outperform. Prioritize:{" "}
          <strong>{underlinked.slice(0, 8).map((p) => p.title).join(" · ")}</strong>
          {underlinked.length > 8 ? ` …and ${underlinked.length - 8} more.` : ""}
        </p>
      )}

      <h2>Recommended Actions</h2>
      <ul className="actions">
        <li>
          Work through the Top Opportunities in order — they are sorted by expected
          SEO impact, not just similarity.
        </li>
        <li>
          Fix the {orphans.length} orphan page{orphans.length === 1 ? "" : "s"} first
          if any exist — orphan content cannot rank.
        </li>
        <li>
          Add at least 3 internal links to every underlinked page listed above.
        </li>
        <li>
          Re-run the audit after applying changes to measure the improvement.
        </li>
      </ul>

      <div className="note">
        <strong>Implementation note:</strong> every opportunity above can be applied
        directly from the LinkForge dashboard with one click, or handed to your dev
        team as-is.
      </div>

      <div className="credit">Prepared with LinkForge — internal-linking intelligence for {site.url}</div>
    </div>
  );
}
