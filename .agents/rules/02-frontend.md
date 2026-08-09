# DevCodeX64 — Frontend Engineering Rules

Applies to all work in apps/web/

Read docs/UI_UX.md for design specifications.

---

## Technology

Framework: React 18 (NOT Next.js)
Build: Vite
Language: TypeScript (strict mode)
Styling: Tailwind CSS + shadcn/ui
State (server): TanStack Query (React Query)
State (client): React Context or Zustand (minimal local state only)
Forms: React Hook Form + Zod
HTTP: Axios (to NestJS only)
Charts: Recharts
Code viewer: Monaco Editor
Icons: Lucide React
Animation: Framer Motion (sparingly)
Routing: React Router v6

---

## Architecture: Feature-Oriented

DO use feature-oriented structure under src/features/:
- Each feature owns its pages, components, hooks, API functions, types
- Cross-feature UI goes in src/components/
- Shared utilities go in src/lib/ or src/utils/

DO NOT:
- Put everything in a single src/components/ folder
- Create one massive App.tsx
- Mix feature logic between different feature directories

---

## Data Fetching Rules

1. ALL server state is managed via TanStack Query.
2. Never fetch data in useEffect without TanStack Query.
3. API calls go in src/services/ or in the feature's api.ts file.
4. Never hardcode API base URLs; use the configured Axios instance.
5. Always handle loading, error, and empty states.

```typescript
// CORRECT: TanStack Query
const { data, isLoading, error } = useQuery({
  queryKey: ['repository', id],
  queryFn: () => repositoriesApi.getById(id),
})

// WRONG: raw useEffect
useEffect(() => {
  fetch('/api/repositories/' + id).then(...)
}, [id])
```

---

## State Management

- Server state: TanStack Query ONLY
- Form state: React Hook Form ONLY
- UI state (modals, tabs, etc.): useState / useReducer in component
- Global client state (auth, theme): React Context
- Do NOT add Redux, Zustand, Jotai, or other state libraries without an ADR

---

## TypeScript Rules

- All props must have TypeScript interfaces (no any)
- All API response types must match the backend contracts in packages/types
- Use Zod for runtime validation of form inputs
- Strict null checks: always handle null/undefined

---

## Component Rules

1. One component per file.
2. Components should be focused (< 200 lines guideline).
3. Extract complex logic into custom hooks.
4. Use shadcn/ui components before building custom ones.
5. All interactive elements must have unique IDs for testing.
6. No inline styles; use Tailwind classes.
7. No magic numbers; use Tailwind config tokens.

---

## Security Rules

1. Never store sensitive tokens in localStorage (use memory or sessionStorage).
2. Never render raw HTML from API responses (XSS risk).
3. Always sanitize user-generated content before display.
4. API base URL from environment variable, never hardcoded.

---

## Performance Rules

1. Use React.lazy + Suspense for route-level code splitting.
2. Use TanStack Query caching to avoid redundant API calls.
3. Paginate all large lists (never load all items).
4. Use skeleton loading states (never blank page during load).
5. Images: use proper dimensions, lazy loading.

---

## UI/UX Rules

1. Every page must have: loading state, error state, empty state.
2. Analysis status must poll every 3 seconds when job is RUNNING.
3. Severity badges must use the colors from UI_UX.md.
4. Health scores displayed with the correct color thresholds.
5. Mock data must display a visible "DEMO DATA" banner.
6. All tables must have: sorting, pagination, search, empty state.
7. Do not display fake numbers or fake analysis results.

---

## Testing Rules

Framework: Vitest + React Testing Library

Test:
- All custom hooks
- All forms (validation scenarios)
- All critical page components (render + interaction)
- API error handling (simulate 400/500 responses)

Do NOT test implementation details.
Test behavior from the user's perspective.
