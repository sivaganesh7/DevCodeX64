# DevCodeX64 — AI/ML Architecture

**Version:** 1.0.0
**Last Updated:** 2026-08-09
**Service:** apps/ai-service (Python + FastAPI)

---

## 1. Overview

The AI/ML layer is isolated in a dedicated FastAPI service.
It is called only by the NestJS backend and the background workers.
It is NEVER called directly by the React frontend.

```
NestJS Backend
      |
      | internal HTTP
      v
FastAPI AI Service (port 8000)
      |
 +---------+----------+----------+
 |         |          |          |
RAG       ML       Agent     Reviews
```

---

## 2. RAG — Repository-Aware Assistant

### 2.1 Ingestion Pipeline

```
Repository Files
      |
File Extraction
      |
Language Detection
      |
Code Parsing (AST where available)
      |
Semantic Chunking (function/class aware)
      |
Embedding Generation (text-embedding-3-small or equivalent)
      |
pgvector Storage (code_embeddings table)
```

### 2.2 Query Pipeline

```
User Question
      |
Question Embedding
      |
pgvector Similarity Search (cosine, top-k=10)
      |
Context Construction
  - File path
  - Start/end line
  - Raw chunk content
  - Language
      |
Prompt Construction
  [SYSTEM INSTRUCTIONS]
  [USER QUESTION]
  [RETRIEVED CONTEXT - labeled as REPOSITORY CONTENT]
      |
LLM (configurable: OpenAI / Anthropic / Gemini)
      |
Structured Response
  - Answer text
  - Source citations (file, line range)
```

### 2.3 Chunking Strategy

- Preferred: AST-aware chunking (split on function/class boundaries)
- Fallback: sliding window (512 tokens, 128 token overlap)
- Minimum chunk: 50 tokens
- Maximum chunk: 1024 tokens
- Metadata preserved: file_path, start_line, end_line, language

### 2.4 Embedding Model

- Default: OpenAI text-embedding-3-small (1536 dimensions)
- Alternative: sentence-transformers/all-MiniLM-L6-v2 (384 dimensions, local)
- Decision: configurable via AI_EMBEDDING_MODEL env var

---

## 3. Machine Learning Risk Prediction

### 3.1 Feature Engineering

Features extracted per file and per repository:

**File-level features:**
- lines_of_code
- cyclomatic_complexity (per function, aggregated)
- function_count
- class_count
- max_function_length
- avg_function_length
- comment_ratio
- duplication_ratio

**Repository-level features (from git history where available):**
- file_churn (commits touching this file in last 90 days)
- contributor_count
- commit_frequency
- test_coverage_ratio (if coverage data available)
- dependency_count
- vulnerability_count

### 3.2 Model Architecture

**Phase 7 initial model:** Random Forest (interpretable, low overfitting)

**Candidate alternatives (evaluate before adopting):**
- Gradient Boosted Trees (XGBoost) if dataset > 10,000 samples
- Logistic Regression (as baseline)

**Output classes:**
- LOW (risk_score 0.0-0.25)
- MEDIUM (risk_score 0.25-0.50)
- HIGH (risk_score 0.50-0.75)
- CRITICAL (risk_score 0.75-1.0)

### 3.3 Dataset Requirements

**IMPORTANT:** No curated labeled dataset exists at project start.

**Phase 7 approach:**
1. Build full feature extraction pipeline (deterministic, testable)
2. Create reproducible training data generation from public repos
3. Use proxy labels (e.g., files with historical bug-fix commits = positive class)
4. Train with cross-validation and report actual evaluation metrics
5. Document all limitations clearly in the UI

**Never:**
- Invent accuracy numbers
- Use fake predictions
- Pretend the model is more accurate than measured

### 3.4 Model Storage

- Serialized models stored in apps/ai-service/models/
- Version-tagged (model_v1_2026-08-09.pkl)
- Not committed to git (in .gitignore)
- Loaded at service startup

---

## 4. AI Code Review

### 4.1 Input

Code review accepts:
- Single file content + language
- Function/class selection
- PR diff (unified diff format)

### 4.2 Output Schema (validated)

```json
{
  "summary": "string",
  "overallRating": "EXCELLENT | GOOD | NEEDS_WORK | POOR",
  "issues": [
    {
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "category": "SECURITY | PERFORMANCE | MAINTAINABILITY | CORRECTNESS | STYLE",
      "title": "string",
      "description": "string",
      "file": "string",
      "line": "integer | null",
      "recommendation": "string"
    }
  ],
  "positives": ["string"],
  "recommendations": ["string"]
}
```

**CRITICAL:** AI output is always validated against this schema.
Free-form text is never passed directly to application logic.

---

## 5. AI Engineering Agent

### 5.1 Architecture

**Design:** Single orchestrator agent (ReAct pattern).

Do NOT build a complex multi-agent system until single-agent design
is proven insufficient.

### 5.2 Tool Registry

| Tool | Description | Permission |
|------|-------------|------------|
| search_repository | Full-text search across file content | READ |
| search_code | Search by symbol name, function, class | READ |
| read_file | Read a specific file's content | READ |
| get_file_structure | Get repository directory tree | READ |
| get_code_metrics | Retrieve analysis metrics for a file | READ |
| get_security_findings | Retrieve security findings | READ |
| get_dependencies | Retrieve dependency analysis | READ |
| search_embeddings | Vector similarity search | READ |
| generate_tests | Generate test cases for a function | GENERATE |
| generate_documentation | Generate documentation | GENERATE |

**Explicitly NOT allowed:**
- delete_file (destructive)
- execute_shell (unrestricted shell)
- write_file (without explicit user approval)
- network_access (arbitrary URLs)

### 5.3 Execution Loop

```
User Task
    |
Agent Planning (LLM generates plan)
    |
Tool Selection
    |
Tool Execution (with result validation)
    |
Observation
    |
Reason about next step
    |
[Repeat until task complete or max iterations]
    |
Final Answer
```

**Max iterations:** 10 (configurable via MAX_AGENT_ITERATIONS env var)
**Timeout:** 60 seconds per tool call, 300 seconds total

### 5.4 Prompt Injection Protection

Repository content passed to the agent is wrapped in explicit delimiters:

```
<REPOSITORY_CONTENT file="src/auth.ts" lines="1-50">
[content here]
</REPOSITORY_CONTENT>
```

System instructions establish that REPOSITORY_CONTENT must never
override agent behavior, tool permissions, or system instructions.

---

## 6. Test Generation

### 6.1 Supported Languages/Frameworks

| Language | Framework | Status |
|----------|-----------|--------|
| TypeScript | Jest | Phase 11 |
| JavaScript | Jest/Vitest | Phase 11 |
| Python | pytest | Phase 11 |

### 6.2 Generated Test Requirements

Tests must include:
- Happy path (normal inputs)
- Edge cases
- Invalid inputs
- Boundary values
- Error/exception cases

Generated tests must be valid, parseable code.
They are validated by syntax check before being stored.

### 6.3 Sandboxed Execution

**CRITICAL SECURITY REQUIREMENT**

Generated code must NEVER execute on the host.

**Phase 11 approach:**
- Use Docker-in-Docker or ephemeral containers
- CPU limit: 0.5 cores
- Memory limit: 256MB
- Timeout: 30 seconds
- Network: disabled (--network none)
- Filesystem: tmpfs only
- No host filesystem mount

**If sandbox cannot be implemented safely:**
- Disable execution feature
- Store generated tests only
- Document limitation clearly

---

## 7. Documentation Generation

Documentation is generated from real repository evidence:
- Existing code structure
- Function signatures
- Type definitions
- Comments/docstrings
- README content
- Configuration files

The AI must NOT invent:
- API endpoints that don't exist
- Configuration options that don't exist
- Features that don't exist

---

## 8. LLM Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| OPENAI_API_KEY | - | OpenAI API key |
| ANTHROPIC_API_KEY | - | Anthropic API key |
| GOOGLE_AI_API_KEY | - | Google Gemini API key |
| AI_PROVIDER | openai | Active LLM provider |
| AI_MODEL | gpt-4o-mini | Active model name |
| AI_EMBEDDING_MODEL | text-embedding-3-small | Embedding model |
| AI_MAX_TOKENS | 4096 | Max response tokens |
| AI_TEMPERATURE | 0.1 | Low temperature for factual tasks |

Provider is switchable via environment variables, not code changes.

---

## 9. AI Service Internal Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |
| POST | /embed | Generate embeddings for text chunks |
| POST | /rag/query | RAG query with retrieval |
| POST | /review | AI code review |
| POST | /risk/predict | ML risk prediction |
| POST | /agent/run | AI agent execution |
| POST | /tests/generate | Test generation |
| POST | /documentation/generate | Documentation generation |

---

## 10. Changelog

| Date | Change |
|------|--------|
| 2026-08-09 | Phase 0: Initial AI architecture documented |
