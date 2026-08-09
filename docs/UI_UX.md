# DevCodeX64 — UI/UX Specification

**Version:** 1.0.0
**Last Updated:** 2026-08-09
**Framework:** React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui

---

## 1. Design Principles

| Principle | Guidance |
|-----------|----------|
| Professional | Resembles tools like GitHub, Linear, Datadog |
| Technical | Information-dense, not decorative |
| Clean | Clear hierarchy, minimal visual noise |
| Responsive | Works on 1280px+ desktop; usable on 768px+ tablet |
| Accessible | WCAG 2.1 AA target |
| Fast | Skeleton states, optimistic updates, progressive loading |
| Consistent | shadcn/ui component library, consistent spacing/color |

**Avoid:**
- Excessive animations or transitions (> 200ms feels slow)
- 3D effects or parallax
- Fake statistics or placeholders that look real
- Generic AI chatbot styling
- Excessive gradient abuse

---

## 2. Design System

### 2.1 Color Palette

| Token | Usage |
|-------|-------|
| --background | Page background (dark: #09090b) |
| --foreground | Primary text |
| --card | Card background |
| --border | Border color |
| --primary | Primary action color (brand blue) |
| --muted | Secondary text, disabled states |
| --destructive | Error states, critical severity |

**Severity colors:**
- CRITICAL: red-600
- HIGH: orange-500
- MEDIUM: yellow-500
- LOW: blue-500
- INFO: gray-500

**Risk colors:**
- CRITICAL: red-600
- HIGH: orange-500
- MEDIUM: yellow-500
- LOW: green-500

### 2.2 Typography

- Font: Inter (Google Fonts) or system-ui fallback
- Code font: JetBrains Mono or Fira Code (Monaco Editor)
- Heading scale: text-2xl, text-xl, text-lg, text-base
- Body: text-sm (14px) for dense data tables

### 2.3 Spacing

- Base unit: 4px (Tailwind default)
- Card padding: 24px (p-6)
- Section gap: 24px (gap-6)
- Compact table row: 40px height

---

## 3. Application Layout

```
+---------------------------+------------------------------------+
|  SIDEBAR (240px)          |  MAIN CONTENT AREA                 |
|  DevCodeX64 logo          |  Top bar (breadcrumb + actions)    |
|  ---                      |                                    |
|  Dashboard                |  Page content                      |
|  Repositories             |                                    |
|  ---                      |                                    |
|  [Repository selected]    |                                    |
|    Overview               |                                    |
|    Files                  |                                    |
|    Security               |                                    |
|    Dependencies           |                                    |
|    Issues                 |                                    |
|    Risk                   |                                    |
|    AI Assistant           |                                    |
|    Code Review            |                                    |
|    Tests                  |                                    |
|    Documentation          |                                    |
|    Pull Requests          |                                    |
|  ---                      |                                    |
|  Settings                 |                                    |
|  User avatar/name         |                                    |
+---------------------------+------------------------------------+
```

On mobile (< 768px): Sidebar collapses to hamburger menu.

---

## 4. Required Pages and Routes

| Route | Page | Key Components |
|-------|------|----------------|
| /login | LoginPage | Email/password form, GitHub OAuth button |
| /register | RegisterPage | Registration form |
| /dashboard | DashboardPage | Overview stats, recent repos, activity |
| /repositories | RepositoriesPage | Repository list, search, add new |
| /repositories/:id | RepositoryLayoutPage | Redirect to /overview |
| /repositories/:id/overview | OverviewPage | Health scores, summary, quick stats |
| /repositories/:id/files | FilesPage | Directory tree, file viewer (Monaco) |
| /repositories/:id/security | SecurityPage | Findings table, severity breakdown |
| /repositories/:id/dependencies | DependenciesPage | Dependency table, vulnerability count |
| /repositories/:id/issues | IssuesPage | Filterable/searchable issue table |
| /repositories/:id/risk | RiskPage | ML risk chart, per-file risk table |
| /repositories/:id/assistant | AssistantPage | Chat interface with source citations |
| /repositories/:id/review | ReviewPage | Code review interface |
| /repositories/:id/tests | TestsPage | Test generation and execution UI |
| /repositories/:id/documentation | DocumentationPage | Doc generation and viewer |
| /repositories/:id/pull-requests | PullRequestsPage | PR list and AI review results |
| /settings | SettingsPage | User profile, GitHub connection, tokens |

---

## 5. Key Component Patterns

### 5.1 Analysis Progress

When analysis is running, display a progress card:
- Status badge (QUEUED / RUNNING / COMPLETED / FAILED)
- Progress bar (0-100%)
- Current step label ("Generating embeddings...")
- Elapsed time
- Estimated completion (if calculable)
- Cancel button (for QUEUED/RUNNING states)

### 5.2 Severity Badge

```
CRITICAL  [red filled badge]
HIGH      [orange filled badge]
MEDIUM    [yellow filled badge]
LOW       [blue filled badge]
INFO      [gray outlined badge]
```

### 5.3 Health Score

Display as a circular gauge or horizontal bar:
- 0-49: red (poor)
- 50-69: yellow (needs improvement)
- 70-84: blue (good)
- 85-100: green (excellent)

### 5.4 Repository File Tree

- Collapsible directories
- File type icons (from lucide-react)
- Language badge
- Click to open in Monaco Editor viewer

### 5.5 AI Assistant Chat

```
+-----------------------------------------------+
| Repository AI Assistant                        |
+-----------------------------------------------+
| [Message history with role labels]             |
|                                                |
| Assistant message includes:                    |
| - Answer text (markdown rendered)              |
| - Source citations (clickable file links)      |
|   src/auth/auth.service.ts:24-48              |
+-----------------------------------------------+
| [Input textarea] [Send button]                 |
+-----------------------------------------------+
```

### 5.6 Data Tables

All data tables must have:
- Column sorting
- Pagination (20 items default)
- Search/filter
- Row selection (where applicable)
- Empty state (when no data)
- Loading skeleton state

### 5.7 Error States

All pages must handle:
- Loading state: skeleton UI
- Empty state: clear message + action
- Error state: error message + retry button
- Unauthorized state: redirect to login

---

## 6. Mock Data Policy

During UI development before backend APIs are available:
- Mock data is allowed and clearly labeled with a banner:
  ```
  [!] DEMO DATA — Connect a real repository to see actual analysis
  ```
- Mock data must be realistic in structure but not real user data
- All mock data fetches must be easily replaceable by real API calls
- TanStack Query is used for all data fetching — replace mock with real query

---

## 7. Loading Strategy

- TanStack Query handles all server state
- Skeleton components shown during initial load
- Error boundaries at route level
- Optimistic updates for status toggles (mark resolved, etc.)
- Polling for analysis job status (every 3 seconds while RUNNING)

---

## 8. Accessibility Requirements

- All interactive elements have accessible labels
- Keyboard navigation works on all forms and tables
- Focus management on modal open/close
- Color is not the only indicator (text labels alongside severity colors)
- ARIA roles on custom components (tabs, dialogs, status indicators)

---

## 9. Changelog

| Date | Change |
|------|--------|
| 2026-08-09 | Phase 0: Initial UI/UX specification documented |
