# DevCodeX64 - Changelog

All notable changes to this project will be documented in this file.

Format: [PHASE X] [date] description

---

## [PHASE 0] 2026-08-09 - Architecture Foundation

### Added
- docs/MASTER_SPEC.md - Complete project specification
- docs/ARCHITECTURE.md - System architecture with service boundaries
- docs/DATABASE.md - Full database entity design (20 entities)
- docs/API_SPEC.md - REST API specification (NestJS + FastAPI internal)
- docs/AI_ARCHITECTURE.md - RAG, ML, Agent, Code Review, Test Gen architecture
- docs/SECURITY.md - Security architecture, threat model, checklist
- docs/TESTING.md - Testing strategy (unit, integration, E2E, security)
- docs/UI_UX.md - UI specification, design system, page inventory
- docs/ROADMAP.md - Phase-by-phase implementation plan with dependency graph

## [PHASE 2] 2026-08-09 - Authentication & Authorization

### Added
- Basic User database entity for authentication.
- AuthModule and UsersModule in NestJS backend.
- Local and JWT Passport strategies with HTTP-only cookies.
- /auth/register, /auth/login, /auth/logout, /auth/me endpoints.
- /users/me endpoint for profile updates.
- React frontend authentication state via TanStack Query (useAuth).
- /login, /register, and /settings pages.
- ProtectedRoute logic for dashboard and authenticated routes.

## [PHASE 8] 2026-08-18 - RAG Repository Intelligence

### Added
- `workers/embedding-worker`: AST-aware code chunking (Babel for JS/TS, sliding window for multi-language), vector embeddings generation, and PostgreSQL `code_chunks` vector storage.
- `apps/api/src/modules/assistant`: NestJS `AssistantController` and `AssistantService` for conversation threads, messages, on-demand codebase indexing, and RAG retrieval orchestration.
- `apps/ai-service`: Prompt injection defense isolating `<REPOSITORY_CONTENT>` untrusted delimiters, cosine similarity search, and structured source citations.
- `apps/web/src/features/assistant`: Full AI Assistant chat UI, conversation manager, confidence tags, quick prompt starters, and `CitationDrawer` with code line snippets and file references.
- Added Assistant tab in `RepositoryDetailsPage` and dedicated `/repositories/:owner/:repo/assistant` route.
- Unit tests for `AssistantService` in NestJS backend.

## [PHASE 9] 2026-09-17 - Intelligent Code Review

### Added
- `apps/ai-service`: Pydantic output schemas enforcing `ReviewResponse` format (`overallRating`, `issues`, `positives`, `recommendations`) with prompt injection defenses wrapping code in `<REPOSITORY_CONTENT>` and `<DIFF>`. Built-in deterministic heuristic reviewer fallback engine for continuous uptime.
- `database/prisma/schema.prisma`: Added `CodeReview`, `PullRequest`, and `PullRequestReview` models with Prisma client generation.
- `apps/api/src/modules/code-review`: Implemented `CodeReviewController` and `CodeReviewService` supporting single-file code reviews (`POST /api/repositories/:id/review/file`), pull request diff reviews (`POST /api/repositories/:id/review/pr`), and review history retrieval.
- `apps/api/src/modules/github`: Added `getPullRequest` and `getPullRequestDiff` methods to `GitHubClient` and `GitHubService`.
- `apps/web/src/features/code-review`: Created comprehensive Code Review interface with `CodeReviewWorkspace`, `ReviewSummaryCard`, `ReviewIssuesList` (multi-dimensional severity & category filters), and `ReviewPositivesAndRecs`. Includes one-click GitHub Markdown export for PR review comments.
- Added dedicated `/repositories/:owner/:repo/review` route in `router.tsx` and an integrated `Review` tab within `RepositoryDetailsPage`.
- Unit tests for `CodeReviewService` in `apps/api` and component tests for code review UI in `apps/web`.

## [PHASE 10] 2026-09-17 - AI Engineering Agent

### Added
- `apps/ai-service`: Implemented autonomous ReAct (Reason + Act) loop engine (`app/core/agents/orchestrator.py`) executing iterative `Thought -> Action -> Observation -> Final Answer` workflows with prompt injection boundaries (`<REPOSITORY_CONTENT>`), max 10 iterations, and step-level timeouts.
- `apps/ai-service/app/core/agents/tools.py`: Built hardcoded `ToolRegistry` exposing strictly controlled engineering tools (`search_repository`, `search_code`, `read_file`, `get_file_structure`, `get_code_metrics`, `get_security_findings`, `get_dependencies`, `search_embeddings`, `generate_tests`, `generate_documentation`) with hardcoded permission gates (`READ`, `GENERATE`) forbidding dangerous execution tools (`execute_shell`, `write_file`, `delete_file`).
- `apps/ai-service/app/api/routes/agent.py`: Added `POST /agent/run` endpoint with schema validation and fallback execution.
- `apps/api/src/modules/assistant`: Added `POST /repositories/:id/assistant/agent` and owner/repo endpoints in `AssistantController` and `runAgentTask` in `AssistantService`, persisting reasoning traces into conversation messages and metadata.
- `apps/web/src/features/assistant`: Integrated interactive Agent mode switcher (`Standard Chat` vs `Engineering Agent`) with safety policy indicators in `AssistantChat.tsx`.
- `apps/web/src/features/assistant/components/AgentTraceViewer.tsx`: Built collapsible ReAct step trace inspector displaying thoughts, tool parameters, invocation duration, and structured observations.
- Unit and component tests in `apps/api` and `apps/web` validating agent execution and trace viewer rendering.
