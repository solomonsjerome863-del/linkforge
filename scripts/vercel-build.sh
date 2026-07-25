#!/bin/bash
# Vercel build script: auto-detects database type, patches Prisma schema, pushes schema, builds Next.js

echo "=== Detecting database type ==="

# Detect if we're using PostgreSQL (from POSTGRES_PRISMA_URL or DATABASE_URL)
IS_POSTGRES=false
if [ -n "$POSTGRES_PRISMA_URL" ]; then
  IS_POSTGRES=true
  MIGRATION_URL="$POSTGRES_PRISMA_URL"
  echo "Detected POSTGRES_PRISMA_URL - will use PostgreSQL"
elif echo "$DATABASE_URL" | grep -q "^postgres"; then
  IS_POSTGRES=true
  MIGRATION_URL="$DATABASE_URL"
  echo "Detected PostgreSQL DATABASE_URL - will use PostgreSQL"
else
  echo "No PostgreSQL URL detected - keeping SQLite schema"
fi

if [ "$IS_POSTGRES" = true ]; then
  echo "=== Patching Prisma schema from sqlite to postgresql ==="
  sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
  cat prisma/schema.prisma | head -10

  echo "=== Running Prisma schema push to PostgreSQL ==="
  DATABASE_URL="$MIGRATION_URL" npx prisma db push --skip-generate --accept-data-loss 2>&1
  if [ $? -eq 0 ]; then
    echo "✅ Schema pushed to PostgreSQL successfully"
  else
    echo "⚠️ Schema push had issues (tables may already exist)"
  fi
else
  echo "⚠️ Skipping schema push (no PostgreSQL URL available)"
fi

echo "=== Generating Prisma client ==="
npx prisma generate 2>&1

echo "=== Building Next.js ==="
npx next build 2>&1
