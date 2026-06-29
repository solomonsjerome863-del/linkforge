"use client";

import { PhaseSection, InsightCard } from "./phase-section";
import { Rocket, AlertTriangle, Shield, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const roadmapSteps = [
  {
    phase: "MVP",
    title: "Core Engine + WordPress Plugin",
    timeline: "Weeks 1-6",
    color: "bg-teal-500",
    textColor: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-500/5 border-teal-500/20",
    items: [
      "Content ingestion via WordPress REST API + XML sitemap parser",
      "Paragraph-aware chunker with heading context",
      "OpenAI text-embedding-3-small integration",
      "Qdrant (Docker) for vector storage",
      "GPT-4o-mini anchor text generation with Pydantic validation",
      "Basic dashboard: view suggestions, accept/reject, one-click apply",
      "PostgreSQL schema (Posts, Embeddings, LinkSuggestions)",
      "Orphan post detection (simple inbound_links = 0 query)",
    ],
    deliverables: ["Working WordPress plugin", "Self-hosted engine (Docker Compose)", "Basic dashboard with 100 posts tested"],
  },
  {
    phase: "V1.0",
    title: "Multi-Tenant SaaS + Bulk Processing",
    timeline: "Weeks 7-14",
    color: "bg-orange-500",
    textColor: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-500/5 border-orange-500/20",
    items: [
      "Multi-tenant architecture with site_id isolation (row-level security)",
      "AWS SQS + Lambda worker for bulk processing (10K+ posts)",
      "Rate limiter for embedding API calls (token bucket algorithm)",
      "Pinecone Serverless integration (managed tier)",
      "Shopify & Webflow connector SDKs (REST API adapters)",
      "Bulk suggestion generation with progress tracking",
      "Suggestion expiration (30-day TTL) and batch management",
      "Usage analytics dashboard (cost per link, acceptance rate)",
    ],
    deliverables: ["SaaS platform with auth (NextAuth)", "Shopify + Webflow integrations", "Processed 10K+ post site successfully"],
  },
  {
    phase: "V2.0",
    title: "Intelligence Layer + Self-Hosted LLM",
    timeline: "Weeks 15-22",
    color: "bg-amber-500",
    textColor: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/5 border-amber-500/20",
    items: [
      "Self-hosted embedding model (all-MiniLM-L6-v2 via sentence-transformers)",
      "Self-hosted LLM option (Llama 3.1 70B via Ollama/vLLM)",
      "Smart re-suggestion: detect content changes and re-suggest",
      "Link health monitoring: detect broken internal links",
      "Anchor text performance tracking (CTR from SERP, rankings)",
      "A/B testing for anchor text variants",
      "Content gap analysis: topics with no coverage",
      "API rate optimization: adaptive batching based on API response times",
    ],
    deliverables: ["Fully offline/self-hosted option", "Link health monitoring", "Content gap reports"],
  },
  {
    phase: "Scale",
    title: "Enterprise + Plugin Ecosystem",
    timeline: "Weeks 23-30",
    color: "bg-rose-500",
    textColor: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-500/5 border-rose-500/20",
    items: [
      "Plugin SDK for custom CMS integrations (React component library)",
      "Webhook system for real-time content change detection",
      "Enterprise SSO (SAML, OIDC) and audit logging",
      "SOC 2 Type II compliance preparation",
      "White-label option for agencies",
      "Advanced analytics: link equity flow visualization, PageRank simulation",
      "Multi-language support (Cohere multilingual embeddings)",
      "Global CDN for low-latency vector queries",
    ],
    deliverables: ["Plugin SDK published", "SOC 2 audit initiated", "Agency white-label tier", "100+ customer milestone"],
  },
];

const risks = [
  {
    title: "Embedding Model Drift / Relevance Degradation",
    severity: "high",
    icon: <AlertTriangle className="w-5 h-5" />,
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-500/5 border-rose-500/20",
    description: "As content evolves, the embedding model may produce less relevant matches over time. A post about 'AI' written in 2024 has different semantic context than one written in 2022. If embeddings are computed once and never refreshed, relevance degrades.",
    mitigation: [
      "Implement a 90-day embedding refresh cycle. Re-embed all posts quarterly.",
      "Track suggestion acceptance rate per post. If it drops below 20%, flag for re-embedding.",
      "Use embedding model versioning. Store the model_name in the embeddings table. When upgrading models, re-embed in a shadow table and compare before cutover.",
      "Monitor average similarity scores across queries. A declining trend indicates model drift.",
    ],
  },
  {
    title: "Rate Limit Exhaustion During Bulk Processing",
    severity: "high",
    icon: <Shield className="w-5 h-5" />,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/5 border-amber-500/20",
    description: "Processing 10K posts requires ~80K embedding API calls (8 chunks/post). OpenAI's rate limit is 10K RPM for embeddings. At peak, a bulk job could exhaust limits in 8 minutes, causing 429 errors, failed batches, and wasted compute.",
    mitigation: [
      "Implement token-bucket rate limiting with configurable RPM/TPM limits per provider.",
      "Use exponential backoff with jitter: base_delay * 2^attempt + random(0, 1s). Max 5 retries.",
      "Batch embedding requests: OpenAI supports up to 2048 input texts per request. Use this.",
      "Circuit breaker pattern: if error rate exceeds 50% in a 5-minute window, pause the queue and alert.",
      "For self-hosted: no rate limit issue. This is a SaaS-only concern and a selling point for self-hosted.",
    ],
  },
];

export function Phase6Roadmap() {
  return (
    <PhaseSection
      id="phase-6"
      phase={6}
      title="Roadmap & Risk Mitigation"
      subtitle="A 30-week phased development plan from MVP to enterprise scale, with detailed risk analysis and mitigation strategies."
      icon={<Rocket className="w-6 h-6" />}
      accentColor="emerald"
    >
      {/* Roadmap Timeline */}
      <div className="space-y-4">
        {roadmapSteps.map((step, i) => (
          <motion.div
            key={step.phase}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            <Card className={`border ${step.bgColor} bg-card/50 backdrop-blur-sm`}>
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Timeline indicator */}
                  <div className="flex-shrink-0 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${step.color} flex items-center justify-center text-white font-bold text-sm`}>
                      {i + 1}
                    </div>
                    <div className="sm:hidden">
                      <Badge className={`${step.color} text-white hover:${step.color} text-xs`}>{step.phase}</Badge>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                      <div className="hidden sm:block">
                        <Badge className={`${step.color} text-white hover:${step.color} text-xs`}>{step.phase}</Badge>
                      </div>
                      <h3 className="font-semibold text-foreground">{step.title}</h3>
                      <span className="text-xs text-muted-foreground sm:ml-auto">{step.timeline}</span>
                    </div>
                    
                    {/* Feature list */}
                    <ul className="mt-3 space-y-1.5">
                      {step.items.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <div className={`w-1.5 h-1.5 rounded-full ${step.color} mt-1.5 flex-shrink-0`} />
                          {item}
                        </li>
                      ))}
                    </ul>
                    
                    {/* Deliverables */}
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Key Deliverables</p>
                      <div className="flex flex-wrap gap-1.5">
                        {step.deliverables.map((d) => (
                          <Badge key={d} variant="outline" className="text-[10px] font-normal">
                            {d}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Risk Analysis */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-bold text-foreground">Technical Risk Analysis</h3>
        </div>
        
        <div className="space-y-4">
          {risks.map((risk, i) => (
            <motion.div
              key={risk.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <Card className={`border ${risk.bgColor} bg-card/50`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={risk.color}>{risk.icon}</div>
                      <div>
                        <CardTitle className="text-sm font-semibold text-foreground">{risk.title}</CardTitle>
                        <Badge variant="outline" className="text-[10px] mt-1">
                          Severity: {risk.severity}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-6 space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{risk.description}</p>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Mitigation Strategy</p>
                    <ol className="space-y-1.5">
                      {risk.mitigation.map((m, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="flex-shrink-0 w-5 h-5 rounded-md bg-background border border-border flex items-center justify-center text-[10px] font-semibold text-foreground mt-0.5">
                            {j + 1}
                          </span>
                          {m}
                        </li>
                      ))}
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <InsightCard type="info" title="Why This Roadmap Works">
        The 4-phase approach ensures we have <strong>paying customers by Week 8</strong> (WordPress MVP → SaaS transition). LinkWhisper took 18 months to support non-WordPress platforms. By building the connector SDK in V1.0, we can onboard Shopify and Webflow users by Month 4. The self-hosted LLM option in V2.0 is the enterprise differentiator that creates a moat LinkWhisper cannot easily replicate.
      </InsightCard>
    </PhaseSection>
  );
}