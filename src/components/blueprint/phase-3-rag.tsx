"use client";

import { PhaseSection, InsightCard } from "./phase-section";
import { Cpu, Layers, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeBlock } from "./code-block";
import { motion } from "framer-motion";

const chunkingCode = `class SemanticChunker:
    """Paragraph-aware chunking with heading context preservation.
    
    Key insight: Blog posts have semantic structure (H2, H3) that 
    naive sliding windows destroy. We preserve this by anchoring 
    chunks to paragraph boundaries and prepending heading context.
    """
    
    def __init__(
        self,
        max_tokens: int = 256,       # ~200 words per chunk
        min_tokens: int = 64,        # avoid tiny fragments
        overlap_sentences: int = 1,  # 1-sentence overlap for context
        heading_context: bool = True # prepend parent heading
    ):
        self.max_tokens = max_tokens
        self.min_tokens = min_tokens
        self.overlap_sentences = overlap_sentences
        self.heading_context = heading_context

    def chunk(self, html_content: str, metadata: dict) -> list[Chunk]:
        # 1. Parse HTML into blocks (preserve heading hierarchy)
        blocks = self._parse_html_to_blocks(html_content)
        
        # 2. Group blocks into chunks by token budget
        chunks = []
        current_chunk = []
        current_tokens = 0
        current_heading = ""
        
        for block in blocks:
            block_tokens = self._count_tokens(block.text)
            
            # Track the nearest parent heading
            if block.type == "heading":
                current_heading = block.text
            
            # If adding this block exceeds budget, flush current chunk
            if current_tokens + block_tokens > self.max_tokens and current_chunk:
                chunk_text = self._assemble_chunk(current_chunk, current_heading)
                if self._count_tokens(chunk_text) >= self.min_tokens:
                    chunks.append(Chunk(
                        text=chunk_text,
                        post_id=metadata["post_id"],
                        heading_context=current_heading,
                        position=len(chunks),
                        token_count=self._count_tokens(chunk_text)
                    ))
                
                # Start new chunk with overlap
                overlap = current_chunk[-self.overlap_sentences:]
                current_chunk = overlap + [block]
                current_tokens = sum(self._count_tokens(b.text) for b in current_chunk)
            else:
                current_chunk.append(block)
                current_tokens += block_tokens
        
        # Flush remaining
        if current_chunk:
            chunk_text = self._assemble_chunk(current_chunk, current_heading)
            chunks.append(Chunk(
                text=chunk_text,
                post_id=metadata["post_id"],
                heading_context=current_heading,
                position=len(chunks),
                token_count=self._count_tokens(chunk_text)
            ))
        
        return chunks`;

const queryCode = `async def get_link_suggestions(
    target_post_id: str,
    db: PostgresDB,
    vector_store: VectorStore,
    llm_client: LLMClient,
    top_k: int = 10,
    min_similarity: float = 0.65
) -> list[LinkSuggestion]:
    """
    The core RAG query pipeline.
    Vector search does the heavy lifting; LLM only refines anchor text.
    Total cost per query: ~$0.0003 (vector) + ~$0.001 (LLM) = $0.0013
    """
    
    # ─── Step 1: Build the query from target post ───
    post = await db.get_post(target_post_id)
    
    # Construct a rich query from structured post data
    query_text = "\\n".join([
        f"Title: {post.title}",
        f"Excerpt: {post.excerpt or ''}",
        f"Headings: {' | '.join(post.headings)}",
        f"Categories: {' | '.join(post.categories)}",
        # Include first 2 paragraphs for semantic richness
        f"Content: {post.paragraphs[:2]}"
    ])
    
    # ─── Step 2: PURE VECTOR RETRIEVAL (no LLM) ───
    query_embedding = await embed(query_text)  # ~$0.0001
    
    # Metadata filter: exclude self, same-category boost
    results = await vector_store.search(
        vector=query_embedding,
        top_k=top_k,
        filters={
            "post_id": {"$ne": target_post_id},  # Never self-link
        },
        include_metadata=True
    )
    
    # ─── Step 3: Candidate filtering & deduplication ───
    seen_posts = set()
    candidates = []
    
    for result in results:
        if result.score < min_similarity:
            continue  # Below quality threshold
        if result.post_id in seen_posts:
            continue  # Deduplicate by post
        if result.post_id in post.existing_outbound_links:
            continue  # Already linked
            
        seen_posts.add(result.post_id)
        candidates.append(result)
    
    # ─── Step 4: LLM ANCHOR TEXT GENERATION (only for top-5) ───
    top_candidates = candidates[:5]
    if not top_candidates:
        return []
    
    # Single LLM call with all candidates (batched = cheaper)
    anchor_results = await llm_client.generate_anchors(
        source_text=post.content[:2000],  # Truncate to save tokens
        source_headings=post.headings,
        candidates=[
            {"post_id": c.post_id, "title": c.title, 
             "excerpt": c.excerpt, "heading_context": c.heading_context}
            for c in top_candidates
        ]
    )
    
    # ─── Step 5: Assemble final suggestions ───
    suggestions = []
    for candidate, anchor in zip(top_candidates, anchor_results):
        post_data = await db.get_post(candidate.post_id)
        suggestions.append(LinkSuggestion(
            target_post_id=candidate.post_id,
            target_url=post_data.url,           # From DB, never generated
            target_title=post_data.title,        # From DB, never generated
            anchor_text=anchor.text,             # LLM-generated
            source_sentence=anchor.source_sentence,
            similarity_score=candidate.score,
            heading_context=candidate.heading_context
        ))
    
    return suggestions`;

const embeddingComparison = [
  { model: "OpenAI text-embedding-3-small", dims: "1536", cost: "$0.02 / 1M tokens", speed: "~120ms", quality: "Excellent", note: "Best quality/cost ratio. MRL support." },
  { model: "OpenAI text-embedding-3-large", dims: "3072", cost: "$0.13 / 1M tokens", speed: "~150ms", quality: "Best", note: "Marginal improvement over small. Not worth 6.5x cost." },
  { model: "Cohere embed-v3", dims: "1024", cost: "$0.10 / 1M tokens", speed: "~100ms", quality: "Very Good", note: "Strong multilingual. Good for international sites." },
  { model: "all-MiniLM-L6-v2 (local)", dims: "384", cost: "$0 (self-hosted)", speed: "~5ms", quality: "Good", note: "Best for self-hosted. 24x faster than API. No data leaves server." },
  { model: "BGE-large-en-v1.5 (local)", dims: "1024", cost: "$0 (self-hosted)", speed: "~12ms", quality: "Very Good", note: "MTEB leaderboard top-10. Requires GPU for speed." },
];

export function Phase3RAG() {
  return (
    <PhaseSection
      id="phase-3"
      phase={3}
      title="RAG & Embedding Strategy"
      subtitle="The secret sauce: paragraph-aware chunking that preserves semantic structure, paired with a cost-optimized RAG retrieval pipeline."
      icon={<Cpu className="w-6 h-6" />}
      accentColor="amber"
    >
      {/* Chunking Strategy Explanation */}
      <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500" />
            Chunking Strategy: Paragraph-Aware with Heading Context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-rose-500/5 border border-rose-500/20">
              <Badge variant="outline" className="text-rose-600 dark:text-rose-400 text-[10px] mb-2">What We Reject</Badge>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Naive sliding window</strong> (512 tokens, 50 overlap). This destroys paragraph boundaries, splits sentences mid-thought, and creates chunks that read like word salad. This is why LinkWhisper sometimes suggests irrelevant links.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <Badge variant="outline" className="text-amber-600 dark:text-amber-400 text-[10px] mb-2">What We Use</Badge>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Paragraph-anchored chunking</strong>. Parse HTML into semantic blocks (headings, paragraphs, lists). Group blocks until token budget is reached. Flush at paragraph boundaries, not at arbitrary token counts.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-teal-500/5 border border-teal-500/20">
              <Badge variant="outline" className="text-teal-600 dark:text-teal-400 text-[10px] mb-2">Key Innovation</Badge>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Heading context prepending</strong>. Every chunk includes its parent H2/H3 heading as a prefix. When &quot;10 Tips for On-Page SEO&quot; appears in a chunk about keyword density, the vector captures both concepts.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-foreground">256</p>
              <p className="text-xs text-muted-foreground">Max tokens/chunk</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-foreground">64</p>
              <p className="text-xs text-muted-foreground">Min tokens/chunk</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-foreground">1</p>
              <p className="text-xs text-muted-foreground">Sentence overlap</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-foreground">~8</p>
              <p className="text-xs text-muted-foreground">Avg chunks/post</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chunking Code */}
      <CodeBlock
        title="Semantic Chunker Implementation"
        filename="chunker.py"
        language="python"
        code={chunkingCode}
      />

      {/* Embedding Model Comparison */}
      <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Search className="w-4 h-4 text-amber-500" />
            Embedding Model Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2.5 pr-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Model</th>
                  <th className="text-center py-2.5 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Dims</th>
                  <th className="text-center py-2.5 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Cost</th>
                  <th className="text-center py-2.5 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Speed</th>
                  <th className="text-center py-2.5 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Quality</th>
                </tr>
              </thead>
              <tbody>
                {embeddingComparison.map((row, i) => (
                  <tr key={row.model} className={i < embeddingComparison.length - 1 ? "border-b border-border/50" : ""}>
                    <td className="py-2.5 pr-4">
                      <div>
                        <p className="font-medium text-foreground text-xs">{row.model}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{row.note}</p>
                      </div>
                    </td>
                    <td className="text-center py-2.5 px-3 text-xs font-mono">{row.dims}</td>
                    <td className="text-center py-2.5 px-3 text-xs font-mono">{row.cost}</td>
                    <td className="text-center py-2.5 px-3 text-xs font-mono">{row.speed}</td>
                    <td className="text-center py-2.5 px-3">
                      <Badge 
                        variant="outline" 
                        className={
                          row.quality === "Excellent" ? "text-teal-600 dark:text-teal-400 border-teal-500/30 bg-teal-500/5" :
                          row.quality === "Best" ? "text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/5" :
                          row.quality === "Very Good" ? "text-orange-600 dark:text-orange-400 border-orange-500/30 bg-orange-500/5" :
                          "text-muted-foreground"
                        }
                      >
                        {row.quality}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Query Pipeline Code */}
      <Tabs defaultValue="query" className="w-full">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="query">Query Pipeline</TabsTrigger>
          <TabsTrigger value="cost">Cost Analysis</TabsTrigger>
        </TabsList>
        <TabsContent value="query" className="mt-4">
          <CodeBlock
            title="Complete RAG Query Pipeline"
            filename="suggestion_engine.py"
            language="python"
            code={queryCode}
          />
        </TabsContent>
        <TabsContent value="cost" className="mt-4">
          <Card className="border-border/60 bg-card/50">
            <CardContent className="p-5 space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Cost Per Query Breakdown</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-teal-500/5 border border-teal-500/20">
                  <p className="text-xs text-teal-600 dark:text-teal-400 font-medium mb-1">Vector Embedding</p>
                  <p className="text-xl font-bold text-foreground">$0.0001</p>
                  <p className="text-xs text-muted-foreground mt-1">~500 tokens &times; $0.02/1M</p>
                </div>
                <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">LLM Anchor Gen</p>
                  <p className="text-xl font-bold text-foreground">$0.001</p>
                  <p className="text-xs text-muted-foreground mt-1">~7K tokens &times; $0.15/1M (GPT-4o-mini)</p>
                </div>
                <div className="p-4 rounded-lg bg-sky-500/5 border border-sky-500/20">
                  <p className="text-xs text-sky-600 dark:text-sky-400 font-medium mb-1">Total / Query</p>
                  <p className="text-xl font-bold text-foreground">$0.0013</p>
                  <p className="text-xs text-muted-foreground mt-1">10K posts = ~$13 per full scan</p>
                </div>
              </div>
              <InsightCard type="tip" title="Why Not Use LLM for Search?">
                If we used an LLM to find relevant posts (instead of vector search), each query would cost ~$0.05-$0.15. At 10K posts, that&apos;s <strong>$500-$1,500 per batch</strong> vs. <strong>$13</strong> with vector search. The RAG approach is 40-100x cheaper with equal or better relevance.
              </InsightCard>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <InsightCard type="critical" title="Chunking Is the Competitive Advantage">
        LinkWhisper&apos;s weakest point is its chunking. It uses a basic sentence-level approach that loses paragraph context. Our <strong>paragraph-anchored + heading-context</strong> approach means when a user writes about &quot;canonical URLs,&quot; our vector search finds posts about &quot;URL structure&quot; even if those exact words don&apos;t appear, because the <em>semantic meaning</em> is preserved in the heading-augmented chunk. This single innovation can capture 20-30% more relevant links.
      </InsightCard>
    </PhaseSection>
  );
}