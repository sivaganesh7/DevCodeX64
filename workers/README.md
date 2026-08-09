# Workers — Background Job Processors

BullMQ-based background workers for async processing.

## Workers

| Worker | Responsibility |
|--------|---------------|
| \epository-worker\ | Repository cloning, ingestion, initial processing |
| \nalysis-worker\ | Code analysis, security scans, dependency analysis, metrics |
| \embedding-worker\ | Text chunking, embedding generation, vector storage |

## Running

\\\ash
# Run individual worker
pnpm --filter=@DevCodeX64/repository-worker dev
pnpm --filter=@DevCodeX64/analysis-worker dev
pnpm --filter=@DevCodeX64/embedding-worker dev
\\\
"@

# --- packages -----------------------------------------------------------------

mf "packages/types/package.json" @"
{
  "name": "@DevCodeX64/types",
  "version": "1.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.5.4"
  }
}
