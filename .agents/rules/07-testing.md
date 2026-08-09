# DevCodeX64 — Testing Rules

Read docs/TESTING.md for the complete testing strategy.

---

## Non-Negotiable

1. Tests must pass before any phase is declared complete.
2. Lint must pass before any phase is declared complete.
3. Type checking must pass before any phase is declared complete.
4. Do not mock what you intend to test.
5. Do not write tests that always pass regardless of implementation.
6. Do not skip tests to meet a deadline — fix the code or document the blocker.

---

## What Must Be Tested

### Authentication (Phase 2)
- Valid login returns JWT
- Invalid password returns 401
- Non-existent user returns 401
- Duplicate registration returns 409
- Protected endpoints return 401 without token
- Protected endpoints return 403 for wrong role

### GitHub Integration (Phase 3)
- GitHub repositories endpoint requires auth
- Invalid GitHub token returns 401
- Rate limit handling (mock GitHub returning 429)

### Repository Ingestion (Phase 4)
- Analysis job created and queued on POST /analyze
- Invalid repository ID returns 404
- Unauthorized user cannot start analysis on another user's repo

### Analysis (Phase 5+)
- Health scores calculated from real metrics (not hardcoded)
- Issues stored with correct file/line/severity data

### Security (Phase 6)
- Secret patterns correctly detected
- Secret values NOT stored in DB
- Dependency vulnerabilities correctly flagged

### ML (Phase 7)
- Feature extraction produces expected types and ranges
- Prediction returns valid risk level
- Model evaluation metrics are real numbers (not hardcoded)

### RAG (Phase 8)
- Embeddings stored in pgvector
- Similarity search returns relevant chunks
- LLM response includes source citations

### Webhooks (Phase 13)
- Valid signature accepted
- Invalid signature rejected (401)
- Missing signature rejected (401)
- Timing-safe comparison used (not simple string equality)

---

## Test Structure (Node.js / NestJS)

```typescript
describe('AuthService', () => {
  describe('login', () => {
    it('should return a JWT for valid credentials', async () => {
      // Arrange
      const credentials = { email: 'test@test.com', password: 'Test1234!' }
      // Act
      const result = await authService.login(credentials)
      // Assert
      expect(result.accessToken).toBeDefined()
    })

    it('should throw UnauthorizedException for wrong password', async () => {
      await expect(
        authService.login({ email: 'test@test.com', password: 'wrong' })
      ).rejects.toThrow(UnauthorizedException)
    })
  })
})
```

---

## Test Structure (Python / FastAPI)

```python
def test_risk_prediction_returns_valid_level(client, sample_features):
    response = client.post("/risk/predict", json=sample_features)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    assert 0.0 <= data["risk_score"] <= 1.0
```

---

## Mock Guidelines

| Dependency | Unit Test | Integration Test |
|-----------|-----------|-----------------|
| Database (Prisma) | Mock with jest.mock | Real test DB |
| Redis / BullMQ | Mock | Real Redis (Docker) |
| GitHub API | Mock with nock | Mock with nock |
| OpenAI / LLM | Mock with fixture | Recorded fixture |
| FastAPI AI service | Mock in NestJS | Real service (Docker) |

---

## Coverage Targets

Minimum acceptable line coverage per service:

| Service | Target |
|---------|--------|
| apps/api | 70% |
| apps/web | 60% |
| apps/ai-service | 70% |
| workers | 65% |

Coverage alone is not sufficient — tests must test meaningful behavior.

---

## E2E Test Scope (Phase 16)

Playwright E2E tests must cover:
1. Register ? Login
2. Connect GitHub ? List repos
3. Select repo ? Start analysis
4. Poll status until COMPLETED
5. View overview, security, dependencies pages
6. Send AI assistant message ? receive response with sources
7. Trigger PR webhook ? verify review posted

E2E tests run against: docker compose up (full stack)

---

## CI Test Requirements

All of these must pass in GitHub Actions on every PR:

- pnpm typecheck (TypeScript)
- pnpm lint (ESLint)
- pnpm test (unit tests)
- pnpm test:integration (integration tests)
- pnpm audit --audit-level=high (dependency security)
- pytest (Python unit tests)
- pip-audit (Python dependency security)

E2E tests run on merge to main (not every PR).
