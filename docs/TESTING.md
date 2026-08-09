# DevCodeX64 — Testing Strategy

**Version:** 1.0.0
**Last Updated:** 2026-08-09

---

## 1. Testing Philosophy

A feature is NOT complete unless tests pass.

Tests run automatically in CI for every pull request.
No PR merges to main without passing tests.

---

## 2. Test Layers

### 2.1 Unit Tests

Test individual functions, classes, and modules in isolation.
External dependencies (DB, Redis, APIs) are mocked.

| Service | Framework |
|---------|-----------|
| apps/api | Jest + ts-jest |
| apps/web | Vitest + Testing Library |
| workers | Jest + ts-jest |
| apps/ai-service | pytest |

**Coverage target:** >= 70% line coverage per service

**What to unit test:**
- Service methods (auth, analysis, github)
- Utility functions
- Validation logic
- Data transformers
- ML feature extraction
- RAG chunking logic
- Prompt construction

---

### 2.2 Integration Tests

Test multiple components together: API routes + database.
Use a dedicated test database (separate from development).

**Scope:**
- NestJS controllers + services + Prisma (test DB)
- Workers consuming mock BullMQ jobs
- AI service routes with real model calls (or VCR-recorded responses)

**Location:** tests/integration/

**Test database:** DevCodeX64_test (isolated, reset between test runs)

---

### 2.3 End-to-End Tests

Test the full user workflow from browser to backend.

**Framework:** Playwright

**Critical E2E flows to cover:**

1. Registration + Login flow
2. GitHub OAuth connection
3. Repository selection and analysis start
4. Analysis progress polling
5. Viewing analysis results (dashboard)
6. AI assistant conversation
7. Security findings display
8. Dependency analysis display
9. ML risk display
10. PR webhook trigger and review

**Location:** tests/e2e/

---

### 2.4 Security Tests

Focused security testing:

- Authentication bypass attempts
- Authorization boundary tests (can user A access user B's data?)
- SQL injection attempts (via API)
- XSS payload injection
- Webhook signature bypass
- Rate limiting enforcement
- Prompt injection attempts (manual + automated)

**Location:** tests/security/

---

## 3. Test Commands

```bash
# Unit tests — all services
pnpm test

# Unit tests — specific service
pnpm --filter=@devcodex64/api test
pnpm --filter=@devcodex64/web test

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# Coverage report
pnpm test:coverage

# Type checking
pnpm typecheck

# Lint
pnpm lint
```

For Python:
```bash
cd apps/ai-service
pytest
pytest --cov=app tests/
```

---

## 4. Test Database Setup

Integration tests require a running PostgreSQL instance.
Use Docker Compose test override:

```bash
docker compose -f docker-compose.yml -f docker-compose.test.yml up -d
```

Test database is reset before each integration test suite run.
Uses Prisma migrations to set up schema.

---

## 5. Fixtures and Test Data

**Location:** tests/fixtures/

Contains:
- Sample repository data (small test repos)
- Mock GitHub API responses
- Sample analysis results (for UI tests)
- Sample code files for static analysis tests

Fixture data is:
- Committed to version control
- Realistic but not real user data
- Designed to exercise edge cases

---

## 6. CI Test Pipeline

GitHub Actions runs on every pull request:

```
Install dependencies (pnpm install)
    |
Type checking (pnpm typecheck)
    |
Lint (pnpm lint)
    |
Unit tests (pnpm test)
    |
Integration tests (pnpm test:integration)
    |
Build check (pnpm build)
    |
Security audit (pnpm audit)
```

E2E tests run on merge to main (not on every PR, too slow).

---

## 7. Test Coverage Requirements by Phase

| Phase | Minimum Coverage |
|-------|-----------------|
| Authentication | 85% |
| GitHub Integration | 75% |
| Repository Ingestion | 75% |
| Code Analysis | 80% |
| Security Analysis | 85% |
| ML Risk Prediction | 80% |
| RAG Pipeline | 75% |
| AI Agent | 70% |
| Webhooks | 85% |
| API Routes | 80% |

---

## 8. Mocking Strategy

### External services mocked in unit/integration tests:
- GitHub API: nock (Node.js) or httpretty (Python)
- OpenAI / LLM APIs: Recorded fixtures or explicit mocks
- pgvector queries: Test database with seeded embeddings

### Never mock in integration tests:
- Database (use real test DB)
- Business logic (test the real implementation)

---

## 9. Test Naming Convention

```typescript
describe('AuthService', () => {
  describe('login', () => {
    it('should return a JWT token for valid credentials', () => {})
    it('should throw UnauthorizedException for invalid password', () => {})
    it('should throw UnauthorizedException for non-existent user', () => {})
  })
})
```

Format: `should [expected behavior] when [condition]`

---

## 10. Changelog

| Date | Change |
|------|--------|
| 2026-08-09 | Phase 0: Initial testing strategy documented |
