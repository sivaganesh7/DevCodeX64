<div align="center">

# 🚀 DevCodeX64

### **AI-Powered Code Intelligence & DevSecOps Platform**

[![Phase](https://img.shields.io/badge/Current_Phase-8-blueviolet?style=for-the-badge&logo=target)](docs/ROADMAP.md)
[![Stack](https://img.shields.io/badge/Stack-React%20%7C%20NestJS%20%7C%20FastAPI-blue?style=for-the-badge&logo=react)](docs/ARCHITECTURE.md)
[![AI/ML](https://img.shields.io/badge/AI%2FML-Scikit--learn%20%7C%20pgvector%20%7C%20LLM-green?style=for-the-badge&logo=python)](docs/AI_ARCHITECTURE.md)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)

> **Connect your GitHub repositories** → **Ingest & Analyze code** → **Detect security risks** → **Predict defects with ML** → **Ask AI about your codebase**

---

*A full-stack platform providing repository intelligence, code quality analysis, security scanning, ML-based risk prediction, RAG-powered AI assistant, and more — all in one unified developer experience.*

</div>

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🔄 How It Works](#-how-it-works)
- [🛠️ Technology Stack](#️-technology-stack)
- [⚡ Quick Start](#-quick-start)
- [🗂️ Repository Structure](#️-repository-structure)
- [🌐 Service URLs](#-service-urls)
- [💻 Development Commands](#-development-commands)
- [📊 Implementation Status](#-implementation-status)
- [📚 Documentation](#-documentation)
- [📄 License](#-license)

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🔐 Authentication & Security
- Email/password registration & login
- JWT access tokens (15 min) + refresh tokens (7 day)
- Bcrypt password hashing
- Protected route guards
- GitHub App OAuth integration

</td>
<td width="50%">

### 🔗 GitHub Integration
- GitHub App installation flow
- Repository listing via GitHub API
- Branch & commit browsing
- File tree & content retrieval
- Webhook endpoint setup

</td>
</tr>
<tr>
<td width="50%">

### 📥 Repository Ingestion
- BullMQ job queue architecture
- Automated git cloning (HTTPS)
- Recursive file tree extraction
- Smart file filtering (30+ extensions)
- Real-time job status tracking

</td>
<td width="50%">

### 🔍 Code Intelligence & Static Analysis
- AST-based code analysis (Babel parser)
- Cyclomatic complexity calculation
- Function & class extraction
- Code smell detection (long methods, large classes)
- LOC counting & language detection
- Health score algorithm (weighted sub-scores)

</td>
</tr>
<tr>
<td width="50%">

### 🛡️ Security & Dependency Analysis
- Secret detection (API keys, tokens, passwords)
- Dependency manifest parsing (package.json, requirements.txt)
- Vulnerability scanning (CVE matching)
- Code security scanning (SQL injection, path traversal, XSS)
- License compliance checking
- Weighted risk score (0–100)

</td>
<td width="50%">

### 🤖 ML Risk Prediction
- Random Forest classifier
- Per-file risk probability scoring
- Feature extraction pipeline (LOC, complexity, functions, security findings)
- Risk factor impact analysis
- Model versioning
- Clear prediction labeling

</td>
</tr>
<tr>
<td colspan="2" align="center">

### 🧠 RAG Repository Intelligence (AI Assistant)
- AST-aware code chunking pipeline
- Embedding generation (OpenAI-compatible)
- Cosine similarity vector retrieval
- Context-aware LLM response generation with source citations
- Prompt injection protection
- Conversation history with AI response metadata

</td>
</tr>
</table>

---

## 🏗️ Architecture

### High-Level System Architecture

```mermaid
flowchart TD
    subgraph ClientLayer["Client Layer"]
        WEB["React 18 Frontend\nVite + TypeScript + Tailwind"]
    end

    subgraph APILayer["API Gateway & Services"]
        NEST["NestJS Backend API\nREST + Swagger + JWT Auth"]
        FAST["FastAPI AI Service\nML Prediction + RAG Engine"]
    end

    subgraph WorkerLayer["Asynchronous Workers"]
        RW["Repository Worker\nGit Clone & File Extraction"]
        AW["Analysis Worker\nAST + Security + ML Process"]
        EW["Embedding Worker\nCode Vectorization"]
    end

    subgraph DataLayer["Persistence & Caching"]
        PG[("PostgreSQL Database\nPrisma ORM")]
        RD[("Redis Instance\nBullMQ Queues")]
    end

    WEB -->|HTTP REST| NEST
    NEST -->|HTTP API| FAST
    NEST -->|Enqueue Jobs| RD
    RD -->|Dispatch| RW
    RD -->|Dispatch| AW
    RD -->|Dispatch| EW
    RW -->|Store Files| PG
    AW -->|Store Metrics & Issues| PG
    AW -->|Predict Risk| FAST
    EW -->|Generate Embeddings| FAST
    NEST -->|Query Data| PG
    FAST -->|Vector Query| PG
```

### Service Communication Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant Web as React Frontend
    participant API as NestJS API
    participant Queue as Redis Queue
    participant RepoWorker as Repo Worker
    participant AnalysisWorker as Analysis Worker
    participant AIService as FastAPI AI Service
    participant DB as PostgreSQL

    User->>Web: Connect GitHub & Select Repo
    Web->>API: POST /api/ingestion/start
    API->>DB: Create IngestionJob (QUEUED)
    API->>Queue: Add INGEST_REPOSITORY Job
    Queue->>RepoWorker: Process Ingestion Job
    RepoWorker->>DB: Clone & Extract File Tree
    RepoWorker->>Queue: Add ANALYZE_REPOSITORY Job
    Queue->>AnalysisWorker: Process Analysis Job
    AnalysisWorker->>DB: AST Analysis & Code Metrics
    AnalysisWorker->>DB: Security Scan & Dependencies
    AnalysisWorker->>AIService: POST /predict-risk (Per File)
    AIService-->>AnalysisWorker: Risk Probability & Factors
    AnalysisWorker->>DB: Store ML Risk Predictions
    AnalysisWorker->>DB: Update AnalysisJob (COMPLETED)
    Web->>API: GET /api/repositories/:id/analysis
    API->>DB: Fetch Aggregated Results
    API-->>Web: Health Scores, Issues, Risk & Security
    Web-->>User: Render Dashboard
```

---

## 🔄 How It Works

### End-to-End Analysis Pipeline

```mermaid
flowchart LR
    S1["1. Connect GitHub"] --> S2["2. Select Repository"]
    S2 --> S3["3. Ingest & Clone"]
    S3 --> S4["4. Static Code Analysis"]
    S4 --> S5["5. Security Scan"]
    S5 --> S6["6. ML Risk Prediction"]
    S6 --> S7["7. View Dashboard"]
    S7 --> S8["8. Ask AI Assistant"]
```

### Step-by-Step Workflow

| Step | Action | What Happens |
|:----:|--------|-------------|
| **1** | 🔗 **Connect GitHub** | Install the GitHub App on your account/org. DevCodeX64 stores the installation ID securely. |
| **2** | 📥 **Select Repository** | Browse your GitHub repos from the dashboard. Pick one to analyze. |
| **3** | ⚡ **Trigger Ingestion** | A BullMQ job is queued. The Repository Worker clones the repo via the GitHub API, extracts all source files (30+ extensions), and stores them in PostgreSQL. |
| **4** | 🔍 **Code Analysis** | The Analysis Worker parses each JS/TS file with Babel AST. It calculates cyclomatic complexity, extracts functions/classes, detects code smells (long methods, large classes), and computes LOC metrics. |
| **5** | 🛡️ **Security Scan** | In the same pipeline: secrets are detected via regex patterns, dependencies are parsed from manifest files, vulnerabilities are matched, and code security patterns (SQLi, XSS, path traversal) are scanned. A weighted risk score (0–100) is computed. |
| **6** | 🤖 **ML Risk Prediction** | For each file, features (LOC, complexity, functions, dependencies, code smells, security findings) are extracted and sent to the FastAPI ML service. A Random Forest model predicts risk probability and identifies top risk factors. |
| **7** | 📊 **View Results** | The React dashboard shows health scores, code metrics, security findings, vulnerability reports, dependency status, and per-file ML risk predictions — all in one unified view. |
| **8** | 🧠 **Ask AI Assistant** | Ask natural-language questions about your codebase. The RAG pipeline chunks code, generates embeddings, retrieves relevant context via cosine similarity, and produces LLM answers with source citations. |

---

### Analysis Worker Pipeline (Internal)

```mermaid
flowchart TD
    A1["Receive Analysis Job"] --> A2["Fetch Files from Database"]
    A2 --> A3{"Is JS / TS File?"}

    A3 -- Yes --> B1["Parse AST with Babel"]
    B1 --> B2["Calculate Complexity & Smells"]
    B2 --> B3["Store Code Metrics & Issues"]

    A3 -- No --> B4["Compute LOC & Language"]
    B4 --> B3

    B3 --> C1["Security & Dependency Analysis"]
    C1 --> C2["Scan Secrets & Vulnerabilities"]
    C2 --> C3["Compute Security Risk Score"]
    C3 --> C4["Save Security Scan & Findings"]

    C4 --> D1["Extract Per-File Feature Vectors"]
    D1 --> D2["POST /predict-risk to AI Service"]
    D2 --> D3["Store ML Risk Predictions & Factors"]
    D3 --> D4["Mark Analysis Job COMPLETED"]
```

### RAG AI Assistant Pipeline

```mermaid
flowchart LR
    Q["User Question"] --> E["Generate Embedding"]
    E --> V["Cosine Similarity Search"]
    V --> C["Retrieve Top Code Chunks"]
    C --> P["Construct Augmented Prompt"]
    P --> L["LLM Response Generation"]
    L --> R["Answer with Citations"]
```

---

## 🛠️ Technology Stack

```mermaid
flowchart TD
    subgraph Frontend["Frontend Layer"]
        F1["React 18 + Vite"]
        F2["TypeScript"]
        F3["Tailwind CSS + shadcn/ui"]
        F4["React Router 6"]
    end

    subgraph Backend["Backend Layer"]
        B1["NestJS Framework"]
        B2["Prisma ORM"]
        B3["Swagger OpenAPI"]
        B4["BullMQ + Redis"]
    end

    subgraph AI["AI / ML Layer"]
        M1["FastAPI Python 3.11"]
        M2["Scikit-Learn (Random Forest)"]
        M3["OpenAI Embeddings / LLM"]
        M4["pgvector / Cosine Similarity"]
    end

    subgraph Infrastructure["Infrastructure Layer"]
        I1["PostgreSQL 16"]
        I2["Redis 7"]
        I3["Docker & Compose"]
        I4["pnpm Workspaces"]
    end
```

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui | Modern reactive UI with component library |
| **Backend** | NestJS + TypeScript + Prisma + Swagger | REST API with auto-generated docs |
| **AI/ML** | Python + FastAPI + Scikit-learn + pgvector | ML risk prediction & RAG pipeline |
| **Queue** | Redis + BullMQ | Async job processing for ingestion & analysis |
| **Database** | PostgreSQL + Prisma ORM | Relational data with vector embeddings |
| **DevOps** | Docker + Docker Compose + GitHub Actions | Containerized development & CI/CD |

---

## ⚡ Quick Start

### Prerequisites

| Tool | Required Version | Check Command |
|------|:---------------:|---------------|
| Node.js | `>= 20.0.0` | `node --version` |
| pnpm | `>= 9.0.0` | `pnpm --version` |
| Python | `>= 3.11` | `python --version` |
| Docker | `>= 24.0` | `docker --version` |
| Docker Compose | `>= 2.20` | `docker compose version` |

### Setup Steps

```mermaid
flowchart LR
    Step1["1. Clone Repo"] --> Step2["2. Install Dependencies"]
    Step2 --> Step3["3. Configure .env"]
    Step3 --> Step4["4. Start Docker"]
    Step4 --> Step5["5. Run Migrations"]
    Step5 --> Step6["6. Start Dev Servers"]
```

#### 1️⃣ Clone the repository
```bash
git clone https://github.com/sivaganesh7/DevCodeX64.git
cd DevCodeX64
```

#### 2️⃣ Install dependencies
```bash
npm install -g pnpm    # if not already installed
pnpm install
```

#### 3️⃣ Configure environment
```bash
cp .env.example .env
# Edit .env with your local settings (database URL, GitHub App credentials, AI API keys)
```

#### 4️⃣ Start infrastructure (PostgreSQL + Redis)
```bash
docker compose up -d
```

#### 5️⃣ Setup database
```bash
pnpm db:generate       # Generate Prisma client
pnpm db:migrate:dev    # Apply migrations
pnpm db:seed           # (Optional) Seed dev data
```

#### 6️⃣ Start all services
```bash
# Terminal 1 — NestJS API
pnpm --filter=@devcodex64/api dev

# Terminal 2 — React Frontend
pnpm --filter=@devcodex64/web dev

# Terminal 3 — AI Service (FastAPI)
cd apps/ai-service && uvicorn app.main:app --reload --port 8000

# Terminal 4 — Repository Worker
pnpm --filter=@devcodex64/repository-worker dev

# Terminal 5 — Analysis Worker
pnpm --filter=@devcodex64/analysis-worker dev
```

#### 7️⃣ Open your browser

| Service | URL |
|---------|-----|
| 🌐 Frontend | http://localhost:5173 |
| ⚙️ NestJS API | http://localhost:3001/api |
| 📖 API Docs (Swagger) | http://localhost:3001/api/docs |
| 🤖 AI Service | http://localhost:8000 |
| 📖 AI Docs | http://localhost:8000/docs |

#### 8️⃣ Verify everything is running
```bash
# API health check
curl http://localhost:3001/api/health

# AI service health check
curl http://localhost:8000/health
```

---

## 🗂️ Repository Structure

```
DevCodeX64/
├── 📦 apps/
│   ├── web/                    # React 18 + Vite frontend
│   │   └── src/
│   │       ├── app/            #   Router, providers, App shell
│   │       ├── components/     #   UI components, charts, layout, code-editor
│   │       ├── features/       #   Feature modules ↓
│   │       │   ├── auth/       #     Login & Register pages
│   │       │   ├── dashboard/  #     Main dashboard
│   │       │   ├── repositories/ #   Repo listing, details, overview, issues
│   │       │   ├── security/   #     Security overview, secrets, vulnerabilities
│   │       │   ├── dependencies/ #   Dependency management
│   │       │   ├── risk/       #     ML risk visualization
│   │       │   ├── analysis/   #     Analysis results
│   │       │   ├── assistant/  #     AI RAG assistant (placeholder)
│   │       │   ├── code-review/ #    Code review (placeholder)
│   │       │   ├── settings/   #     User settings
│   │       │   └── ...        #     More feature modules
│   │       ├── hooks/          #   Custom React hooks
│   │       ├── services/       #   API client services
│   │       └── lib/            #   Utilities
│   │
│   ├── api/                    # NestJS backend (port 3001)
│   │   └── src/
│   │       └── modules/
│   │           ├── auth/       #   Authentication (JWT, bcrypt)
│   │           ├── github/     #   GitHub App integration
│   │           ├── ingestion/  #   Repository ingestion queue
│   │           ├── analysis/   #   Analysis results API
│   │           ├── security/   #   Security scan API
│   │           ├── risk/       #   ML risk prediction API
│   │           ├── repositories/ # Repository CRUD
│   │           ├── health/     #   Health check endpoint
│   │           ├── webhooks/   #   GitHub webhook handler
│   │           ├── assistant/  #   RAG assistant module
│   │           ├── issues/     #   Code issues API
│   │           ├── dependencies/ # Dependency API
│   │           ├── jobs/       #   Job management
│   │           └── users/      #   User management
│   │
│   └── ai-service/             # FastAPI AI/ML service (port 8000)
│       └── app/
│           ├── api/routes/     #   risk, rag, embeddings, health endpoints
│           ├── ml/             #   ML pipeline (features, training, evaluation, prediction)
│           ├── core/           #   Database, embeddings, LLM, RAG, security
│           ├── features/       #   Feature engineering
│           ├── models/         #   Risk model
│           ├── schemas/        #   Pydantic schemas
│           └── services/       #   Business logic
│
├── ⚡ workers/
│   ├── repository-worker/      # BullMQ worker: git clone + file extraction
│   │   └── src/
│   │       ├── cloning/        #   Git clone logic
│   │       ├── ingestion/      #   File processing
│   │       └── processing/     #   Content extraction
│   │
│   ├── analysis-worker/        # BullMQ worker: code + security + ML analysis
│   │   └── src/
│   │       ├── code-analysis/  #   (Inline AST analysis in index.ts)
│   │       ├── security-analysis/ # Secret, vulnerability, code security scanners
│   │       ├── dependency-analysis/ # Dependency manifest parsing
│   │       ├── ml-risk/        #   ML risk processor (calls AI service)
│   │       └── metrics/        #   Metric calculations
│   │
│   └── embedding-worker/       # BullMQ worker: embedding generation (stub)
│
├── 📦 packages/
│   ├── types/                  # Shared TypeScript type definitions
│   ├── config/                 # Shared configuration
│   ├── validation/             # Shared Zod validation schemas
│   └── shared/                 # Shared utilities
│
├── 💾 database/
│   └── prisma/
│       ├── schema.prisma       # Complete schema (20+ models)
│       ├── migrations/         # Database migrations
│       └── seed.ts             # Development seed data
│
├── 📚 docs/                    # Architecture & specification documents
├── 🐳 infrastructure/          # Dockerfiles, CI/CD, nginx configs
├── 🧪 tests/                   # E2E, integration, security tests
└── 🤖 .agents/rules/           # AI agent engineering rules
```

---

## 🌐 Service URLs

| Service | URL | Status |
|---------|-----|:------:|
| 🌐 Frontend | http://localhost:5173 | ✅ Active |
| ⚙️ NestJS API | http://localhost:3001/api | ✅ Active |
| 📖 Swagger Docs | http://localhost:3001/api/docs | ✅ Active |
| 🤖 AI Service | http://localhost:8000 | ✅ Active |
| 📖 AI Docs | http://localhost:8000/docs | ✅ Active |
| ❤️ API Health | http://localhost:3001/api/health | ✅ Active |
| ❤️ AI Health | http://localhost:8000/health | ✅ Active |
| 💾 PostgreSQL | localhost:5432 | ✅ Active |
| 📮 Redis | localhost:6379 | ✅ Active |

---

## 💻 Development Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Node.js services in parallel |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all TypeScript packages |
| `pnpm typecheck` | Type-check all TypeScript packages |
| `pnpm build` | Build all packages |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:migrate:dev` | Create and apply database migration |
| `pnpm db:seed` | Seed development database |
| `pnpm db:studio` | Open Prisma Studio (GUI) |
| `pnpm docker:up` | Start Docker services (`docker compose up -d`) |
| `pnpm docker:down` | Stop Docker services (`docker compose down`) |

---

## 📊 Implementation Status

### Progress Overview

```mermaid
pie title Implementation Progress
    "Completed (8 phases)" : 8
    "Remaining (12 phases)" : 12
```

### Database Schema Coverage

```mermaid
erDiagram
    User ||--o| GitHubIntegration : has
    User ||--o{ Repository : owns
    User ||--o{ Conversation : creates
    GitHubIntegration ||--o{ Repository : provides
    Repository ||--o{ RepositoryFile : contains
    Repository ||--o{ IngestionJob : triggers
    Repository ||--o{ AnalysisJob : analyzes
    Repository ||--o{ CodeChunk : chunks
    Repository ||--o{ Conversation : context
    RepositoryFile ||--o{ MLRiskPrediction : predicts
    RepositoryFile ||--o{ CodeChunk : generates
    AnalysisJob ||--o| AnalysisResult : produces
    AnalysisJob ||--o{ CodeMetric : calculates
    AnalysisJob ||--o{ Issue : finds
    AnalysisJob ||--o| SecurityScan : scans
    AnalysisJob ||--o{ MLRiskPrediction : predicts
    SecurityScan ||--o{ Dependency : detects
    SecurityScan ||--o{ SecurityFinding : reports
    SecurityScan ||--o{ SecretFinding : discovers
    SecurityScan ||--o{ LicenseFinding : checks
    Dependency ||--o{ Vulnerability : exposes
    MLRiskPrediction ||--o{ MLRiskFactor : explains
    Conversation ||--o{ ConversationMessage : contains
    ConversationMessage ||--o| AIResponse : generates
```

### Detailed Phase Status

| Phase | Description | Status | Key Deliverables |
|:-----:|-------------|:------:|------------------|
| **0** | Requirements + Architecture | ✅ **Complete** | MASTER_SPEC, ARCHITECTURE, DATABASE, API_SPEC, AI_ARCHITECTURE, SECURITY, TESTING, ROADMAP, DECISIONS docs |
| **1** | Monorepo + Foundation | ✅ **Complete** | pnpm workspace, React + NestJS + FastAPI apps, Docker Compose, Prisma schema, health endpoints |
| **2** | Authentication + Authorization | ✅ **Complete** | Register/Login, JWT tokens, bcrypt hashing, protected routes, auth guards |
| **3** | GitHub Integration | ✅ **Complete** | GitHub App flow, repo listing, branch/commit browsing, file tree/content, webhook setup |
| **4** | Repository Ingestion | ✅ **Complete** | BullMQ queue, repository worker, git cloning, file extraction, job status tracking |
| **5** | Code Intelligence + Static Analysis | ✅ **Complete** | Babel AST parsing, cyclomatic complexity, function/class extraction, code smells, health scores |
| **6** | Security + Dependency Analysis | ✅ **Complete** | Secret scanning, dependency parsing, vulnerability detection, code security patterns, risk scoring |
| **7** | ML Risk Prediction | ✅ **Complete** | Feature extraction, Random Forest model, risk probability, risk factors, model versioning |
| **8** | RAG Repository Intelligence | ✅ **Complete** | Code chunking, embedding generation, cosine similarity retrieval, LLM response, conversation storage |
| **9** | Intelligent Code Review | 🔄 **Next** | AI-powered file & PR code review |
| **10** | AI Engineering Agent | ⏳ Planned | ReAct loop agent orchestrator with tool registry |
| **11** | Test Generation + Execution | ⏳ Planned | Automated test generation with sandboxed execution |
| **12** | Documentation Generation | ⏳ Planned | README, API docs, function docs generation |
| **13** | PR Intelligence + Automation | ⏳ Planned | Auto PR analysis, AI review as GitHub comments |
| **14** | CI/CD Intelligence | ⏳ Planned | Pipeline health metrics, failure trend analysis |
| **15** | Dashboard + UX Refinement | ⏳ Planned | Responsive polish, accessibility, empty/loading/error states |
| **16** | Integration + E2E Testing | ⏳ Planned | Playwright E2E suite, full flow coverage |
| **17** | Observability | ⏳ Planned | Structured logging, request tracing, monitoring |
| **18** | Docker + CI/CD Pipeline | ⏳ Planned | Production Dockerfiles, GitHub Actions CI |
| **19** | Security Audit | ⏳ Planned | Penetration testing, dependency audits |
| **20** | Production Readiness | ⏳ Planned | Final audit, deployment docs, demo guide |

### Phase Dependency Graph

```mermaid
flowchart TD
    P0["Phase 0: Architecture (Complete)"] --> P1["Phase 1: Foundation (Complete)"]
    P1 --> P2["Phase 2: Authentication (Complete)"]
    P2 --> P3["Phase 3: GitHub Integration (Complete)"]
    P3 --> P4["Phase 4: Repository Ingestion (Complete)"]
    P4 --> P5["Phase 5: Code Intelligence (Complete)"]
    P4 --> P6["Phase 6: Security Analysis (Complete)"]
    P4 --> P8["Phase 8: RAG Intelligence (Complete)"]
    P5 --> P7["Phase 7: ML Risk Prediction (Complete)"]
    P6 --> P9["Phase 9: Code Review (Next)"]
    P8 --> P9
    P9 --> P10["Phase 10: AI Agent (Planned)"]
    P10 --> P11["Phase 11: Test Gen (Planned)"]
    P10 --> P12["Phase 12: Doc Gen (Planned)"]
    P6 --> P13["Phase 13: PR Automation (Planned)"]
    P9 --> P13
    P13 --> P14["Phase 14: CI/CD Intel (Planned)"]
    P14 --> P15["Phase 15: Dashboard UX (Planned)"]
    P15 --> P16["Phase 16: E2E Testing (Planned)"]
    P16 --> P17["Phase 17: Observability (Planned)"]
    P17 --> P18["Phase 18: Docker & CI (Planned)"]
    P18 --> P19["Phase 19: Security Audit (Planned)"]
    P19 --> P20["Phase 20: Production (Planned)"]
```

---

## 📚 Documentation

All architecture, API, database, and AI documentation lives in `docs/`:

| Document | Description |
|----------|-------------|
| [MASTER_SPEC.md](docs/MASTER_SPEC.md) | Complete project specification |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture & design decisions |
| [DATABASE.md](docs/DATABASE.md) | Database schema design & ERD |
| [API_SPEC.md](docs/API_SPEC.md) | REST API specification & endpoints |
| [AI_ARCHITECTURE.md](docs/AI_ARCHITECTURE.md) | AI/ML architecture, models, RAG pipeline |
| [SECURITY.md](docs/SECURITY.md) | Security architecture & threat model |
| [TESTING.md](docs/TESTING.md) | Testing strategy & coverage targets |
| [ROADMAP.md](docs/ROADMAP.md) | Implementation roadmap & phase details |
| [DECISIONS.md](docs/DECISIONS.md) | Architecture decision log (ADRs) |

---

## 🏗️ API Overview

### NestJS REST API (port 3001)

| Method | Endpoint | Phase | Description |
|:------:|----------|:-----:|-------------|
| `GET` | `/api/health` | 1 | System health check |
| `POST` | `/api/auth/register` | 2 | User registration |
| `POST` | `/api/auth/login` | 2 | User login (JWT) |
| `GET` | `/api/auth/me` | 2 | Current user profile |
| `GET` | `/api/github/repositories` | 3 | List GitHub repos |
| `GET` | `/api/github/repositories/:name/branches` | 3 | List branches |
| `POST` | `/api/github/connect` | 3 | Connect GitHub App |
| `DELETE` | `/api/github/disconnect` | 3 | Disconnect GitHub |
| `POST` | `/api/ingestion/start` | 4 | Start repo ingestion |
| `GET` | `/api/ingestion/jobs/:id` | 4 | Get job status |
| `GET` | `/api/repositories/:id/analysis/latest` | 5 | Latest analysis results |
| `GET` | `/api/repositories/:id/metrics` | 5 | Code metrics |
| `GET` | `/api/repositories/:id/issues` | 5 | Code issues |
| `GET` | `/api/repositories/:id/security` | 6 | Security scan results |
| `GET` | `/api/repositories/:id/dependencies` | 6 | Dependencies list |
| `GET` | `/api/repositories/:id/risk` | 7 | ML risk predictions |

### FastAPI AI Service (port 8000)

| Method | Endpoint | Phase | Description |
|:------:|----------|:-----:|-------------|
| `GET` | `/health` | 1 | AI service health |
| `POST` | `/predict-risk` | 7 | ML risk prediction |
| `POST` | `/rag/query` | 8 | RAG question answering |
| `POST` | `/embeddings/generate` | 8 | Generate embeddings |

---

## 📄 License

MIT — See [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ by [Sivaganesh](https://github.com/sivaganesh7)**

*DevCodeX64 — Making code intelligence accessible to every developer.*

</div>
