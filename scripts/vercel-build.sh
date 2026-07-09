#!/bin/bash
# Vercel build script: pushes Prisma schema to Neon, then builds Next.js
# Uses POSTGRES_PRISMA_URL (direct connection) for schema migrations

echo "=== Running Prisma schema push ==="

# Use POSTGRES_PRISMA_URL for migrations (bypasses pgbouncer)
if [ -n "$POSTGRES_PRISMA_URL" ]; then
  echo "Using POSTGRES_PRISMA_URL for schema push..."
  DATABASE_URL="$POSTGRES_PRISMA_URL" npx prisma db push --skip-generate --accept-data-loss 2>&1
  if [ $? -eq 0 ]; then
    echo "✅ Schema pushed successfully"
  else
    echo "⚠️ Schema push had issues (tables may already exist)"
  fi
else
  echo "⚠️ POSTGRES_PRISMA_URL not found, skipping schema push"
fi

echo "=== Generating Prisma client ==="
npx prisma generate 2>&1

echo "=== Building Next.js ==="
npx next build 2>&1