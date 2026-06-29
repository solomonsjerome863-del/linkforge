import { NextResponse } from 'next/server';
import { SAMPLE_POSTS } from '@/lib/demo-engine';

// ============================================================
// GET handler — return sample posts (id, title, slug, excerpt only)
// ============================================================
export async function GET() {
  const posts = SAMPLE_POSTS.map(({ id, title, slug, excerpt }) => ({
    id,
    title,
    slug,
    excerpt,
  }));

  return NextResponse.json(
    { posts },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}