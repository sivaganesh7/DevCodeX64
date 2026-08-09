# DevCodeX64 — Architecture Rules

Read docs/ARCHITECTURE.md before making any structural decisions.

---

## Service Boundaries (ENFORCED)

### apps/web (React Frontend)
ALLOWED to:
- Render UI components
- Make HTTP requests to apps/api only
- Store access tokens in memory or sessionStorage
- Use TanStack Query for server state

FORBIDDEN from:
- Direct PostgreSQL access
- Direct Redis access
- Direct FastAPI access
- Holding GitHub OAuth tokens
- Holding LLM API keys

---

### apps/api (NestJS Backend)
ALLOWED to:
- All database operations (via Prisma)
- GitHub API calls (using stored encrypted tokens)
- Internal HTTP calls to FastAPI service
- Queue job creation in BullMQ/Redis
- User authentication and authorization

FORBIDDEN from:
- Performing heavy ML computation inline
- Performing RAG retrieval without delegating to FastAPI
- Executing generated code
- Exposing raw GitHub tokens via API responses

---

### apps/ai-service (FastAPI)
ALLOWED to:
- ML feature computation
- Model training and prediction
- Embedding generation
- RAG retrieval and generation
- LLM API calls
- pgvector queries

FORBIDDEN from:
- Accepting direct requests from the React frontend
- Handling user authentication
- Storing GitHub credentials
- Being the primary application backend

---

### workers/
ALLOWED to:
- Process BullMQ jobs
- Database reads/writes via Prisma
- Calling FastAPI for AI/ML tasks
- Cloning repositories (HTTPS only, validated URLs)
- File system operations within temp directories

FORBIDDEN from:
- Executing untrusted code
- Accepting external HTTP requests
- Storing secrets locally

---

## Technology Stack Constraints

The following technologies are FIXED. Do not replace without an ADR:

Frontend: React 18, Vite, TypeScript, Tailwind, shadcn/ui, TanStack Query
Backend: NestJS, TypeScript, Prisma, PostgreSQL, JWT
AI/ML: Python, FastAPI, Scikit-learn, pgvector
Queue: Redis, BullMQ
DevOps: Docker, Docker Compose, GitHub Actions

Do NOT introduce:
- Next.js (banned, use React SPA)
- Express.js as primary backend (NestJS only)
- Celery (use BullMQ)
- Separate vector database (use pgvector)
- GraphQL (REST only, unless explicitly approved via ADR)
- Any technology not in the fixed stack without an ADR

---

## Adding New Dependencies

Before adding a new npm/pip package:
1. Verify it is not already available from existing dependencies
2. Check it is actively maintained
3. Check it has no known critical vulnerabilities
4. Document why it was added in the relevant commit message

---

## Monorepo Package Naming

npm packages must follow @devcodex64/* scope:
- @devcodex64/api
- @devcodex64/web
- @devcodex64/types
- @devcodex64/config
- @devcodex64/shared
- @devcodex64/validation
- @devcodex64/repository-worker
- @devcodex64/analysis-worker
- @devcodex64/embedding-worker

---

## Port Assignments

| Service | Port |
|---------|------|
| apps/web | 5173 |
| apps/api | 3001 |
| apps/ai-service | 8000 |
| PostgreSQL | 5432 |
| Redis | 6379 |

Do not change ports without updating docker-compose.yml, .env.example,
and documenting in DECISIONS.md.
