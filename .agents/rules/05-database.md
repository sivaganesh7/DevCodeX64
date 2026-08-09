# DevCodeX64 — Database Engineering Rules

Applies to database/prisma/ and all Prisma usage in apps/api/ and workers/

Read docs/DATABASE.md for the complete entity design.

---

## Schema Authority

database/prisma/schema.prisma is the single source of truth for the database schema.

Do NOT modify the database by:
- Running raw SQL DDL statements directly
- Using any ORM other than Prisma
- Creating tables outside of migrations

---

## Migration Rules

1. All schema changes go through Prisma migrations.
2. Create migration: pnpm --filter=@devcodex64/api prisma migrate dev --name [description]
3. Never edit a migration file after it has been applied.
4. Migration files are committed to version control.
5. Apply migrations before running tests or starting services.
6. Production migrations are applied as part of the deployment process.

---

## Prisma Client Usage Rules

1. Use Prisma Client for ALL database queries.
2. Raw SQL is ONLY allowed via prisma.$queryRaw with parameterized inputs.
3. Never concatenate user input into query strings.

CORRECT:
```typescript
await prisma.repository.findMany({
  where: { ownerId: userId },
  orderBy: { createdAt: 'desc' },
  take: 20,
  skip: offset,
})
```

WRONG:
```typescript
await prisma.$queryRaw`SELECT * FROM repositories WHERE owner_id = ${userId}` // OK if parameterized
await prisma.$queryRaw(`SELECT * FROM repositories WHERE owner_id = '${userId}'`) // NEVER
```

---

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Prisma model | PascalCase | AnalysisJob |
| Database table | snake_case plural (via @map) | analysis_jobs |
| Column | snake_case (via @map) | created_at |
| Enum value | SCREAMING_SNAKE_CASE | QUEUED, RUNNING |
| Primary key | id (UUID) | @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid |
| Foreign key | entityId + @map | userId, @map("user_id") |

---

## Required Fields on All Models

Every model must have:
- id: UUID primary key
- createdAt: DateTime @default(now())
- updatedAt: DateTime @updatedAt (except read-only tables like AuditLog)

---

## Indexing Requirements

Add indexes to:
- All foreign key columns
- Columns used in WHERE clauses for filtering
- Columns used in ORDER BY for sorting
- Composite indexes where multiple columns are filtered together

pgvector index on code_embeddings.embedding:
```
@@index([embedding], type: IvfFlat(lists: 100), ops: [VectorCosineOps])
```

---

## Transactions

Use transactions for operations that must be atomic:
```typescript
await prisma.$transaction([
  prisma.analysisJob.update({ where: { id }, data: { status: 'COMPLETED' } }),
  prisma.analysisResult.create({ data: resultData }),
])
```

---

## Sensitive Data

1. GitHub tokens: encrypt before storing, decrypt in service layer.
2. Never log database values that contain tokens, passwords, or keys.
3. Never return sensitive fields in API responses (use select to exclude them).

Example:
```typescript
// Exclude sensitive fields from API response
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    username: true,
    email: true,
    // githubToken: false -- do not include
  }
})
```

---

## pgvector Usage

Embedding column type: Unsupported("vector(1536)")

Similarity search query:
```sql
SELECT id, file_path, content, start_line, end_line,
       1 - (embedding <=> $1::vector) AS similarity
FROM code_embeddings
WHERE repository_id = $2
ORDER BY embedding <=> $1::vector
LIMIT 10
```

Always use $queryRaw with parameterized inputs for vector queries.

---

## Data Deletion Policy

- Repository deleted: CASCADE to all related records (files, analyses, embeddings, etc.)
- User deleted: CASCADE to repositories, which cascades further
- AnalysisJob deleted: CASCADE to issues, findings, metrics, risk predictions
- Conversation deleted: CASCADE to messages

Define all cascade rules explicitly in the Prisma schema.

---

## Test Database

For integration tests:
- Use a separate database: DevCodeX64_test
- Set in TEST_DATABASE_URL environment variable
- Reset with: prisma migrate reset --force (test environment only)
- Never run migrate reset on the development or production database
