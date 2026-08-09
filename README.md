# DevCodeX64

**Code Intelligence & DevSecOps Platform**

A full-stack platform that connects to GitHub repositories and provides:
repository intelligence, code quality analysis, security scanning, ML-based risk prediction,
RAG-powered AI assistant, AI code review, and automated test/documentation generation.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | NestJS + TypeScript + Prisma + PostgreSQL |
| AI/ML | Python + FastAPI + Scikit-learn + pgvector |
| Queue | Redis + BullMQ |
| DevOps | Docker + Docker Compose + GitHub Actions |

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | >= 20.0.0 |
| pnpm | >= 9.0.0 |
| Python | >= 3.11 |
| Docker | >= 24.0 |
| Docker Compose | >= 2.20 |

---

## Quick Start (Development)

### 1. Clone and install dependencies

```bash
git clone https://github.com/your-org/DevCodeX64.git
cd DevCodeX64
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and fill in required secrets:
#   DATABASE_URL, REDIS_URL, JWT_SECRET,
#   GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET,
#   OPENAI_API_KEY (or your preferred LLM provider key)
```

### 3. Start infrastructure (PostgreSQL + Redis)

```bash
docker compose up -d postgres redis
```

### 4. Run database migrations

```bash
pnpm db:migrate:dev
```

### 5. Start all services (development mode)

```bash
# Terminal 1: NestJS API
pnpm --filter=@devcodex64/api dev

# Terminal 2: React frontend
pnpm --filter=@devcodex64/web dev

# Terminal 3: FastAPI AI service
cd apps/ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 4: Workers (optional — needed for analysis)
pnpm --filter=@devcodex64/repository-worker dev
pnpm --filter=@devcodex64/analysis-worker dev
pnpm --filter=@devcodex64/embedding-worker dev
```

Or use Docker Compose for everything:

```bash
docker compose up
```

---

## Service URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| NestJS API | http://localhost:3001/api |
| API Health | http://localhost:3001/api/health |
| Swagger Docs | http://localhost:3001/api/docs |
| AI Service | http://localhost:8000 |
| AI Health | http://localhost:8000/health |
| AI Docs | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

---

## Repository Structure

```
DevCodeX64/
├── apps/
│   ├── web/           React + Vite frontend
│   ├── api/           NestJS backend (port 3001)
│   └── ai-service/    FastAPI AI/ML service (port 8000)
├── workers/
│   ├── repository-worker/   Repository ingestion
│   ├── analysis-worker/     Code + security + dependency analysis
│   └── embedding-worker/    Embeddings + ML predictions
├── packages/
│   ├── types/         Shared TypeScript types
│   ├── config/        Shared configuration
│   ├── validation/    Shared Zod schemas
│   └── shared/        Shared utilities
├── database/
│   └── prisma/        Schema, migrations, seed
├── docs/              Architecture and specification documents
├── infrastructure/    Dockerfiles, CI/CD, nginx
├── tests/             E2E, integration, security tests
└── .agents/rules/     Engineering rules for AI agents
```

---

## Development Commands

```bash
pnpm dev              # Start Node.js services in parallel (not AI service)
pnpm test             # Run all tests
pnpm lint             # Lint all TypeScript packages
pnpm typecheck        # Type-check all TypeScript packages
pnpm build            # Build all packages
pnpm db:migrate:dev   # Create and apply a new migration
pnpm db:seed          # Seed development database
pnpm db:studio        # Open Prisma Studio
pnpm docker:up        # docker compose up -d
pnpm docker:down      # docker compose down
```

---

## Documentation

All architecture, API, database, and AI documentation is in `docs/`:

- [MASTER_SPEC.md](docs/MASTER_SPEC.md) — Project specification
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — System architecture
- [DATABASE.md](docs/DATABASE.md) — Database design
- [API_SPEC.md](docs/API_SPEC.md) — REST API specification
- [AI_ARCHITECTURE.md](docs/AI_ARCHITECTURE.md) — AI/ML architecture
- [SECURITY.md](docs/SECURITY.md) — Security architecture
- [TESTING.md](docs/TESTING.md) — Testing strategy
- [ROADMAP.md](docs/ROADMAP.md) — Implementation roadmap
- [DECISIONS.md](docs/DECISIONS.md) — Architecture decision log

---

## Implementation Status

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Requirements + Architecture | ✅ Complete |
| 1 | Monorepo + Foundation | ✅ Complete |
| 2 | Authentication + Authorization | 🔄 Next |
| 3–20 | Feature implementation | Planned |

---

## License

MIT — See [LICENSE](LICENSE) for details.
