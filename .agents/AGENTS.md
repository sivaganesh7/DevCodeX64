# DevCodeX64 — Agent Configuration

## Project Identity

Project Name: DevCodeX64
Subtitle: Code Intelligence & DevSecOps Platform
Deprecated names: DevOpsAI, CodePilot Enterprise, DevOrvex

---

## MANDATORY FIRST STEPS

Before performing ANY task:

1. Read docs/MASTER_SPEC.md
2. Read docs/ARCHITECTURE.md
3. Read docs/ROADMAP.md
4. Read ALL files in .agents/rules/ (00 through 07)
5. Inspect the relevant existing code

---

## Engineering Rules

All agents must follow the rules in .agents/rules/:

.agents/rules/00-core.md       — Core rules (applies to ALL agents)
.agents/rules/01-architecture.md — Service boundary and tech stack rules
.agents/rules/02-frontend.md   — React frontend rules
.agents/rules/03-backend.md    — NestJS backend rules
.agents/rules/04-ai-ml.md      — AI/ML service rules
.agents/rules/05-database.md   — Database and Prisma rules
.agents/rules/06-security.md   — Security rules
.agents/rules/07-testing.md    — Testing rules

---

## Phase Isolation

The project is built in phases. See docs/ROADMAP.md for the phase plan.

NEVER implement features from a future phase.
NEVER skip phases.
ALWAYS verify the current phase before moving to the next.

---

## Documentation

Docs are in docs/:

docs/MASTER_SPEC.md    — Project specification (source of truth)
docs/ARCHITECTURE.md   — System architecture
docs/DATABASE.md       — Database design
docs/API_SPEC.md       — REST API specification
docs/AI_ARCHITECTURE.md — AI/ML architecture
docs/SECURITY.md       — Security architecture
docs/TESTING.md        — Testing strategy
docs/UI_UX.md          — UI/UX specification
docs/ROADMAP.md        — Implementation roadmap
docs/DECISIONS.md      — Architecture decision log
docs/CHANGELOG.md      — Change history

Update documentation whenever architecture changes.
