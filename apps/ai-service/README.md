# @DevCodeX64/ai-service — Python FastAPI AI Service

Python + FastAPI AI/ML microservice for the DevCodeX64 platform.

## Setup

\\\ash
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
\\\

## Structure

- \pp/config/\ — Settings and configuration
- \pp/api/routes/\ — FastAPI route handlers
- \pp/api/schemas/\ — Pydantic request/response schemas
- \pp/core/llm/\ — LLM client wrappers
- \pp/core/embeddings/\ — Embedding models
- \pp/core/rag/\ — RAG pipeline components
- \pp/core/agents/\ — AI agent implementations
- \pp/ml/\ — ML models, training, prediction
- \pp/analyzers/\ — Static code analyzers
- \pp/services/\ — Business logic services
