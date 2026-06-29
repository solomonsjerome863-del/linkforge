import { NextRequest, NextResponse } from 'next/server';
import {
  SAMPLE_POSTS,
  chunkText,
  computeRelevance,
  generateAnchorText,
  findBestMatchingChunk,
  getConfidence,
} from '@/lib/demo-engine';

// ============================================================
// POST handler — full suggestion pipeline
// ============================================================
export async function POST(req: NextRequest) {
  const startTime = performance.now();

  try {
    const body = await req.json();
    const { text, title } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text field is required and must be a non-empty string' },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    }

    // Step 1: Chunk the input text
    const chunks = chunkText(text);

    // Combine all chunks for relevance scoring
    const fullText = chunks.join(' ');

    // Step 2: Compute relevance to each sample post
    const scored = SAMPLE_POSTS.map((post) => {
      const postText = `${post.title} ${post.excerpt} ${post.content}`;
      const score = computeRelevance(fullText, postText);
      return { post, score };
    });

    // Step 3: Select top 3-5 matches (minimum threshold 0.05)
    const MIN_SCORE = 0.05;
    const topMatches = scored
      .filter((s) => s.score >= MIN_SCORE)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // Step 4: Generate anchor text for each match via LLM
    const suggestions = [];

    for (const match of topMatches) {
      const bestChunk = findBestMatchingChunk(
        chunks,
        match.post.title,
        match.post.excerpt
      );

      const result = await generateAnchorText(
        bestChunk,
        match.post.title,
        match.post.excerpt
      );

      if (result) {
        suggestions.push({
          target_post: {
            id: match.post.id,
            title: match.post.title,
            slug: match.post.slug,
            excerpt: match.post.excerpt,
          },
          relevance_score: Math.round(match.score * 1000) / 1000,
          anchor_text: result.anchor_text,
          context_sentence: result.sentence,
          confidence: getConfidence(match.score),
        });
      }
    }

    const processingTimeMs = Math.round(performance.now() - startTime);

    return NextResponse.json(
      {
        chunks_count: chunks.length,
        processing_time_ms: processingTimeMs,
        suggestions,
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}