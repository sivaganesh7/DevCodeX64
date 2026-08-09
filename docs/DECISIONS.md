# DevCodeX64 — Architecture Decision Log

**Version:** 1.0.0
**Last Updated:** 2026-08-09

---

## Decision Template

```
### ADR-NNN: [Title]
Date: YYYY-MM-DD
Status: ACCEPTED | SUPERSEDED | DEPRECATED
Context: Why this decision was needed
Decision: What was decided
Rationale: Why this option was chosen
Alternatives Considered: What else was evaluated
Consequences: What this means for the project
```

---

## ADR-001: Project Name Standardization

**Date:** 2026-08-09
**Status:** ACCEPTED

**Context:**
The project had three different names in use: DevOpsAI, CodePilot Enterprise,
and DevOrvex. This caused confusion in documentation and code.

**Decision:**
The official project name is DevCodeX64.
All previous names are deprecated and must not appear in new code.

**Rationale:**
A single consistent name is required for professional documentation,
package naming, and product identity.

**Consequences:**
- All docs updated to DevCodeX64
- npm package scope: @devcodex64/*
- Docker container prefix: devcodex64-*

---

## ADR-002: React (not Next.js) for Frontend

**Date:** 2026-08-09
**Status:** ACCEPTED

**Context:**
The platform needs a modern frontend framework. Next.js is a common choice
that adds SSR capabilities.

**Decision:**
Use React + Vite (SPA) as specified. Do NOT use Next.js.

**Rationale:**
- The spec explicitly prohibits Next.js
- SSR adds deployment complexity without clear benefit for a developer tool
- Vite provides excellent DX with fast HMR
- NestJS handles all server-side logic; SSR is not needed

**Consequences:**
- No server-side rendering
- All data fetching via TanStack Query + Axios
- Deployment: serve built static files from CDN or nginx

---

## ADR-003: NestJS as Primary Backend (not FastAPI)

**Date:** 2026-08-09
**Status:** ACCEPTED

**Context:**
FastAPI is used for AI/ML. There was ambiguity about whether to consolidate
all backend logic into FastAPI.

**Decision:**
NestJS is the primary application backend.
FastAPI is a dedicated AI/ML service only.

**Rationale:**
- NestJS provides mature authentication, guards, interceptors, Prisma integration
- Keeping AI/ML in Python allows use of the Python ML ecosystem
- Clear service boundary prevents logic leakage
- Independently deployable and scalable

**Consequences:**
- Two backend services to maintain
- Internal HTTP communication between NestJS and FastAPI
- Workers are Node.js (not Python), calling FastAPI for AI tasks

---

## ADR-004: pgvector for Embedding Storage

**Date:** 2026-08-09
**Status:** ACCEPTED

**Context:**
The RAG system requires vector similarity search for code embeddings.
Options: pgvector (PostgreSQL extension), Pinecone, Weaviate, Chroma, Qdrant.

**Decision:**
Use pgvector as the vector database, integrated into the existing PostgreSQL instance.

**Rationale:**
- Reduces operational complexity (no separate vector DB service)
- PostgreSQL already required for application data
- pgvector is production-ready and supports HNSW/IVFFlat indexes
- Sufficient for medium-sized repositories (< 1M vectors)
- Simplifies development setup

**Alternatives rejected:**
- Pinecone: Cloud-only, adds external dependency
- Weaviate/Qdrant: Separate service, adds Docker complexity for no clear gain at this scale

**Consequences:**
- pgvector extension required in PostgreSQL
- Performance limited for very large repositories (> 500k vectors)
- May need to migrate to dedicated vector DB if scale requires it (document in DECISIONS.md)

---

## ADR-005: Single Orchestrator Agent (not Multi-Agent)

**Date:** 2026-08-09
**Status:** ACCEPTED

**Context:**
Complex multi-agent architectures (AutoGPT-style, CrewAI-style) are possible
but significantly increase complexity and failure modes.

**Decision:**
Implement a single orchestrator agent using the ReAct pattern.

**Rationale:**
- ReAct (Reasoning + Acting) is well-understood and debuggable
- Single agent is easier to test, trace, and fix
- Multi-agent can be introduced in Phase 10+ if single agent is insufficient
- Spec explicitly states: "Start with a single orchestrator agent"

**Consequences:**
- Agent has bounded tool set (10 tools, all READ or GENERATE permissions)
- Max 10 iteration loops per task
- 300s total timeout per agent run

---

## ADR-006: Random Forest as ML Baseline Model

**Date:** 2026-08-09
**Status:** ACCEPTED

**Context:**
The ML risk prediction system needs an initial model. Options range from
logistic regression to deep learning.

**Decision:**
Use Random Forest as the Phase 7 baseline. Evaluate XGBoost only if
dataset size justifies it (> 10,000 labeled samples).

**Rationale:**
- Random Forest is interpretable (feature importances)
- Handles mixed feature types well
- Low overfitting risk with default regularization
- Can be explained to users ("files with high complexity and churn are riskier")
- Spec requires interpretable models initially

**Dataset limitation:**
No curated labeled dataset exists at project start.
Proxy labels will be used (files with bug-fix commits as positive class).
All model limitations must be clearly documented in the UI.

---

## ADR-007: BullMQ for Job Queue (not Celery or SQS)

**Date:** 2026-08-09
**Status:** ACCEPTED

**Context:**
Background processing requires a reliable job queue.

**Decision:**
Use BullMQ (Redis-backed) for all background jobs in Node.js workers.

**Rationale:**
- BullMQ is the established choice for NestJS/Node.js ecosystems
- Redis is already in the stack for caching
- Avoids adding Celery (Python-only, doesn't integrate with Node workers)
- SQS adds AWS dependency; Redis is self-hosted
- BullMQ provides: job retries, progress tracking, job history

**Consequences:**
- Workers are Node.js processes (not Python)
- Workers call FastAPI via HTTP for AI/ML tasks
- Redis must be running before any worker starts

---

## ADR-008: Sandboxed Code Execution Strategy

**Date:** 2026-08-09
**Status:** ACCEPTED

**Context:**
Generated tests and code must not execute on the host system.
Several sandbox options exist.

**Decision:**
Use ephemeral Docker containers for sandboxed execution in Phase 11.
If Docker-in-Docker is not feasible, disable execution and document the limitation.

**Rationale:**
- Docker provides strong process isolation
- Container ephemeral lifecycle prevents state accumulation
- Resource limits (CPU, memory, network, filesystem) are enforced
- Spec is explicit: "if a secure sandbox cannot be implemented, document the limitation"

**Implementation constraints:**
- CPU: 0.5 cores
- Memory: 256MB
- Timeout: 30s
- Network: disabled
- Filesystem: tmpfs only

---

## ADR-009: GitHub Token Encryption

**Date:** 2026-08-09
**Status:** ACCEPTED

**Context:**
GitHub OAuth tokens must be stored but must not be readable if the database
is compromised.

**Decision:**
Encrypt GitHub tokens at rest using AES-256-GCM before storing in PostgreSQL.
Decryption key stored in GITHUB_TOKEN_ENCRYPTION_KEY environment variable.

**Rationale:**
- Tokens in plaintext are a critical security risk
- AES-256-GCM provides authenticated encryption (detects tampering)
- Key rotation possible by re-encrypting all tokens

**Consequences:**
- Token encryption/decryption handled in NestJS auth service
- Encryption key must be managed securely (not in .env.example with real value)

---

## ADR-010: Prisma ORM for Database Access

**Date:** 2026-08-09
**Status:** ACCEPTED

**Context:**
Database access approach needs to be chosen for NestJS backend.

**Decision:**
Use Prisma ORM exclusively for all database access in Node.js services.

**Rationale:**
- Type-safe database queries (no raw SQL string building)
- Prisma Client generates TypeScript types from schema
- Migration management built-in
- Transaction support
- Spec already includes Prisma in the technology stack

**Consequences:**
- All schema changes via Prisma migrations (not raw SQL)
- schema.prisma is the single source of truth for database structure
- Raw SQL only via prisma.$queryRaw with parameterized inputs

---

## ADR-011: Mock Data Policy During UI Development

**Date:** 2026-08-09
**Status:** ACCEPTED

**Context:**
Frontend pages may be built before backend APIs are complete.
Placeholder data is needed for UI development.

**Decision:**
Mock data is allowed during UI development when:
1. It is clearly labeled with a visible banner: "[DEMO DATA]"
2. It is in a separate mock service file, not in the component
3. The API call is designed to be trivially replaced by a real API call

**Rationale:**
- Avoids blocking UI development on backend completion
- Prevents fake data from accidentally appearing in production
- TanStack Query makes mock-to-real transition clean

**Consequences:**
- Mock service files must be deleted or disabled before Phase completion
- No mock data in production builds

---

## Changelog

| Date | Change |
|------|--------|
| 2026-08-09 | Phase 0: ADR-001 through ADR-011 documented |
