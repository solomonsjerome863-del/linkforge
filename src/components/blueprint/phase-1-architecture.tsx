"use client";

import { PhaseSection, InsightCard } from "./phase-section";
import { ArrowRight, Database, Cpu, Globe, Layers, Zap, Shield, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const flowSteps = [
  {
    id: "ingest",
    icon: <Globe className="w-5 h-5" />,
    label: "CMS Source",
    sublabel: "Sitemap / REST API / GraphQL",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  {
    id: "chunk",
    icon: <Layers className="w-5 h-5" />,
    label: "Chunker",
    sublabel: "Paragraph-based + metadata extraction",
    color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  },
  {
    id: "embed",
    icon: <Cpu className="w-5 h-5" />,
    label: "Embedding Model",
    sublabel: "text-embedding-3-small (1536d)",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  {
    id: "vector",
    icon: <Database className="w-5 h-5" />,
    label: "Vector DB",
    sublabel: "Pinecone / Qdrant (HNSW index)",
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  },
  {
    id: "retrieval",
    icon: <Zap className="w-5 h-5" />,
    label: "Retrieval + LLM",
    sublabel: "Vector search → top-K → anchor text gen",
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
  {
    id: "output",
    icon: <RefreshCw className="w-5 h-5" />,
    label: "CMS Update",
    sublabel: "Apply links via plugin API",
    color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  },
];

export function Phase1Architecture() {
  return (
    <PhaseSection
      id="phase-1"
      phase={1}
      title="High-Level System Architecture"
      subtitle="End-to-end data flow from CMS ingestion through vector storage to intelligent link suggestion and automated CMS updates."
      icon={<Globe className="w-6 h-6" />}
      accentColor="emerald"
    >
      {/* Flow Diagram */}
      <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-emerald-500" />
            Data Flow Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {flowSteps.map((step, i) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <div className={cn("relative rounded-xl border p-4 transition-all hover:shadow-md", step.color)}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-background/60 flex items-center justify-center">
                      {step.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{step.label}</p>
                      <Badge variant="outline" className="text-[10px] mt-0.5 font-normal">
                        Step {i + 1}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.sublabel}</p>
                  
                  {/* Arrow connector (not on last item) */}
                  {i < flowSteps.length - 1 && (
                    <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                      <ArrowRight className="w-5 h-5 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Architecture Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/60 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              Ingestion Path
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2 pb-5">
            <ol className="list-decimal list-inside space-y-1.5">
              <li><span className="text-foreground font-medium">Source Connector</span> fetches sitemap.xml or calls CMS REST/GraphQL API</li>
              <li><span className="text-foreground font-medium">Content Normalizer</span> strips HTML, extracts metadata (title, URL, publish date, categories)</li>
              <li><span className="text-foreground font-medium">Deduplication Layer</span> checks URL hash against existing records; skips unchanged content</li>
              <li><span className="text-foreground font-medium">Chunker</span> splits content into semantic chunks (see Phase 3 for strategy)</li>
              <li><span className="text-foreground font-medium">Embedding Worker</span> generates vector embeddings via batched API calls</li>
              <li><span className="text-foreground font-medium">Storage Writer</span> upserts vectors + metadata into Vector DB and relational DB</li>
            </ol>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-500" />
              Suggestion Path (Query Time)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2 pb-5">
            <ol className="list-decimal list-inside space-y-1.5">
              <li><span className="text-foreground font-medium">User Trigger</span> opens &quot;Get Suggestions&quot; for a target post in the dashboard</li>
              <li><span className="text-foreground font-medium">Query Builder</span> constructs an embedding query from the post&apos;s title + excerpt + headings</li>
              <li><span className="text-foreground font-medium">Vector Search</span> queries Pinecone/Qdrant for top-10 semantically similar chunks</li>
              <li><span className="text-foreground font-medium">Candidate Filter</span> deduplicates by post ID, excludes self-links, applies min-similarity threshold</li>
              <li><span className="text-foreground font-medium">LLM Anchor Gen</span> sends candidate context to LLM for natural anchor text generation</li>
              <li><span className="text-foreground font-medium">Result Renderer</span> returns top-5 suggestions with anchor text, score, and exact source sentence</li>
            </ol>
          </CardContent>
        </Card>
      </div>

      <InsightCard type="critical" title="Critical Architecture Rule">
        <strong>Vector Search only for retrieval. LLM only for anchor text generation.</strong> This separation is non-negotiable for cost optimization. A vector query against 50K embeddings costs ~$0.0001. An LLM call for the same retrieval would cost ~$0.50. At 10K posts, that&apos;s a 5000x cost difference per batch run.
      </InsightCard>

      <InsightCard type="tip" title="Anti-Hallucination Guard">
        Every link suggestion must include a <code className="text-xs bg-zinc-200 dark:bg-zinc-700 px-1 rounded">post_id</code> foreign key that references an actual row in the <code className="text-xs bg-zinc-200 dark:bg-zinc-700 px-1 rounded">Posts</code> table. The system never generates a URL string from scratch &mdash; it only returns URLs stored during ingestion.
      </InsightCard>
    </PhaseSection>
  );
}

function cn(...inputs: (string | undefined | false)[]) {
  return inputs.filter(Boolean).join(" ");
}