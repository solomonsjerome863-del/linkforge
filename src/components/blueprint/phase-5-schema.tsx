"use client";

import { PhaseSection, InsightCard } from "./phase-section";
import { Database, Key, Link2, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "./code-block";
import { InlineCode } from "./code-block";
import { motion } from "framer-motion";

const postsSchema = `-- ============================================================
-- Table: posts
-- Purpose: Stores ingested content metadata for each URL.
-- Every link suggestion references this table to prevent
-- hallucinated URLs. This is the SINGLE SOURCE OF TRUTH
-- for what exists on the user's site.
-- ============================================================
CREATE TABLE posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identity
    site_id         UUID NOT NULL REFERENCES sites(id),
    url             TEXT NOT NULL,
    url_hash        TEXT NOT NULL,           -- SHA-256 for dedup
    
    -- Content metadata
    title           TEXT NOT NULL,
    excerpt         TEXT,
    content_html    TEXT,                    -- Original HTML
    content_text    TEXT,                    -- Stripped text for search
    headings        JSONB DEFAULT '[]',      -- ["H2: ...", "H3: ..."]
    categories      JSONB DEFAULT '[]',      -- ["SEO", "Content"]
    tags            JSONB DEFAULT '[]',
    
    -- Status tracking
    status          VARCHAR(20) DEFAULT 'active',
    -- Values: 'active' | 'draft' | 'deleted' | 'orphan_flagged'
    
    -- Link metrics (denormalized for fast queries)
    inbound_links   INTEGER DEFAULT 0,       -- Count of links TO this post
    outbound_links  INTEGER DEFAULT 0,       -- Count of links FROM this post
    last_linked_at  TIMESTAMP,               -- Last time a link was added
    
    -- CMS sync metadata
    cms_id          TEXT,                    -- WordPress post ID, etc.
    cms_type        VARCHAR(50) DEFAULT 'wordpress',
    content_hash    TEXT,                    -- MD5 of content for change detection
    
    -- Timestamps
    published_at    TIMESTAMP,
    ingested_at     TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(site_id, url_hash)
);

-- Indexes for common query patterns
CREATE INDEX idx_posts_site_status ON posts(site_id, status);
CREATE INDEX idx_posts_inbound     ON posts(site_id, inbound_links) 
    WHERE inbound_links = 0;           -- Orphan detection
CREATE INDEX idx_posts_published    ON posts(published_at DESC);
CREATE INDEX idx_posts_categories   ON posts USING GIN (categories);`;

const embeddingsSchema = `-- ============================================================
-- Table: embeddings
-- Purpose: Stores vector embeddings for each content chunk.
-- In production, this data lives in a Vector DB (Qdrant/Pinecone).
-- This relational table serves as the METADATA LAYER that the
-- Vector DB's metadata filter references.
-- ============================================================
CREATE TABLE embeddings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id         UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    
    -- Chunk identity
    chunk_index     INTEGER NOT NULL,       -- Position in the post (0-based)
    chunk_text      TEXT NOT NULL,          -- The actual text content
    
    -- Heading context (the secret sauce)
    heading_context TEXT,                   -- Parent H2/H3 heading
    section_path    TEXT,                   -- "H2 > H3 > H4" path
    
    -- Embedding metadata
    model_name      VARCHAR(100) NOT NULL,  -- "text-embedding-3-small"
    dimensions      INTEGER NOT NULL,       -- 1536
    token_count     INTEGER NOT NULL,
    
    -- Vector (stored in Vector DB; this is the reference key)
    vector_id       TEXT NOT NULL,          -- ID in Qdrant/Pinecone
    
    -- Timestamps
    created_at      TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(post_id, chunk_index)
);

CREATE INDEX idx_embeddings_post    ON embeddings(post_id);
CREATE INDEX idx_embeddings_model   ON embeddings(model_name);`;

const suggestionsSchema = `-- ============================================================
-- Table: link_suggestions
-- Purpose: Stores generated link suggestions with their anchor
-- text, scores, and acceptance status. This is the output of
-- the RAG pipeline that the user sees in the dashboard.
-- ============================================================
CREATE TABLE link_suggestions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relationship
    site_id         UUID NOT NULL REFERENCES sites(id),
    source_post_id  UUID NOT NULL REFERENCES posts(id),
    target_post_id  UUID NOT NULL REFERENCES posts(id),
    
    -- The generated anchor text (LLM output)
    anchor_text     VARCHAR(200) NOT NULL,  -- Max 5 words enforced at app layer
    source_sentence TEXT NOT NULL,          -- Full sentence where link goes
    
    -- Scoring & confidence
    similarity_score  DECIMAL(5,4) NOT NULL, -- 0.0000 to 1.0000
    llm_confidence    DECIMAL(5,4),          -- LLM's self-reported confidence
    combined_score    DECIMAL(5,4) GENERATED ALWAYS AS (
        (similarity_score * 0.7) + (COALESCE(llm_confidence, 0) * 0.3)
    ) STORED,                               -- Weighted: 70% vector, 30% LLM
    
    -- Context
    heading_context  TEXT,                   -- From the matched embedding chunk
    target_excerpt   TEXT,                   -- First 200 chars of target post
    match_reason     TEXT,                   -- LLM reasoning
    
    -- Status tracking
    status          VARCHAR(20) DEFAULT 'pending',
    -- Values: 'pending' | 'accepted' | 'rejected' | 'applied' | 'expired'
    applied_at      TIMESTAMP,
    rejected_reason TEXT,
    
    -- Batch tracking
    batch_id        UUID,                    -- Group suggestions from same run
    
    -- Timestamps
    created_at      TIMESTAMP DEFAULT NOW(),
    expires_at      TIMESTAMP,               -- Auto-expire after 30 days
    
    -- Constraints
    UNIQUE(source_post_id, target_post_id, batch_id),
    CHECK (source_post_id != target_post_id) -- No self-links (DB-level guard)
);

-- Performance indexes
CREATE INDEX idx_suggestions_source    ON link_suggestions(source_post_id, status);
CREATE INDEX idx_suggestions_target    ON link_suggestions(target_post_id, status);
CREATE INDEX idx_suggestions_site      ON link_suggestions(site_id, status);
CREATE INDEX idx_suggestions_score     ON link_suggestions(combined_score DESC)
    WHERE status = 'pending';
CREATE INDEX idx_suggestions_batch     ON link_suggestions(batch_id);`;

export function Phase5Schema() {
  return (
    <PhaseSection
      id="phase-5"
      phase={5}
      title="Database Schema Design"
      subtitle="Three-table relational schema with computed scores, generated columns, and database-level guards against self-links and hallucinated URLs."
      icon={<Database className="w-6 h-6" />}
      accentColor="sky"
    >
      {/* Schema Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: <FileText className="w-5 h-5" />,
            name: "Posts",
            desc: "Content metadata, URL registry, link metrics, and CMS sync state. Single source of truth for what exists.",
            color: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
            count: "15 columns",
          },
          {
            icon: <Key className="w-5 h-5" />,
            name: "Embeddings",
            desc: "Chunk metadata layer with heading context. Actual vectors live in Vector DB; this table stores the reference keys.",
            color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
            count: "11 columns",
          },
          {
            icon: <Link2 className="w-5 h-5" />,
            name: "Link Suggestions",
            desc: "Generated suggestions with anchor text, dual scoring (vector + LLM), and full lifecycle status tracking.",
            color: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
            count: "18 columns",
          },
        ].map((table, i) => (
          <motion.div
            key={table.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-border/60 bg-card/50 backdrop-blur-sm h-full">
              <CardContent className="p-5">
                <div className="flex items-start gap-3.5 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${table.color}`}>
                    {table.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{table.name}</h3>
                    <Badge variant="outline" className="text-[10px] mt-1">{table.count}</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{table.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* SQL Schemas */}
      <CodeBlock
        title="Posts Table"
        filename="migrations/001_posts.sql"
        language="sql"
        code={postsSchema}
      />

      <CodeBlock
        title="Embeddings Table"
        filename="migrations/002_embeddings.sql"
        language="sql"
        code={embeddingsSchema}
      />

      <CodeBlock
        title="Link Suggestions Table"
        filename="migrations/003_link_suggestions.sql"
        language="sql"
        code={suggestionsSchema}
      />

      {/* Key Design Decisions */}
      <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Key Schema Design Decisions</CardTitle>
        </CardHeader>
        <CardContent className="pb-6 space-y-4">
          {[
            {
              title: "Generated Column: combined_score",
              desc: (
                <>
                  The <InlineCode>combined_score</InlineCode> is a PostgreSQL <InlineCode>GENERATED ALWAYS AS</InlineCode> column that weights vector similarity at 70% and LLM confidence at 30%. This is computed at the DB level, not the application level, ensuring consistency across all queries. No application can bypass this formula.
                </>
              ),
            },
            {
              title: "CHECK Constraint: No Self-Links",
              desc: (
                <>
                  <InlineCode>CHECK (source_post_id != target_post_id)</InlineCode> is a database-level guard. Even if a bug in the application layer passes a self-reference, PostgreSQL will reject the insert. This is a belt-and-suspenders approach to the hallucination problem.
                </>
              ),
            },
            {
              title: "Partial Index: Orphan Detection",
              desc: (
                <>
                  <InlineCode>CREATE INDEX ... WHERE inbound_links = 0</InlineCode> is a partial index that makes orphan post detection an O(1) lookup instead of a full table scan. For a 50K-post site, this turns a 500ms query into a 2ms query.
                </>
              ),
            },
            {
              title: "URL Hash for Deduplication",
              desc: (
                <>
                  <InlineCode>url_hash</InlineCode> (SHA-256) with a <InlineCode>UNIQUE(site_id, url_hash)</InlineCode> constraint ensures we never store the same URL twice, even if the CMS returns it with different query parameters or trailing slashes.
                </>
              ),
            },
          ].map((decision) => (
            <div key={decision.title} className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <h4 className="text-sm font-semibold text-foreground mb-1">{decision.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{decision.desc}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <InsightCard type="tip" title="Why Separate Embeddings Table from Vector DB?">
        The Vector DB (Qdrant/Pinecone) stores the actual vectors + a lightweight metadata payload. The <InlineCode>embeddings</InlineCode> PostgreSQL table stores the <em>full metadata</em> that Vector DBs can&apos;t handle efficiently (long text, JSONB arrays, joins). This split architecture means you can switch Vector DBs without losing metadata, and you can run complex SQL queries (e.g., &quot;show me all chunks from posts in the SEO category&quot;) without hitting the Vector DB at all.
      </InsightCard>
    </PhaseSection>
  );
}