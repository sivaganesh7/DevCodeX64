# DevCodeX64 — Database Design

**Version:** 1.0.0
**Last Updated:** 2026-08-09
**Database:** PostgreSQL 16 + pgvector

---

## 1. Conventions

- Primary keys: UUID v4 (gen_random_uuid via uuid-ossp)
- Timestamps: created_at, updated_at on all tables
- Foreign keys: enforced at DB level with ON DELETE CASCADE where appropriate
- Table names: snake_case plural (users, repositories, analysis_jobs)
- Column names: snake_case (full_name, github_id)
- Prisma models: PascalCase with @map to snake_case

---

## 2. Extensions Required

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

---

## 3. Entity Relationship Summary

```
User 1---* Repository
     1---* AuditLog
     1---* Conversation

Repository 1---* RepositoryBranch
           1---* RepositoryFile
           1---* AnalysisJob
           1---* PullRequest
           1---* Embedding
           1---* Conversation

AnalysisJob 1---1 AnalysisResult
            1---* CodeMetric
            1---* SecurityFinding
            1---* Dependency
            1---* Issue
            1---* RiskPrediction
            1---* GeneratedTest
            1---* Documentation

Conversation 1---* Message

PullRequest 1---* PullRequestReview
```

---

## 4. Entity Definitions

### User

```
users
  id            UUID PK
  github_id     TEXT UNIQUE         -- GitHub user ID
  username      TEXT UNIQUE         -- GitHub login
  email         TEXT UNIQUE NULL
  name          TEXT NULL
  avatar_url    TEXT NULL
  github_token  TEXT NULL           -- Encrypted OAuth access token
  refresh_token TEXT NULL           -- Encrypted refresh token
  role          ENUM (USER, ADMIN) DEFAULT USER
  created_at    TIMESTAMP
  updated_at    TIMESTAMP
```

**Security note:** github_token must be encrypted at rest. Never expose raw tokens via API.

---

### Repository

```
repositories
  id              UUID PK
  github_id       INTEGER UNIQUE    -- GitHub repo ID
  owner_id        UUID FK -> users
  full_name       TEXT              -- owner/repo-name
  name            TEXT
  description     TEXT NULL
  language        TEXT NULL         -- Primary language
  default_branch  TEXT DEFAULT 'main'
  stargazers_count INTEGER DEFAULT 0
  forks_count     INTEGER DEFAULT 0
  is_private      BOOLEAN DEFAULT false
  clone_url       TEXT
  html_url        TEXT
  is_cloned       BOOLEAN DEFAULT false
  local_path      TEXT NULL         -- Temp clone path
  created_at      TIMESTAMP
  updated_at      TIMESTAMP

INDEX: (owner_id)
INDEX: (full_name)
```

---

### RepositoryBranch

```
repository_branches
  id            UUID PK
  repository_id UUID FK -> repositories
  name          TEXT
  sha           TEXT                -- Commit SHA of branch tip
  is_default    BOOLEAN DEFAULT false
  created_at    TIMESTAMP
  updated_at    TIMESTAMP

UNIQUE: (repository_id, name)
```

---

### RepositoryFile

```
repository_files
  id            UUID PK
  repository_id UUID FK -> repositories
  analysis_id   UUID FK -> analysis_jobs NULL
  path          TEXT                -- Relative file path
  name          TEXT
  extension     TEXT NULL
  language      TEXT NULL
  size_bytes    INTEGER NULL
  line_count    INTEGER NULL
  is_binary     BOOLEAN DEFAULT false
  created_at    TIMESTAMP

INDEX: (repository_id, path)
```

---

### AnalysisJob

```
analysis_jobs
  id             UUID PK
  repository_id  UUID FK -> repositories
  user_id        UUID FK -> users
  branch         TEXT
  status         ENUM (QUEUED, RUNNING, COMPLETED, FAILED, CANCELLED)
  progress       INTEGER DEFAULT 0  -- 0-100 percentage
  current_step   TEXT NULL          -- Human-readable current step
  started_at     TIMESTAMP NULL
  completed_at   TIMESTAMP NULL
  error_message  TEXT NULL
  bull_job_id    TEXT NULL          -- BullMQ job ID for tracking
  created_at     TIMESTAMP
  updated_at     TIMESTAMP

INDEX: (repository_id, status)
INDEX: (user_id, created_at DESC)
```

---

### AnalysisResult

```
analysis_results
  id                UUID PK
  analysis_job_id   UUID FK -> analysis_jobs UNIQUE
  health_score      FLOAT NULL      -- 0-100
  quality_score     FLOAT NULL
  security_score    FLOAT NULL
  testing_score     FLOAT NULL
  documentation_score FLOAT NULL
  maintainability_score FLOAT NULL
  total_files       INTEGER NULL
  total_lines       INTEGER NULL
  language_breakdown JSONB NULL     -- {TypeScript: 60%, Python: 20%}
  summary           TEXT NULL       -- AI-generated summary
  created_at        TIMESTAMP
  updated_at        TIMESTAMP
```

**Note:** Scores are computed from real analysis data, never hardcoded.

---

### CodeMetric

```
code_metrics
  id            UUID PK
  analysis_id   UUID FK -> analysis_jobs
  file_path     TEXT
  metric_type   TEXT                -- cyclomatic_complexity, loc, function_count, etc.
  value         FLOAT
  details       JSONB NULL
  created_at    TIMESTAMP

INDEX: (analysis_id, file_path)
```

---

### SecurityFinding

```
security_findings
  id            UUID PK
  analysis_id   UUID FK -> analysis_jobs
  repository_id UUID FK -> repositories
  type          ENUM (SECRET, VULNERABILITY, MISCONFIGURATION, DEPENDENCY)
  severity      ENUM (CRITICAL, HIGH, MEDIUM, LOW, INFO)
  title         TEXT
  description   TEXT
  file_path     TEXT NULL
  line_number   INTEGER NULL
  rule_id       TEXT NULL
  cve_id        TEXT NULL
  is_false_positive BOOLEAN DEFAULT false
  is_resolved   BOOLEAN DEFAULT false
  resolved_at   TIMESTAMP NULL
  created_at    TIMESTAMP

INDEX: (analysis_id, severity)
INDEX: (repository_id, is_resolved)
```

---

### Dependency

```
dependencies
  id              UUID PK
  analysis_id     UUID FK -> analysis_jobs
  repository_id   UUID FK -> repositories
  name            TEXT
  current_version TEXT NULL
  latest_version  TEXT NULL
  is_outdated     BOOLEAN DEFAULT false
  is_vulnerable   BOOLEAN DEFAULT false
  severity        ENUM (CRITICAL, HIGH, MEDIUM, LOW, INFO) NULL
  cve_ids         TEXT[] NULL
  license         TEXT NULL
  ecosystem       TEXT NULL         -- npm, pip, maven, gem
  is_direct       BOOLEAN DEFAULT true
  created_at      TIMESTAMP

INDEX: (analysis_id, is_vulnerable)
```

---

### Issue

```
issues
  id            UUID PK
  analysis_id   UUID FK -> analysis_jobs
  repository_id UUID FK -> repositories
  type          ENUM (SECURITY, QUALITY, DEPENDENCY, COMPLEXITY, DUPLICATION)
  severity      ENUM (CRITICAL, HIGH, MEDIUM, LOW, INFO)
  title         TEXT
  description   TEXT
  file_path     TEXT NULL
  line_number   INTEGER NULL
  column_number INTEGER NULL
  rule_id       TEXT NULL
  recommendation TEXT NULL
  is_resolved   BOOLEAN DEFAULT false
  resolved_at   TIMESTAMP NULL
  created_at    TIMESTAMP

INDEX: (analysis_id, severity, type)
INDEX: (repository_id, is_resolved)
```

---

### RiskPrediction

```
risk_predictions
  id              UUID PK
  analysis_id     UUID FK -> analysis_jobs
  repository_id   UUID FK -> repositories
  file_path       TEXT NULL         -- NULL = repository-level prediction
  risk_level      ENUM (LOW, MEDIUM, HIGH, CRITICAL)
  risk_score      FLOAT             -- 0.0-1.0
  confidence      FLOAT NULL        -- 0.0-1.0 model confidence
  features        JSONB NULL        -- Feature vector used for prediction
  model_version   TEXT NULL
  created_at      TIMESTAMP

INDEX: (analysis_id, risk_level)
```

---

### Embedding

```
code_embeddings
  id            UUID PK
  repository_id UUID FK -> repositories  -- (no uuid type in FK yet, see note)
  analysis_id   UUID NULL
  file_path     TEXT
  content       TEXT                -- Raw chunk text
  chunk_index   INTEGER
  start_line    INTEGER
  end_line      INTEGER
  embedding     VECTOR(1536) NULL   -- pgvector column
  model         TEXT DEFAULT 'text-embedding-3-small'
  created_at    TIMESTAMP

INDEX: USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)
INDEX: (repository_id, file_path)
```

---

### Conversation

```
conversations
  id            UUID PK
  repository_id UUID FK -> repositories
  user_id       UUID FK -> users
  title         TEXT NULL
  created_at    TIMESTAMP
  updated_at    TIMESTAMP

INDEX: (repository_id, user_id)
```

---

### Message

```
messages
  id              UUID PK
  conversation_id UUID FK -> conversations
  role            ENUM (USER, ASSISTANT)
  content         TEXT
  sources         JSONB NULL        -- [{file, line_start, line_end, content}]
  token_count     INTEGER NULL
  created_at      TIMESTAMP

INDEX: (conversation_id, created_at)
```

---

### PullRequest

```
pull_requests
  id              UUID PK
  repository_id   UUID FK -> repositories
  github_pr_id    INTEGER
  number          INTEGER
  title           TEXT
  body            TEXT NULL
  state           TEXT              -- open, closed, merged
  author          TEXT
  base_branch     TEXT
  head_branch     TEXT
  html_url        TEXT
  github_created_at TIMESTAMP NULL
  github_updated_at TIMESTAMP NULL
  created_at      TIMESTAMP
  updated_at      TIMESTAMP

UNIQUE: (repository_id, github_pr_id)
INDEX: (repository_id, state)
```

---

### PullRequestReview

```
pull_request_reviews
  id              UUID PK
  pull_request_id UUID FK -> pull_requests
  analysis_id     UUID NULL
  summary         TEXT NULL
  risk_level      ENUM (LOW, MEDIUM, HIGH, CRITICAL) NULL
  issues_found    INTEGER DEFAULT 0
  security_issues INTEGER DEFAULT 0
  review_data     JSONB NULL        -- Full structured AI review JSON
  posted_to_github BOOLEAN DEFAULT false
  github_comment_id TEXT NULL
  created_at      TIMESTAMP
  updated_at      TIMESTAMP
```

---

### GeneratedTest

```
generated_tests
  id            UUID PK
  repository_id UUID FK -> repositories
  analysis_id   UUID NULL
  user_id       UUID FK -> users
  file_path     TEXT
  function_name TEXT NULL
  test_content  TEXT               -- Generated test code
  language      TEXT               -- typescript, python, etc.
  framework     TEXT NULL          -- jest, pytest, etc.
  execution_status TEXT NULL       -- pending, passed, failed, skipped
  execution_output TEXT NULL       -- Sandboxed execution output
  executed_at   TIMESTAMP NULL
  created_at    TIMESTAMP
  updated_at    TIMESTAMP

INDEX: (repository_id, file_path)
```

---

### Documentation

```
documentation_artifacts
  id              UUID PK
  repository_id   UUID FK -> repositories
  analysis_id     UUID NULL
  user_id         UUID FK -> users
  doc_type        ENUM (README, API, ARCHITECTURE, FUNCTION, SETUP, DATABASE, DEVELOPER_GUIDE)
  title           TEXT
  content         TEXT             -- Generated markdown
  file_path       TEXT NULL        -- Target file path in repo
  created_at      TIMESTAMP
  updated_at      TIMESTAMP

INDEX: (repository_id, doc_type)
```

---

### AuditLog

```
audit_logs
  id          UUID PK
  user_id     UUID NULL FK -> users
  action      TEXT                 -- e.g. ANALYSIS_STARTED, REPO_CONNECTED
  entity_type TEXT NULL            -- repository, analysis, etc.
  entity_id   UUID NULL
  ip_address  TEXT NULL
  user_agent  TEXT NULL
  metadata    JSONB NULL
  created_at  TIMESTAMP

INDEX: (user_id, created_at DESC)
INDEX: (entity_type, entity_id)
```

---

## 5. Indexes Summary

Beyond primary keys, the following indexes are required for performance:

| Table | Index |
|-------|-------|
| code_embeddings | ivfflat on embedding (cosine) |
| analysis_jobs | (repository_id, status) |
| issues | (analysis_id, severity, type) |
| security_findings | (analysis_id, severity) |
| messages | (conversation_id, created_at) |
| audit_logs | (user_id, created_at DESC) |

---

## 6. Data Growth Estimates

| Table | Expected rows/year (medium repo) |
|-------|----------------------------------|
| analysis_jobs | 100-500 per repo |
| issues | 50,000 per analysis |
| security_findings | 1,000 per analysis |
| code_embeddings | 10,000-100,000 per repo |
| messages | 1,000+ per repo/user pair |
| audit_logs | 10,000+ per user |

---

## 7. Migration Strategy

- All schema changes via Prisma migrations
- Migration files committed to version control
- database/prisma/migrations/ contains numbered migration files
- Never edit migration files after they are applied
- Seed data via database/prisma/seed.ts (development only)

---

## 8. Changelog

| Date | Change |
|------|--------|
| 2026-08-09 | Phase 0: Initial database design documented |
