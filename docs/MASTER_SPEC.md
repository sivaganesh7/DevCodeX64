# DevCodeX64 — Master Specification

**Version:** 1.0.0
**Status:** Phase 0 — Architecture Foundation
**Last Updated:** 2026-08-09
**Official Project Name:** DevCodeX64
**Official Subtitle:** Code Intelligence & DevSecOps Platform

---

## Deprecated Names

The following names are retired and must NOT appear in any new code,
documentation, UI, or configuration:

- DevOpsAI
- CodePilot Enterprise
- DevOrvex

Use **DevCodeX64** exclusively.

---

## 1. Project Vision

DevCodeX64 is a full-stack Code Intelligence and DevSecOps platform
designed for modern software engineering teams.

The platform connects to GitHub repositories and analyzes real software
projects, providing developers with a centralized engineering intelligence
workspace.

### Core Capabilities

| Domain | Features |
|--------|----------|
| Repository Intelligence | File tree, language stats, LOC, complexity |
| Code Quality | Complexity analysis, code smells, duplication, naming |
| Security | Secret detection, static vulnerability analysis, config issues |
| Dependencies | Outdated, vulnerable, unlicensed dependencies |
| ML Risk Prediction | Defect-risk scoring per file/module (LOW/MEDIUM/HIGH/CRITICAL) |
| RAG Assistant | Repository-aware Q&A grounded in actual codebase |
| Code Review | AI-structured review of files, commits, PRs |
| AI Agent | Orchestrated tool-calling agent for repository investigation |
| Test Generation | AI-generated tests with sandboxed execution |
| Documentation | AI-generated README, API docs, architecture docs |
| PR Intelligence | Automated PR analysis via GitHub webhooks |
| CI/CD Intelligence | Pipeline health, failure trends |
| Developer Analytics | Contribution patterns, activity heatmaps |
| Audit Logging | All significant system actions recorded |

---

## 2. Primary User Workflow

```
User
 down
Register / Login (email+password or GitHub OAuth)
 down
Connect GitHub Account
 down
Select Repository
 down
Select Branch
 down
Start Analysis
 down
NestJS creates AnalysisJob
 down
Redis / BullMQ
 down
Background Worker (repository-worker)
 down
Repository ingestion (clone / fetch via GitHub API)
 down
Code parsing (language detection, file tree)
 down
Static analysis (complexity, smells, duplication)
 down
Security analysis (secrets, CVEs, config)
 down
Dependency analysis (npm/pip/maven manifest parsing)
 down
Code metrics (LOC, cyclomatic complexity, function count)
 down
ML risk prediction (FastAPI ML service)
 down
Code chunking + embedding generation (FastAPI embedding service)
 down
pgvector storage
 down
Repository intelligence generation (AI summary)
 down
Dashboard available
```

---

## 3. Data Integrity Requirements

**CRITICAL:** The system must work with real data.

**Prohibited:**
- Fake production analytics
- Hardcoded repository statistics
- Fake security findings
- Fake ML predictions
- Fake AI responses
- Hardcoded health scores

**Permitted:**
- Mock/seed data during UI development when clearly labeled as development/demo data
- Placeholder UI states showing loading spinners or "no data yet" messages

---

## 4. Roles and Permissions

| Role | Description |
|------|-------------|
| USER | Standard authenticated user - full access to their own repositories |
| ADMIN | Platform administrator - additional management capabilities |

---

## 5. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| API response time | < 300ms for cached/simple queries |
| Analysis job start | < 2s from request |
| RAG response | < 5s |
| Frontend initial load | < 2s |
| Concurrent analysis jobs | At least 5 |
| Authentication | JWT + optional GitHub OAuth |
| Rate limiting | Applied per user/IP |
| Logging | Structured JSON logs |
| Error handling | All boundaries must handle errors explicitly |
| Secrets | Never in source control; .env.example only |

---

## 6. Agent Rules Reference

All engineering agents must read and follow:

.agents/rules/00-core.md
.agents/rules/01-architecture.md
.agents/rules/02-frontend.md
.agents/rules/03-backend.md
.agents/rules/04-ai-ml.md
.agents/rules/05-database.md
.agents/rules/06-security.md
.agents/rules/07-testing.md

---

## 7. Definition of Done

A feature is COMPLETE only when ALL of the following hold:

[ ] Implementation exists and is functional
[ ] REST API works and returns correct responses
[ ] Database persists and retrieves data correctly
[ ] Authentication and authorization are enforced
[ ] Input validation is in place
[ ] Error handling exists at all boundaries
[ ] Unit tests pass
[ ] Integration tests pass
[ ] Lint passes
[ ] Type checking passes
[ ] Browser behavior verified (UI features)
[ ] No critical security issues
[ ] No secrets exposed
[ ] Documentation updated

---

## 8. Specification Source History

| Date | Change |
|------|--------|
| 2026-08-09 | Phase 0 complete. Name standardized to DevCodeX64. |
