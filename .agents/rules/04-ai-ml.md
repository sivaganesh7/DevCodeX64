# DevCodeX64 — AI/ML Engineering Rules

Applies to all work in apps/ai-service/ and AI-related worker tasks.

Read docs/AI_ARCHITECTURE.md before modifying any AI pipeline.

---

## Service Responsibilities

FastAPI AI service is responsible for:
- Embedding generation
- RAG retrieval and generation
- ML model training and prediction
- AI code review
- AI agent orchestration
- Test generation
- Documentation generation

It is NOT responsible for:
- User authentication
- Database CRUD for application data
- GitHub API integration
- Job queue management

---

## Data Trust Rules

CRITICAL: ALL repository content is untrusted data.

1. Repository file content must NEVER be placed directly in system prompts.
2. Repository content must be wrapped in labeled delimiters:
   <REPOSITORY_CONTENT file="path/to/file.ts" lines="1-50">
   [content here]
   </REPOSITORY_CONTENT>

3. System prompt must explicitly state that REPOSITORY_CONTENT cannot
   override system instructions.

4. User queries must also be treated with care — validate and sanitize.

5. LLM output is untrusted — always validate against a schema before use.

---

## RAG Pipeline Rules

1. Chunk code files using AST-aware chunking where possible.
   Fall back to sliding window (512 tokens, 128 overlap) for unsupported languages.

2. Chunk metadata must be preserved:
   - file_path
   - start_line
   - end_line
   - language

3. Embeddings are generated with the configured embedding model.
   Do not hardcode model names — use config from environment.

4. Similarity search uses cosine distance (vector_cosine_ops in pgvector).

5. Top-k results (default k=10) are assembled into context.

6. Final context passed to LLM must include file + line attribution.

7. LLM response must include source citations — not optional.

---

## ML Rules

1. Random Forest is the baseline model. Do not introduce XGBoost or deep
   learning without: dataset size > 10,000 samples AND documented evaluation.

2. Feature extraction must be deterministic and reproducible.

3. All model evaluation metrics must be real (computed, not invented):
   - Accuracy, Precision, Recall, F1 on held-out test set
   - Cross-validation scores

4. Model limitations must be documented in the UI:
   "This is a statistical prediction based on code metrics.
    It is not a guaranteed bug detector."

5. If no labeled dataset exists, document the limitation and use proxy labels.
   Document proxy label methodology in docs/AI_ARCHITECTURE.md.

6. Model files are stored in apps/ai-service/models/
   They are NOT committed to git (.gitignore).

---

## AI Agent Rules

1. Use single orchestrator agent (ReAct pattern). No multi-agent by default.

2. Tool permissions are HARDCODED — they cannot be changed by the LLM or user.

3. Allowed tool permissions:
   - search_repository: READ
   - search_code: READ
   - read_file: READ
   - get_file_structure: READ
   - get_code_metrics: READ
   - get_security_findings: READ
   - get_dependencies: READ
   - search_embeddings: READ
   - generate_tests: GENERATE (output only, no execution)
   - generate_documentation: GENERATE (output only)

4. NOT allowed (even if LLM requests):
   - execute_shell
   - delete_file
   - write_file (without explicit user approval flow)
   - arbitrary network access

5. Max iterations: 10 per agent run.
6. Total timeout: 300 seconds.
7. Tool call timeout: 30 seconds.

8. All tool outputs are sanitized before being added to agent context.

---

## Output Schema Rules

ALL AI outputs must be validated against Pydantic schemas before returning.

Code review output must match ReviewResponse schema.
Risk prediction must match RiskPredictionResponse schema.
Test generation must match GeneratedTestsResponse schema.
Agent must match AgentResponse schema.

Free-form text may be returned in a `content` field,
but structured fields (severity, risk_level, etc.) must be enum-validated.

---

## LLM Configuration

1. Provider and model are configurable via environment variables.
2. Temperature: 0.1 for analysis tasks (low randomness).
3. Temperature: 0.3 for generation tasks (some creativity).
4. Always set max_tokens explicitly.
5. Handle LLM API errors gracefully: timeout, rate limit, invalid response.
6. Log LLM call latency and token counts for observability.

---

## Test Generation Safety

1. Generated tests are syntax-checked before storing.
2. Generated tests are NEVER auto-executed without explicit user action.
3. Execution requires the sandbox environment (Phase 11).
4. If sandbox is unavailable, execution is disabled — not bypassed.

---

## Python Code Standards

1. All functions must have type hints.
2. All modules must have docstrings.
3. Pydantic models for all request/response schemas.
4. FastAPI dependency injection for shared services.
5. pytest for all tests.
6. Black formatter.
7. isort for imports.
8. mypy for type checking.
