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
