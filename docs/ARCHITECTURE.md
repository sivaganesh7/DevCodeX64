# DevCodeX64 — System Architecture

**Version:** 1.0.0
**Last Updated:** 2026-08-09
**Status:** Phase 0 — Architecture Foundation

---

## 1. Architectural Overview

DevCodeX64 uses a service-oriented architecture with three application tiers,
separated by responsibility, with asynchronous job processing via Redis/BullMQ.

```
                        USER BROWSER
                             |
                         HTTPS/WSS
                             |
                    +-----------------+
                    |   React + Vite  |
                    |   (apps/web)    |
                    +-----------------+
                             |
                         REST API
                             |
                    +-----------------+
                    |  NestJS Backend |
                    |   (apps/api)    |
                    +-----------------+
                    |       |        |
               PostgreSQL  Redis  GitHub API
               + pgvector  BullMQ
                    |       |
                    |    Workers
                    |   /   |   \
                    | repo  ana  emb
                    | wrk   wrk  wrk
                    |       |
                    +-------+-------+
                            |
                   +-----------------+
                   | FastAPI AI/ML   |
                   | (apps/ai-service)|
                   +-----------------+
                   |       |         |
                  RAG      ML     AI Agent
```

---

## 2. Service Boundaries

### apps/web — React Frontend

**Technology:** React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui

**Owns:**
- All user interface components and pages
- Client-side application state (TanStack Query)
- Routing (React Router)
- Form validation (React Hook Form + Zod)
- API communication (Axios to NestJS only)

**Must NOT:**
- Access PostgreSQL directly
- Access Redis directly
- Hold GitHub tokens
- Hold LLM API keys
- Communicate directly with the AI service
- Communicate directly with workers

---

### apps/api — NestJS Backend

**Technology:** Node.js 20, NestJS, TypeScript, Prisma, JWT

**Port:** 3001

**Owns:**
- Authentication (JWT + GitHub OAuth)
- User management
- GitHub integration (API calls, OAuth)
- Repository metadata management
- REST API layer for all client-facing operations
- Analysis job creation and status tracking
- Webhook ingestion (GitHub)
- Communication with FastAPI AI service
- All database access (through Prisma)
- Audit logging
- Authorization (guards, RBAC)

**Must NOT:**
- Perform heavy ML computation
- Perform RAG retrieval internally
- Execute generated code

---

### apps/ai-service — FastAPI AI/ML Service

**Technology:** Python 3.11+, FastAPI, Scikit-learn, LangChain-compatible

**Port:** 8000

**Owns:**
- Machine learning model training and prediction
- Feature extraction from code metrics
- Embedding generation
- RAG pipeline (chunking, retrieval, generation)
- AI code review
- AI engineering agent (orchestrator)
- Test generation
- Documentation generation

**Must NOT:**
- Be a replacement for the NestJS backend
- Handle user authentication
- Accept direct requests from the React frontend
- Store GitHub credentials

---

### workers/ — Background Workers

**Technology:** Node.js, BullMQ, Prisma

**Workers:**

| Worker | Queue | Responsibility |
|--------|-------|----------------|
| repository-worker | repository_ingestion | Clone/fetch repo, extract file tree |
| analysis-worker | code_analysis, security_scan, dependency_scan | Run static analysis |
| embedding-worker | embedding_generation, ml_prediction | Call AI service for embeddings/ML |

---

## 3. Infrastructure

### PostgreSQL + pgvector

- Primary relational database
- pgvector extension for embedding storage and similarity search
- All structured application data

### Redis + BullMQ

- Job queue backend
- Cache layer for frequently accessed data
- Session storage (optional)

### GitHub

- OAuth provider for user authentication
- Repository data source (REST API v3 + GraphQL)
- Webhook receiver for PR automation

---

## 4. Communication Patterns

| From | To | Protocol |
|------|-----|----------|
| Browser | NestJS API | REST (HTTPS) |
| NestJS API | PostgreSQL | Prisma ORM (TCP) |
| NestJS API | Redis | BullMQ / ioredis (TCP) |
| NestJS API | GitHub API | REST HTTPS |
| NestJS API | FastAPI AI service | REST HTTP (internal) |
| Workers | PostgreSQL | Prisma ORM |
| Workers | FastAPI AI service | REST HTTP (internal) |
| FastAPI AI service | PostgreSQL | asyncpg / SQLAlchemy (pgvector) |
| FastAPI AI service | LLM APIs | HTTPS (OpenAI / Anthropic / Gemini) |

---

## 5. Deployment Topology (Development)

```
docker-compose up

Services:
  postgres    ? localhost:5432
  redis       ? localhost:6379
  api         ? localhost:3001
  ai-service  ? localhost:8000
  web         ? localhost:5173
```

Workers run as separate Node.js processes or additional containers.

---

## 6. Folder Structure

```
DevCodeX64/
|
+-- apps/
|   +-- web/              React frontend (Vite)
|   +-- api/              NestJS backend
|   +-- ai-service/       FastAPI AI/ML service
|
+-- workers/
|   +-- repository-worker/
|   +-- analysis-worker/
|   +-- embedding-worker/
|
+-- packages/
|   +-- types/            Shared TypeScript types
|   +-- config/           Shared configuration constants
|   +-- validation/       Shared Zod schemas
|   +-- shared/           Shared utilities
|
+-- database/
|   +-- prisma/
|       +-- schema.prisma
|       +-- migrations/
|       +-- seed.ts
|
+-- tests/
|   +-- e2e/
|   +-- integration/
|   +-- security/
|   +-- fixtures/
|
+-- infrastructure/
|   +-- docker/
|   +-- github/
|   +-- nginx/
|   +-- deployment/
|
+-- scripts/
+-- docs/
+-- .agents/
|   +-- rules/
+-- .github/
+-- docker-compose.yml
+-- package.json
+-- pnpm-workspace.yaml
+-- .env.example
+-- .gitignore
+-- README.md
+-- LICENSE
```

---

## 7. NestJS Module Structure

```
apps/api/src/
+-- auth/               Authentication, JWT, GitHub OAuth
+-- users/              User management
+-- github/             GitHub API integration
+-- repositories/       Repository CRUD, metadata
+-- analysis/           Analysis job management
+-- security/           Security findings API
+-- dependencies/       Dependency analysis API
+-- risk/               ML risk prediction API
+-- issues/             Issue aggregation and filtering
+-- assistant/          RAG AI assistant API
+-- code-review/        AI code review API
+-- test-generation/    Test generation API
+-- documentation/      Documentation generation API
+-- pull-requests/      PR analysis API
+-- webhooks/           GitHub webhook handler
+-- jobs/               BullMQ job definitions
+-- health/             Health check endpoints
+-- common/
    +-- guards/
    +-- interceptors/
    +-- filters/
    +-- decorators/
    +-- pipes/
    +-- middleware/
```

---

## 8. FastAPI AI Service Structure

```
apps/ai-service/app/
+-- main.py
+-- api/
|   +-- routes/
|       +-- health.py
|       +-- embed.py
|       +-- rag.py
|       +-- review.py
|       +-- risk.py
|       +-- agent.py
|       +-- tests.py
|       +-- documentation.py
+-- rag/
|   +-- ingestion.py
|   +-- chunking.py
|   +-- retrieval.py
|   +-- generation.py
+-- embeddings/
|   +-- generator.py
|   +-- models.py
+-- agents/
|   +-- orchestrator.py
|   +-- tools/
+-- ml/
|   +-- features.py
|   +-- train.py
|   +-- predict.py
|   +-- evaluate.py
+-- analyzers/
|   +-- language.py
|   +-- complexity.py
+-- security/
|   +-- scanner.py
+-- llm/
|   +-- client.py
|   +-- prompts.py
+-- schemas/
+-- config/
+-- utils/
```

---

## 9. React Frontend Structure

```
apps/web/src/
+-- app/
|   +-- App.tsx
|   +-- router.tsx
|   +-- providers.tsx
+-- components/
|   +-- ui/               shadcn/ui components
|   +-- layout/           AppShell, Sidebar, TopNav
|   +-- charts/           Recharts wrappers
|   +-- code-editor/      Monaco Editor wrappers
|   +-- common/           Shared UI components
+-- features/
|   +-- auth/
|   +-- dashboard/
|   +-- repositories/
|   +-- analysis/
|   +-- security/
|   +-- dependencies/
|   +-- risk/
|   +-- issues/
|   +-- assistant/
|   +-- code-review/
|   +-- test-generation/
|   +-- documentation/
|   +-- pull-requests/
|   +-- settings/
+-- hooks/
+-- services/             Axios API client functions
+-- lib/                  Utilities (cn, formatters)
+-- types/                TypeScript interfaces
+-- utils/
+-- assets/
+-- styles/
```

---

## 10. Architecture Decision Log

See docs/DECISIONS.md for all significant architectural decisions.

---

## 11. Changelog

| Date | Change |
|------|--------|
| 2026-08-09 | Phase 0: Initial architecture documented |
