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

## [PHASE 11] 2026-09-17 - Automated Test Generation + Safe Execution

### Added
- `database/prisma/schema.prisma`: Added `GeneratedTest` entity storing test suites, target files/functions, language, framework (`jest`, `vitest`, `pytest`), execution status (`pending`, `running`, `passed`, `failed`, `error`), terminal output, test case catalogs, and timestamps.
- `apps/ai-service`:
  - `app/schemas/tests.py`: Defined strict Pydantic schemas for `TestGenerationRequest`, `TestCaseItem`, `TestGenerationResponse`, `TestExecutionRequest`, and `TestExecutionResponse`.
  - `app/api/routes/tests.py`: Implemented `POST /tests/generate` and `POST /tests/execute` with strict `<REPOSITORY_CONTENT>` untrusted prompt boundaries, comprehensive test coverage guidelines (Happy path, Edge cases, Boundary conditions, Error handling), and deterministic test suite fallback generators.
  - Built dual sandboxed execution engine: Ephemeral Docker container with `--network none`, `--cpus 0.5`, `-m 256m` limits, and a safe isolated runner fallback with strict timeouts, environment variable sanitization, and AST/syntax validation.
- `apps/api/src/modules/test-generation`:
  - Implemented `TestGenerationService` and `TestGenerationController` with endpoints: `POST /api/repositories/:id/tests/generate`, `POST /api/repositories/:id/tests/:testId/execute`, `GET /api/repositories/:id/tests`, `GET /api/repositories/:id/tests/:testId`, and `DELETE /api/repositories/:id/tests/:testId` (supporting dual `:id` and `:owner/:repo` route styles).
  - Integrated `TestGenerationModule` into `app.module.ts`.
  - Added unit test suite `test-generation.service.spec.ts` (all passed).
- `apps/web/src/features/test-generation`:
  - `TestGeneratorWorkspace.tsx`: Modern dark-mode interface featuring target file input, optional function name, framework selector (`Jest`, `Vitest`, `pytest`), inline code override, code viewer with copy actions, test cases catalog, and a live sandboxed terminal runner.
  - `GeneratedTestsList.tsx`: Complete repository test history view with status chips (`Passed`, `Failed`, `Running`, `Pending`), execution timestamps, one-click sandbox execution, and deletion.
  - `TestGenerationPage.tsx`: Dedicated test generation dashboard with stats indicators and breadcrumb navigation.
  - Registered `/repositories/:owner/:repo/tests` route in `router.tsx`.
  - Added `Tests` tab and quick "Generate Tests" action in `RepositoryDetailsPage.tsx`.
  - Added unit test suite `TestGenerationPage.test.tsx` in `apps/web` (all passed).

## [PHASE 12] 2026-09-17 - Automated Documentation Generation

### Added
- `database/prisma/schema.prisma`: Added `Documentation` entity (mapped to `documentation_artifacts`) storing multi-type documentation, titles, markdown contents, file paths, repository and user foreign keys, and indexes.
- `apps/ai-service`:
  - `app/schemas/documentation.py`: Defined strict Pydantic schemas for `DocType` (`README`, `API`, `ARCHITECTURE`, `FUNCTION`, `SETUP`, `DATABASE`, `DEVELOPER_GUIDE`), `DocumentationGenerationRequest`, and `DocumentationGenerationResponse`.
  - `app/api/routes/documentation.py`: Implemented `POST /generate` endpoint strictly enforcing real repository evidence rules and `<REPOSITORY_CONTENT>` prompt isolation. Built comprehensive deterministic fallback generator for all 7 documentation formats (complete README with badges, REST API reference tables, Mermaid architecture diagrams, function docstrings, developer setup instructions, and ER models).
  - Mounted `documentation.router` in `app/main.py`.
- `apps/api/src/modules/documentation`:
  - Implemented `DocumentationService` and `DocumentationController` supporting `POST /api/repositories/:id/documentation/generate`, `GET /api/repositories/:id/documentation`, `GET /api/repositories/:id/documentation/:docId`, and `DELETE /api/repositories/:id/documentation/:docId` across dual UUID and `owner/repo` route patterns.
  - Registered `DocumentationModule` in `app.module.ts`.
  - Added unit test suite `documentation.service.spec.ts` in `apps/api` (all passed).
- `apps/web/src/features/documentation`:
  - `DocumentationGeneratorWorkspace.tsx`: Multi-document studio with type selection pills, target file input, custom title override, tabbed Rendered Markdown Preview and Raw Markdown Source views, and Copy/Download `.md` export actions.
  - `DocumentationHistoryList.tsx`: Catalog of generated repository documentation artifacts with type chips, timestamps, copy, download, and delete actions.
  - `DocumentationPage.tsx`: Dedicated documentation dashboard with quick stats and breadcrumbs at `/repositories/:owner/:repo/documentation`.
  - Registered `/repositories/:owner/:repo/documentation` route in `router.tsx`.
  - Added `Docs` tab and quick "Generate Docs" action in `RepositoryDetailsPage.tsx`.
  - Added unit test suite `DocumentationPage.test.tsx` in `apps/web` (all passed).

## [PHASE 13] 2026-09-17 - PR Intelligence + Automation

### Added
- `apps/api/src/modules/github`:
  - Added `createComment` to `GitHubClient` and `GitHubService` via `@octokit/rest` `octokit.rest.issues.createComment` to post markdown comments to GitHub pull requests using either GitHub App installation tokens or user OAuth access tokens.
- `apps/api/src/modules/webhooks`:
  - Implemented `WebhooksController` (`POST /api/webhooks/github`) and `WebhooksService` with HMAC-SHA256 signature verification (`x-hub-signature-256`) against `GITHUB_WEBHOOK_SECRET`.
  - Added real-time processing of GitHub `pull_request` events (`opened`, `synchronize`, `reopened`, `closed`).
  - Automated PR synchronization with database `PullRequest` and `PullRequestReview` records, automated AI code review triggering, risk level evaluation, and automated GitHub PR comment posting with formatted review results.
- `apps/api/src/modules/pull-requests`:
  - Created `PullRequestsController` and `PullRequestsService` supporting:
    - `GET /api/repositories/:id/pull-requests` (with optional state filtering: `all`, `open`, `closed`)
    - `GET /api/repositories/:id/pull-requests/:numberOrId` (fetching PR details with full review history)
    - `POST /api/repositories/:id/pull-requests/:numberOrId/analyze` (on-demand PR diff analysis and AI review)
    - `POST /api/repositories/:id/pull-requests/:numberOrId/comment` (publish review as GitHub PR comment)
  - Registered `WebhooksModule` and `PullRequestsModule` in `apps/api/src/app.module.ts`.
  - Added unit test suite `pull-requests.service.spec.ts` in `apps/api` (all passed).
- `apps/web/src/features/pull-requests`:
  - `services/pullRequestsApi.ts`: Client API layer for all PR endpoints.
  - `components/PullRequestsList.tsx`: Rich pull request list with search, state filtering tabs, review status chips, and risk severity indicators.
  - `components/PullRequestReviewViewer.tsx`: Comprehensive PR inspection workspace displaying GitHub metadata, latest review overview, issues by severity, recommendations, and one-click actions ("Run AI Analysis", "Post Review to GitHub").
  - `PullRequestsPage.tsx`: Full PR intelligence hub with repository navigation and summary counters.
  - Added route `/repositories/:owner/:repo/pull-requests` in `apps/web/src/app/router.tsx`.
  - Added `Pull Requests` tab (`PRS`) to `RepositoryDetailsPage.tsx`.
  - Added unit test suite `PullRequestsPage.test.tsx` in `apps/web` (all passed).

## [PHASE 14] 2026-09-17 - CI/CD Intelligence

### Added
- `apps/api/src/modules/github`:
  - Added GitHub Actions API methods to `GitHubClient` and `GitHubService`: `listWorkflows`, `listWorkflowRuns`, `getWorkflowRun`, `listJobsForWorkflowRun`, `reRunWorkflow`, `cancelWorkflowRun`.
- `apps/api/src/modules/ci-cd`:
  - `CiCdService` & `CiCdController`:
    - `GET /api/repositories/:id/ci-cd/workflows`: Workflows metadata.
    - `GET /api/repositories/:id/ci-cd/runs`: Filterable, paginated workflow executions.
    - `GET /api/repositories/:id/ci-cd/runs/:runId`: Detailed run inspector with job breakdowns, step durations, and execution logs.
    - `GET /api/repositories/:id/ci-cd/health`: Real-time pipeline health metrics (overall status, success rate, average duration, MTTR, active workflows).
    - `GET /api/repositories/:id/ci-cd/failure-trends`: 7-day trend breakdown, top failing workflows, flakiness score, and failure trigger distribution.
    - `POST /api/repositories/:id/ci-cd/runs/:runId/rerun`: Re-run workflow execution.
    - `POST /api/repositories/:id/ci-cd/runs/:runId/analyze`: AI failure diagnosis categorizing root causes (`TEST_FAILURE`, `BUILD_ERROR`, `DEPENDENCY_ISSUE`, `LINT_SYNTAX`, `ENVIRONMENT`), explaining impacts, suggesting fixes, and providing local CLI commands.
  - Registered `CiCdModule` in `app.module.ts`.
  - Added comprehensive unit test suite `ci-cd.service.spec.ts` (all passed).
- `apps/web/src/features/ci-cd`:
  - `services/ciCdApi.ts`: Client API layer for all CI/CD intelligence endpoints.
  - `components/PipelineHealthCards.tsx`: Pipeline health cards (Status badge, Success Rate meter, Average Duration, MTTR, Execution Activity, Latest Run snapshot).
  - `components/FailureTrendsChart.tsx`: 7-day trend bar chart, failure hotspots ranking with fail rates, and failure trigger breakdown.
  - `components/WorkflowRunsList.tsx`: Searchable runs table with status filters, branch filter, commit SHA, author, and duration.
  - `components/RunDetailsDrawer.tsx`: Slide-over inspector displaying jobs, step execution timeline, AI failure diagnosis card, and workflow re-run triggers.
  - `CiCdPage.tsx`: Dedicated CI/CD Intelligence workspace.
  - Registered `/repositories/:owner/:repo/ci-cd` route in `router.tsx`.
  - Added `CI/CD` tab (`CICD`) to `RepositoryDetailsPage.tsx`.
  - Added CI/CD Pipeline Health widget to `RepositoryOverviewPage.tsx` with quick status and navigation link.
  - Added unit and component test suite `CiCdPage.test.tsx` (all passed).

## [PHASE 15] 2026-09-17 - Dashboard + UX Refinement

### Added
- `apps/api/src/modules/dashboard`:
  - `DashboardController` & `DashboardService` (`GET /api/dashboard/overview`):
    - Computes platform-wide multi-repository intelligence metrics: overall codebase health score, total tracked repositories, critical/high security vulnerabilities, pending pull requests, completed analyses, generated tests, and documentation artifacts.
    - Generates repository cards with health score meters, maintainability/complexity, vulnerability badges, and latest analysis status.
    - Provides chronological cross-repository activity stream (analysis completions, PR reviews, test suites, documentation, CI runs).
    - Registered `DashboardModule` in `app.module.ts`.
    - Added unit test suite `dashboard.service.spec.ts` (all passed).
- `apps/web/src/components/common`:
  - `EmptyState.tsx`: Reusable empty state component with configurable icons, titles, descriptions, and primary/secondary actions.
  - `LoadingSkeleton.tsx`: Unified shimmer skeleton loaders for cards, tables, metrics, and lists.
  - `ErrorState.tsx`: Reusable error boundary component with retry actions and error messaging.
- `apps/web/src/features/dashboard`:
  - `services/dashboardApi.ts`: Client API layer for multi-repo dashboard overview.
  - `DashboardPage.tsx`: Complete overhaul of `/dashboard` with:
    - 5 executive multi-repo metric cards (Codebase Health %, Repositories, Security Hotspots, Open PRs, CI/CD Pipelines).
    - Quick Feature Launchpad (AI Agent, Test Generator, Evidence Documentation, CI/CD Intelligence).
    - Connected Repositories Grid with search, category filtering (`All`, `Optimal`, `Needs Review`, `Private`), quality indicator chips, and 1-click feature access links.
    - Live cross-repository activity feed stream.
    - Platform Services status footer checking API Gateway, Database, FastAPI engine, and Redis workers.
  - Added unit and component test suite `DashboardPage.test.tsx` (all passed).
- `apps/web/src/components/layout`:
  - `TopBar.tsx` & `Sidebar.tsx`: Added responsive mobile menu toggle with keyboard focus handling, slide-in overlay drawer, and accessibility `aria-label` attributes.
  - `RootLayout.tsx`: State-driven mobile sidebar drawer.


