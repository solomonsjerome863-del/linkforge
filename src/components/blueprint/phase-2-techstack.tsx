"use client";

import { PhaseSection, InsightCard } from "./phase-section";
import { Server, Monitor, Database, Cpu, MessageSquare, Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface TechCardProps {
  icon: React.ReactNode;
  name: string;
  category: string;
  categoryColor: string;
  choices: string[];
  recommended: string;
  justification: string;
  delay?: number;
}

function TechCard({ icon, name, category, categoryColor, choices, recommended, justification, delay = 0 }: TechCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card className="border-border/60 bg-card/50 backdrop-blur-sm h-full hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start gap-3.5 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${categoryColor}`}>
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm">{name}</h3>
              <Badge variant="outline" className="text-[10px] mt-1">{category}</Badge>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Evaluated</p>
              <div className="flex flex-wrap gap-1.5">
                {choices.map((c) => (
                  <span key={c} className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Recommended</p>
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{recommended}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{justification}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

const techStack: TechCardProps[] = [
  {
    icon: <Monitor className="w-5 h-5" />,
    name: "Frontend Dashboard",
    category: "Presentation Layer",
    categoryColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    choices: ["Next.js", "Nuxt", "SvelteKit", "Remix"],
    recommended: "Next.js 15 (App Router)",
    justification: "Server components reduce client bundle. Built-in API routes for BFF pattern. Excellent DX with TypeScript. shadcn/ui for rapid, accessible component development. SEO-optimized for our own marketing site.",
    delay: 0,
  },
  {
    icon: <Server className="w-5 h-5" />,
    name: "Backend API",
    category: "Service Layer",
    categoryColor: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    choices: ["FastAPI", "Express", "NestJS", "Go Fiber", "Rust Actix"],
    recommended: "Python FastAPI + Celery",
    justification: "Native async support. Pydantic for strict request/response validation. Celery for reliable background task processing. Massive ML/AI ecosystem (sentence-transformers, torch). Type hints make it self-documenting.",
    delay: 0.05,
  },
  {
    icon: <Database className="w-5 h-5" />,
    name: "Vector Database",
    category: "Embedding Storage",
    categoryColor: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    choices: ["Pinecone", "Qdrant", "Weaviate", "Milvus", "pgvector"],
    recommended: "Qdrant (self-hosted) + Pinecone (managed)",
    justification: "Dual-tier strategy: Qdrant for self-hosted/privacy-first users (Docker deploy), Pinecone Serverless for managed SaaS customers. Both support metadata filtering, HNSW indexing, and batch upsert. Qdrant's gRPC API is 3x faster than REST.",
    delay: 0.1,
  },
  {
    icon: <Database className="w-5 h-5" />,
    name: "Relational Database",
    category: "Metadata & Users",
    categoryColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    choices: ["PostgreSQL", "MySQL", "SQLite", "MongoDB"],
    recommended: "PostgreSQL 16",
    justification: "JSONB for flexible post metadata. pg_trgm for fuzzy title matching. Row-level security for multi-tenancy. Proven at scale. Prisma ORM provides type-safe queries. Can coexist with pgvector for single-DB deployments.",
    delay: 0.15,
  },
  {
    icon: <MessageSquare className="w-5 h-5" />,
    name: "Queue / Worker",
    category: "Async Processing",
    categoryColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    choices: ["SQS + Lambda", "RabbitMQ", "Redis + Bull", "Celery + Redis", "Kafka"],
    recommended: "AWS SQS + Lambda (SaaS) / Celery + Redis (self-hosted)",
    justification: "SQS for managed SaaS: unlimited scale, pay-per-use, built-in dead-letter queues. Lambda workers process individual chunks. Celery+Redis for self-hosted: simpler infrastructure, in-process embedding computation. Both support rate-limiting backoff.",
    delay: 0.2,
  },
  {
    icon: <Brain className="w-5 h-5" />,
    name: "LLM Provider",
    category: "Anchor Text Generation",
    categoryColor: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    choices: ["OpenAI GPT-4o", "Anthropic Claude", "Llama 3 (local)", "Mistral"],
    recommended: "GPT-4o-mini (default) + Llama 3.1 70B (self-hosted option)",
    justification: "GPT-4o-mini: $0.15/1M input tokens — 60% cheaper than GPT-4, sufficient for anchor text. Llama 3.1 via vLLM/Ollama for privacy-first deployments. Ollama single-command setup. System prompt engineering ensures consistent output format.",
    delay: 0.25,
  },
];

export function Phase2TechStack() {
  return (
    <PhaseSection
      id="phase-2"
      phase={2}
      title="Tech Stack Recommendation"
      subtitle="A purpose-built stack optimized for AI-powered content processing, vector search at scale, and multi-tenant SaaS delivery."
      icon={<Server className="w-6 h-6" />}
      accentColor="cyan"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {techStack.map((tech) => (
          <TechCard key={tech.name} {...tech} />
        ))}
      </div>

      <InsightCard type="info" title="Why Not a Single Vector DB?">
        The dual-tier strategy (Qdrant for self-hosted, Pinecone for managed) is a <strong>competitive moat</strong>. LinkWhisper only works with WordPress. By offering a self-hosted vector DB option, we can sell to enterprise customers with strict data residency requirements (GDPR, HIPAA, SOC2) who would never send content to a third-party managed service.
      </InsightCard>

      <InsightCard type="warning" title="Embedding Model Decision (See Phase 3)">
        The embedding model is technically part of the stack but architecturally belongs to Phase 3. We recommend <strong>OpenAI text-embedding-3-small</strong> for the SaaS tier and <strong>all-MiniLM-L6-v2</strong> (via sentence-transformers) for self-hosted. Both produce 384-1536d vectors compatible with HNSW indexing.
      </InsightCard>
    </PhaseSection>
  );
}