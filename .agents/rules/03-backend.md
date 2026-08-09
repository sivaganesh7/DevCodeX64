# DevCodeX64 — Backend Engineering Rules

Applies to all work in apps/api/ and workers/

Read docs/ARCHITECTURE.md before modifying any module structure.

---

## NestJS Architecture

Use NestJS modular architecture strictly.

Each feature is a NestJS Module containing:
- module.ts (imports, providers, exports)
- controller.ts (route handlers, DTOs)
- service.ts (business logic)
- Optional: guard.ts, dto/*.ts, entities/, types.ts

One module per domain:
auth, users, github, repositories, analysis, security,
dependencies, risk, issues, assistant, code-review,
test-generation, documentation, pull-requests, webhooks, jobs, health

Do NOT put multiple features in one module.
Do NOT put business logic in controllers (controllers are thin).

---

## Controller Rules

1. Controllers handle HTTP, validate input, call services, return responses.
2. No business logic in controllers.
3. All DTOs validated via class-validator decorators.
4. Use @UseGuards(JwtAuthGuard) on all protected endpoints.
5. Use @Roles(Role.ADMIN) for admin-only endpoints.
6. Use proper HTTP status codes (@HttpCode decorator where needed).

---

## Service Rules

1. Services contain ALL business logic.
2. Services call other services or Prisma — never raw SQL strings.
3. Services handle database errors and throw appropriate NestJS exceptions.
4. Services are testable in isolation (injected dependencies).

---

## Database Rules (see also 05-database.md)

1. ALL database access via Prisma Client.
2. Never write raw SQL string concatenation.
3. Raw SQL only via prisma.$queryRaw with parameterized inputs.
4. Transactions for operations that must be atomic.
5. Repository pattern optional — using Prisma directly in services is acceptable.

---

## DTO and Validation Rules

1. All request bodies must have a DTO class with class-validator decorators.
2. Use ValidationPipe globally with whitelist: true, forbidNonWhitelisted: true.
3. All DTOs use TypeScript types (no any).
4. Use @IsUUID, @IsString, @IsEmail, @Min, @Max, etc. precisely.

Example:
```typescript
export class CreateAnalysisDto {
  @IsUUID()
  repositoryId: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  branch: string
}
```

---

## Authentication and Authorization

1. JwtAuthGuard applied to all endpoints that require authentication.
2. Public endpoints must be explicitly decorated with @Public().
3. Users can only access their own resources — enforce ownership in services.
4. ADMIN role required for platform administration endpoints.
5. GitHub token extracted from DB (decrypted) — never from request headers.

---

## Error Handling

NestJS exception types to use:

| Situation | Exception |
|-----------|-----------|
| Resource not found | NotFoundException |
| Not authenticated | UnauthorizedException |
| Not authorized | ForbiddenException |
| Validation failed | BadRequestException |
| Resource conflict | ConflictException |
| External service down | ServiceUnavailableException |

All unhandled exceptions are caught by the global exception filter.
Never let Prisma errors propagate unhandled to the client.
Map PrismaClientKnownRequestError codes to appropriate NestJS exceptions.

---

## AI Service Communication

When calling the FastAPI AI service:

1. Use the configured HttpService (Axios) with AI_SERVICE_URL from config.
2. Handle timeout (default: 30s for standard calls, 120s for embeddings).
3. Handle 502/503 from AI service gracefully (return degraded response, not crash).
4. Log AI service calls with request ID for tracing.
5. Never expose AI service internal errors to the frontend.

---

## GitHub API Rules

1. All GitHub API calls use the user's stored (decrypted) OAuth token.
2. Never use a global GitHub token for user-specific operations.
3. Handle GitHub rate limiting: 429 ? retry with exponential backoff.
4. Handle GitHub 401 (token expired) ? prompt user to reconnect.
5. Validate repository URLs before any clone or API operation.
6. Only HTTPS clone URLs from github.com are allowed.

---

## Worker Rules

1. Workers register one queue processor per BullMQ queue.
2. Workers update job progress via job.updateProgress(percentage).
3. Workers update AnalysisJob.status and AnalysisJob.current_step in DB.
4. On failure: set status to FAILED, store error_message.
5. On success: set status to COMPLETED, store completedAt.
6. Workers must handle partial failures gracefully.
7. Cleanup temp files after job completion (success or failure).

---

## Logging

Use NestJS Logger for all services.
Log format: structured JSON in production, colored text in development.

Log levels:
- ERROR: unexpected failures, external service errors
- WARN: recoverable issues, rate limiting, retries
- LOG: key lifecycle events (job started, analysis complete)
- DEBUG: detailed tracing (disabled in production)
- VERBOSE: very detailed (disabled in production)

Include: requestId, userId, repositoryId, jobId in log context where relevant.

---

## Security

See 06-security.md for full security rules.

Backend-specific:
1. Apply Helmet middleware globally.
2. Apply CORS with explicit allowlist.
3. Apply rate limiting (Throttler) on all endpoints.
4. Validate webhook signatures before processing.
5. Sanitize file paths from repository content.
