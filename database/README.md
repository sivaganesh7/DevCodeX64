# Database — PostgreSQL + pgvector

Prisma ORM schema and migrations for DevCodeX64.

## Setup

\\\ash
# Generate Prisma client
pnpm db:generate

# Run migrations (development)
pnpm db:migrate:dev

# Run migrations (production)
pnpm db:migrate

# Seed database
pnpm db:seed

# Open Prisma Studio
pnpm db:studio
\\\

## Extensions Required

- \pgvector\ — Vector similarity search
- \pg_trgm\ — Trigram text search
- \uuid-ossp\ — UUID generation
