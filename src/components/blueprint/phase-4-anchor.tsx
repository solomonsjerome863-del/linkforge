"use client";

import { PhaseSection, InsightCard } from "./phase-section";
import { MessageSquare, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "./code-block";
import { motion } from "framer-motion";

const systemPrompt = `You are an expert SEO copywriter specializing in internal linking. Your task is to generate 
natural, contextually appropriate anchor text for internal links within blog post content.

## STRICT RULES (ALL must be followed):

1. MAXIMUM 5 WORDS per anchor text. This is non-negotiable.
2. The anchor text MUST sound natural when read within the source sentence.
3. NEVER use generic anchors: "click here", "read more", "this article", "learn more", "see this".
4. The anchor text MUST accurately describe the TARGET post's content, not the source.
5. The anchor text should ideally contain a relevant keyword for the TARGET post.
6. Preserve the original source sentence — only identify WHERE in the sentence the link should go.
7. If no natural placement exists in the source content, return NULL instead of forcing it.

## INPUT FORMAT:
You will receive:
- source_content: Excerpt from the post being edited (where the link will be placed)
- source_headings: The headings of the source post for context
- candidates: A list of target posts with their titles, excerpts, and heading context

## OUTPUT FORMAT (JSON array, no markdown):
[
  {
    "target_post_id": "abc123",
    "anchor_text": "canonical URL structure",
    "source_sentence": "Understanding how to implement a proper canonical URL structure can prevent duplicate content issues.",
    "confidence": 0.92,
    "reasoning": "The source discusses URL implementation; the target post specifically covers canonical URLs. 'canonical URL structure' is a 3-word, keyword-rich anchor that reads naturally."
  },
  ...
]

## EXAMPLES:

GOOD: anchor_text = "internal linking strategy" (3 words, descriptive, keyword-rich)
GOOD: anchor_text = "schema markup guide" (3 words, specific, natural)
BAD:  anchor_text = "click here to learn about internal linking" (7 words, generic start)
BAD:  anchor_text = "this" (1 word, no context)
BAD:  anchor_text = "a comprehensive guide to understanding the basics of on-page SEO techniques" (12 words, way too long)
BAD:  anchor_text = "read this article about canonical tags" (6 words, generic, just over limit)

## NOW PROCESS THIS INPUT:`;

const validationCode = `from pydantic import BaseModel, Field, field_validator
from typing import Optional

class AnchorSuggestion(BaseModel):
    """Strict validation to catch LLM hallucinations and format violations."""
    
    target_post_id: str
    anchor_text: str
    source_sentence: str
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str
    
    @field_validator("anchor_text")
    @classmethod
    def validate_anchor_text(cls, v: str) -> str:
        words = v.strip().split()
        
        # Rule 1: Max 5 words
        if len(words) > 5:
            raise ValueError(
                f"Anchor text has {len(words)} words. Maximum is 5. "
                f"Got: '{v}'"
            )
        
        # Rule 2: Min 2 words (avoid "this", "here")
        if len(words) < 2:
            raise ValueError(
                f"Anchor text has only {len(words)} word. Minimum is 2 for context."
            )
        
        # Rule 3: No generic anchors
        generic_patterns = [
            "click here", "read more", "learn more",
            "see this", "check this", "this article",
            "this post", "this page", "find out more"
        ]
        lower = v.lower().strip()
        for pattern in generic_patterns:
            if lower == pattern or lower.startswith(pattern):
                raise ValueError(
                    f"Generic anchor text detected: '{v}'. "
                    f"Must be descriptive of the target content."
                )
        
        return v
    
    @field_validator("source_sentence")
    @classmethod
    def validate_anchor_in_context(cls, v: str, info) -> str:
        """Verify the anchor text actually appears naturally in the sentence."""
        anchor = info.data.get("anchor_text", "")
        # The anchor should be a substring (case-insensitive) of the source
        if anchor.lower() not in v.lower():
            raise ValueError(
                f"Anchor text '{anchor}' must appear within "
                f"the source sentence: '{v}'"
            )
        return v

# Usage:
try:
    suggestion = AnchorSuggestion(**llm_output)
except ValidationError as e:
    # Log and skip this suggestion rather than failing the batch
    logger.warning(f"Invalid anchor from LLM: {e}")
    return None`;

export function Phase4Anchor() {
  return (
    <PhaseSection
      id="phase-4"
      phase={4}
      title="Anchor Text Generation Logic"
      subtitle="A rigorously prompted LLM pipeline that generates natural, SEO-optimized anchor text with Pydantic validation to eliminate hallucinations."
      icon={<MessageSquare className="w-6 h-6" />}
      accentColor="rose"
    >
      {/* System Prompt */}
      <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-rose-500" />
              LLM System Prompt
            </CardTitle>
            <Badge className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/15">
              Production-Ready
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-6">
          <CodeBlock
            title="System Prompt for Anchor Text Generation"
            filename="prompts/anchor_generation.txt"
            language="text"
            code={systemPrompt}
          />
        </CardContent>
      </Card>

      {/* Validation Layer */}
      <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            Pydantic Validation Layer
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <p className="text-sm text-muted-foreground mb-4">
            Never trust raw LLM output. Every anchor suggestion passes through a strict Pydantic model that enforces all business rules before the suggestion reaches the user.
          </p>
          <CodeBlock
            title="Anchor Suggestion Validator"
            filename="validators.py"
            language="python"
            code={validationCode}
          />
        </CardContent>
      </Card>

      {/* Example Outputs */}
      <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Example: Good vs. Bad Outputs</CardTitle>
        </CardHeader>
        <CardContent className="pb-6 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Accepted Anchors</span>
              </div>
              {[
                { anchor: "internal linking strategy", source: "Developing a solid internal linking strategy is crucial for SEO.", words: 3 },
                { anchor: "schema markup guide", source: "For structured data, follow this schema markup guide.", words: 3 },
                { anchor: "page speed optimization", source: "Page speed optimization directly impacts your Core Web Vitals.", words: 3 },
                { anchor: "keyword research tools", source: "We compared the top keyword research tools on the market.", words: 3 },
                { anchor: "content audit process", source: "A proper content audit process reveals hidden opportunities.", words: 3 },
              ].map((item) => (
                <div key={item.anchor} className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      {item.anchor}
                    </code>
                    <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400">{item.words} words</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground italic">&ldquo;{item.source}&rdquo;</p>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-rose-500" />
                <span className="text-sm font-semibold text-rose-700 dark:text-rose-400">Rejected Anchors</span>
              </div>
              {[
                { anchor: "click here", reason: "Generic — violates Rule 3", words: 2 },
                { anchor: "read this comprehensive guide to understanding internal links for SEO", reason: "9 words — violates Rule 1 (max 5)", words: 9 },
                { anchor: "this", reason: "1 word — too vague for context", words: 1 },
                { anchor: "the article we wrote about canonical tags", reason: "7 words — violates Rule 1", words: 7 },
                { anchor: "learn more about keyword research", reason: "Generic start — violates Rule 3", words: 5 },
              ].map((item) => (
                <div key={item.anchor} className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/15">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm font-semibold text-rose-700 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded line-through">
                      {item.anchor}
                    </code>
                    <Badge variant="outline" className="text-[10px] text-rose-600 dark:text-rose-400">{item.words}w</Badge>
                  </div>
                  <p className="text-xs text-rose-600 dark:text-rose-400">{item.reason}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </CardContent>
      </Card>

      <InsightCard type="critical" title="Why Batch, Not Per-Post LLM Calls?">
        Processing all 5 candidates in a <strong>single LLM call</strong> (rather than 5 separate calls) reduces cost by 60-80% because: (1) the system prompt is sent once, (2) input tokens overlap across candidates, and (3) we avoid 4 extra API round-trips. The output JSON array format makes parsing trivial.
      </InsightCard>
    </PhaseSection>
  );
}