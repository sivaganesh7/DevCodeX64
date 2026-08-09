# DevCodeX64 — Security Architecture

**Version:** 1.0.0
**Last Updated:** 2026-08-09

---

## 1. Security Principles

1. Defense in depth — multiple layers of protection
2. Least privilege — minimum permissions required
3. Fail securely — errors must not expose sensitive data
4. Zero trust — validate everything, trust nothing
5. Secrets never in code — .env.example only, never .env committed

---

## 2. Threat Model

### 2.1 Attack Surface

| Surface | Risk |
|---------|------|
| React frontend | XSS, token leakage, CSRF |
| NestJS REST API | Auth bypass, injection, SSRF, rate abuse |
| GitHub OAuth flow | Token theft, state parameter forgery |
| GitHub webhook | Webhook forgery, replay attacks |
| Repository ingestion | Path traversal, malicious file content |
| AI prompt input | Prompt injection, context poisoning |
| Generated code execution | RCE on host system |
| Dependency supply chain | Vulnerable packages |

---

## 3. Authentication and Authorization

### 3.1 Authentication Methods

| Method | Usage |
|--------|-------|
| Email/Password | Username + bcrypt-hashed password |
| GitHub OAuth | OAuth 2.0 authorization code flow |
| JWT | Access token (short-lived: 15min) |
| Refresh Token | Long-lived, httpOnly cookie |

**Password requirements:**
- Minimum 8 characters
- Hashed with bcrypt (cost factor >= 12)
- Never stored in plaintext
- Never logged

**JWT:**
- Signed with HS256 or RS256
- Short expiry (15 minutes)
- Refresh via /api/auth/refresh
- Invalidation via refresh token revocation

### 3.2 GitHub Token Security

- GitHub OAuth tokens are NEVER sent to the frontend
- Tokens stored encrypted in database (AES-256-GCM)
- Encryption key set via GITHUB_TOKEN_ENCRYPTION_KEY env var
- Only the NestJS backend uses tokens for GitHub API calls
- Tokens scoped to minimum required: repo, user:email

### 3.3 Authorization

- JWT guard on all protected endpoints
- RolesGuard for admin-only endpoints
- Users can only access their own repositories
- Repository ownership verified on every request

---

## 4. Input Validation

- All API inputs validated using class-validator + class-transformer
- Zod schemas used in workers and shared packages
- File paths sanitized to prevent path traversal
- GitHub repository names validated against allowlist pattern
- Webhook payloads validated before processing

**NestJS Validation Pipe:**
```
ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })
```

---

## 5. SQL Injection Prevention

- All database access via Prisma ORM (parameterized queries)
- Raw SQL via Prisma.$queryRaw with parameterized inputs only
- No string-concatenated SQL queries

---

## 6. XSS Prevention

- React DOM escapes content by default
- Monaco Editor used for code display (sandboxed rendering)
- Content-Security-Policy headers on all API responses
- No use of dangerouslySetInnerHTML without explicit sanitization

---

## 7. CSRF Prevention

- SameSite=Strict on session cookies
- JWT in Authorization header (not cookies) for API requests
- CORS configured to allowlist trusted origins only

---

## 8. SSRF Prevention

SSRF risk exists when the backend fetches external URLs:

**GitHub API calls:**
- Only connect to api.github.com (allowlisted)
- No user-controlled URL passed to fetch functions

**Repository cloning:**
- Only HTTPS clone URLs from github.com allowed
- URL pattern validated before any git clone operation
- No ssh:// or file:// URLs

**AI service calls:**
- Fixed internal URL (AI_SERVICE_URL env var)
- Not user-controllable

---

## 9. Prompt Injection Defense

Repository content is untrusted data.

**Defense measures:**
1. Repository content is always labeled in prompts:
   ```
   <REPOSITORY_CONTENT file="...">
   [content]
   </REPOSITORY_CONTENT>
   ```
2. System prompt explicitly states repository content cannot override instructions
3. LLM temperature set low (0.1) for analysis tasks
4. Structured output enforced via JSON schema validation
5. AI output is never executed directly
6. Agent tool permissions are hardcoded, not LLM-controlled

---

## 10. Webhook Security

GitHub webhooks are validated using HMAC-SHA256:

```typescript
// Verification before any processing
const signature = req.headers['x-hub-signature-256']
const expectedSig = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex')
if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
  throw new UnauthorizedException('Invalid webhook signature')
}
```

- Webhook secret stored in GITHUB_WEBHOOK_SECRET env var
- Timing-safe comparison to prevent timing attacks
- Reject immediately if signature missing or invalid

---

## 11. Generated Code Execution

**CRITICAL:** Generated code must NEVER execute on the host system.

**Required controls:**
- Isolated Docker container (ephemeral, destroyed after execution)
- CPU limit: 0.5 cores
- Memory limit: 256MB
- Timeout: 30 seconds hard kill
- Network: disabled
- Filesystem: read-only + tmpfs scratch
- No access to host filesystem, environment variables, or secrets

**If these controls cannot be guaranteed:**
- The execution feature is DISABLED
- Generated tests are stored only (not executed)
- This limitation is clearly displayed in the UI

---

## 12. Secret Detection

The platform scans repositories for secrets. Ironically, the scanner
itself must not log or expose detected secrets.

**Secret handling:**
- Detected secrets display file/line only
- Actual secret values are NEVER stored in the database
- Detected secrets are NEVER included in AI context/prompts
- Severity: CRITICAL for detected credentials

---

## 13. Dependency Security

- pnpm audit run in CI pipeline on every pull request
- pip-audit run for Python dependencies
- Known vulnerable packages fail the CI build
- Dependency scan results stored and displayed in dashboard

---

## 14. Secret Management

**Environment variables:**
- .env file is in .gitignore — NEVER committed
- .env.example documents all required variables
- All secrets via environment variables only

**Required secrets (never hardcoded):**
- DATABASE_URL
- REDIS_URL
- JWT_SECRET
- GITHUB_CLIENT_ID
- GITHUB_CLIENT_SECRET
- GITHUB_WEBHOOK_SECRET
- GITHUB_TOKEN_ENCRYPTION_KEY
- OPENAI_API_KEY (or other LLM provider key)
- VITE_API_URL (frontend — public, non-secret)

---

## 15. Rate Limiting

| Endpoint Category | Limit |
|-------------------|-------|
| Authentication endpoints | 10 requests/minute per IP |
| Analysis endpoints | 5 starts/hour per user |
| AI assistant | 100 messages/hour per user |
| General API | 300 requests/minute per user |
| Webhook | 1000 events/hour per repository |

---

## 16. Security Headers

Applied via NestJS Helmet middleware:

- Content-Security-Policy
- X-XSS-Protection
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (HSTS)
- Referrer-Policy: strict-origin-when-cross-origin

---

## 17. Audit Logging

Security-relevant events logged to audit_logs table:

- User login (success and failure)
- GitHub connect/disconnect
- Repository added/removed
- Analysis started
- Webhook received
- Admin actions
- Rate limit exceeded

Logs include: user_id, ip_address, user_agent, action, timestamp

---

## 18. Security Audit Checklist (Phase 19)

Before production release, verify:

[ ] No secrets in source code or git history
[ ] All endpoints authenticated/authorized appropriately
[ ] Input validation on all API endpoints
[ ] SQL injection impossible via ORM usage
[ ] XSS mitigated by React + CSP headers
[ ] CSRF mitigated by SameSite cookies + header auth
[ ] SSRF prevented by URL allowlisting
[ ] Prompt injection defended
[ ] Webhook signatures validated
[ ] Generated code cannot execute on host
[ ] GitHub tokens encrypted at rest
[ ] Rate limiting active
[ ] pnpm audit passes
[ ] pip-audit passes
[ ] Security headers present

---

## 19. Changelog

| Date | Change |
|------|--------|
| 2026-08-09 | Phase 0: Initial security architecture documented |
