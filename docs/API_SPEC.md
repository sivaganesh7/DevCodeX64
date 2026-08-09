# DevCodeX64 — API Specification

**Version:** 1.0.0
**Last Updated:** 2026-08-09
**Base URL:** http://localhost:3001

---

## 1. Conventions

- All endpoints are prefixed with /api
- Authentication: Bearer token in Authorization header
- Content-Type: application/json
- Timestamps: ISO 8601 (UTC)
- Pagination: ?page=1&limit=20 on list endpoints
- Error format: { error: string, message: string, statusCode: number }

---

## 2. Authentication Endpoints

### POST /api/auth/register
Register a new user with email and password.

Request:
```json
{ "email": "user@example.com", "password": "...", "username": "..." }
```

Response 201:
```json
{ "accessToken": "...", "user": { "id": "...", "username": "...", "email": "..." } }
```

---

### POST /api/auth/login
Authenticate with email and password.

Request:
```json
{ "email": "user@example.com", "password": "..." }
```

Response 200:
```json
{ "accessToken": "...", "user": { ... } }
```

---

### GET /api/auth/github
Initiate GitHub OAuth flow.
Redirects to GitHub authorization page.

---

### GET /api/auth/github/callback
GitHub OAuth callback.
Exchanges code for token, creates/updates user.
Redirects to frontend with token.

---

### POST /api/auth/logout
Invalidate current session.
Response 200: { "message": "Logged out" }

---

### GET /api/auth/me
Get current authenticated user profile.
Response 200: { id, username, email, name, avatarUrl, role }

---

## 3. GitHub Integration Endpoints

### GET /api/github/repositories
List authenticated user's GitHub repositories.
Fetches from GitHub API (not local DB).

Query params: ?page=1&per_page=30&sort=updated

Response 200:
```json
{
  "repositories": [
    { "githubId": 123, "fullName": "owner/repo", "description": "...", "language": "...", "private": false }
  ],
  "total": 45
}
```

---

### GET /api/github/repositories/:fullName/branches
List branches for a GitHub repository.

---

### GET /api/github/repositories/:fullName/commits
List recent commits for a branch.
Query: ?branch=main&limit=20

---

### POST /api/github/connect
Connect the user's GitHub account.
Used after OAuth flow completes.

---

### DELETE /api/github/disconnect
Disconnect GitHub account.
Removes stored GitHub token.

---

## 4. Repository Endpoints

### GET /api/repositories
List repositories saved/analyzed by the current user.

Response 200:
```json
{
  "repositories": [{ "id": "...", "fullName": "...", "lastAnalyzedAt": "...", "healthScore": 82 }],
  "total": 5
}
```

---

### POST /api/repositories
Save a repository for analysis.

Request:
```json
{ "githubId": 123456, "fullName": "owner/repo" }
```

---

### GET /api/repositories/:id
Get repository details including latest analysis summary.

---

### DELETE /api/repositories/:id
Remove repository from the platform.

---

## 5. Analysis Endpoints

### POST /api/repositories/:id/analyze
Start repository analysis.

Request:
```json
{ "branch": "main" }
```

Response 202:
```json
{ "jobId": "...", "status": "QUEUED" }
```

---

### GET /api/repositories/:id/analysis/status
Get current analysis job status.

Response 200:
```json
{
  "jobId": "...",
  "status": "RUNNING",
  "progress": 42,
  "currentStep": "Generating embeddings",
  "startedAt": "...",
  "estimatedCompletionAt": "..."
}
```

---

### GET /api/repositories/:id/analysis/latest
Get the latest completed analysis result.

Response 200:
```json
{
  "id": "...",
  "healthScore": 82,
  "qualityScore": 85,
  "securityScore": 91,
  "testingScore": 68,
  "documentationScore": 73,
  "totalFiles": 124,
  "totalLines": 18432,
  "languageBreakdown": { "TypeScript": 75, "CSS": 15, "JSON": 10 },
  "summary": "A well-structured TypeScript monorepo with...",
  "completedAt": "..."
}
```

---

### GET /api/repositories/:id/analysis/history
List all analysis jobs for this repository.

---

## 6. Files Endpoints

### GET /api/repositories/:id/files
Get repository file tree.

Response 200:
```json
{
  "tree": [
    { "path": "src/index.ts", "type": "file", "size": 1240, "language": "TypeScript" },
    { "path": "src/", "type": "directory", "children": [...] }
  ]
}
```

---

### GET /api/repositories/:id/files/content
Get file content.
Query: ?path=src/auth/auth.service.ts

---

## 7. Code Quality / Issues Endpoints

### GET /api/repositories/:id/issues
List issues found in the latest analysis.

Query params:
- ?severity=HIGH,CRITICAL
- ?type=SECURITY,QUALITY
- ?file=src/auth.ts
- ?resolved=false
- ?page=1&limit=20

---

### GET /api/repositories/:id/metrics
Get code metrics for the repository.

---

### PATCH /api/repositories/:id/issues/:issueId
Update issue status (mark resolved, false positive).

---

## 8. Security Endpoints

### GET /api/repositories/:id/security
Get security findings summary and list.

Response 200:
```json
{
  "summary": { "critical": 2, "high": 5, "medium": 11, "low": 7 },
  "findings": [...]
}
```

---

### GET /api/repositories/:id/security/:findingId
Get single security finding detail.

---

## 9. Dependencies Endpoints

### GET /api/repositories/:id/dependencies
Get dependency analysis results.

Response 200:
```json
{
  "summary": { "total": 126, "outdated": 23, "vulnerable": 7 },
  "dependencies": [...]
}
```

---

## 10. Risk Endpoints

### GET /api/repositories/:id/risk
Get ML risk prediction results.

Response 200:
```json
{
  "repositoryRisk": "MEDIUM",
  "riskScore": 0.52,
  "fileRisks": [
    { "filePath": "src/auth.ts", "riskLevel": "HIGH", "riskScore": 0.78 }
  ]
}
```

---

## 11. AI Assistant Endpoints

### POST /api/repositories/:id/assistant/conversations
Start a new conversation.

---

### GET /api/repositories/:id/assistant/conversations
List conversations for this repository.

---

### POST /api/repositories/:id/assistant/conversations/:convId/messages
Send a message and receive an AI response.

Request:
```json
{ "content": "How does authentication work in this project?" }
```

Response 200 (streaming or non-streaming):
```json
{
  "message": {
    "id": "...",
    "role": "assistant",
    "content": "Authentication is implemented using...",
    "sources": [
      { "file": "src/auth/auth.service.ts", "lineStart": 24, "lineEnd": 48, "snippet": "..." }
    ]
  }
}
```

---

## 12. Code Review Endpoints

### POST /api/repositories/:id/review/file
Request AI code review for a specific file.

Request:
```json
{ "filePath": "src/auth/auth.service.ts" }
```

---

### POST /api/repositories/:id/review/pr
Request AI code review for a pull request.

Request:
```json
{ "pullRequestNumber": 42 }
```

---

## 13. Test Generation Endpoints

### POST /api/repositories/:id/tests/generate
Generate tests for a file or function.

Request:
```json
{ "filePath": "src/utils/hash.ts", "functionName": "hashPassword" }
```

Response 200:
```json
{
  "generatedTestId": "...",
  "testContent": "import { hashPassword } from...",
  "testCases": ["valid input", "empty string", "special characters"],
  "executionStatus": "pending"
}
```

---

### POST /api/repositories/:id/tests/:testId/execute
Execute generated tests in a sandbox.

---

### GET /api/repositories/:id/tests
List all generated tests.

---

## 14. Documentation Generation Endpoints

### POST /api/repositories/:id/documentation/generate
Generate documentation for the repository.

Request:
```json
{ "docType": "README" }
```

---

### GET /api/repositories/:id/documentation
List all generated documentation artifacts.

---

## 15. Pull Request Endpoints

### GET /api/repositories/:id/pull-requests
List pull requests.

---

### GET /api/repositories/:id/pull-requests/:prId
Get pull request details and AI review.

---

### POST /api/webhooks/github
GitHub webhook endpoint.
Validates HMAC-SHA256 signature before processing.
Handles: push, pull_request, pull_request_review events.

---

## 16. Health Endpoint

### GET /api/health
System health check.

Response 200:
```json
{
  "status": "ok",
  "database": "connected",
  "redis": "connected",
  "aiService": "connected",
  "timestamp": "..."
}
```

---

## 17. AI Service Internal API (FastAPI - Not exposed to frontend)

Base URL: http://ai-service:8000 (internal only)

### GET /health
### POST /embed
### POST /rag/query
### POST /review
### POST /risk/predict
### POST /agent/run
### POST /tests/generate
### POST /documentation/generate

---

## 18. Error Codes

| Status | Meaning |
|--------|---------|
| 400 | Bad Request — validation failed |
| 401 | Unauthorized — missing or invalid token |
| 403 | Forbidden — insufficient permissions |
| 404 | Not Found |
| 409 | Conflict — resource already exists |
| 422 | Unprocessable Entity |
| 429 | Too Many Requests — rate limited |
| 500 | Internal Server Error |
| 502 | Bad Gateway — AI service unavailable |
| 503 | Service Unavailable |

---

## 19. Changelog

| Date | Change |
|------|--------|
| 2026-08-09 | Phase 0: Initial API specification documented |
