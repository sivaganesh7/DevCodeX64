"""DevCodeX64 AI Service — FastAPI Application Entry Point"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.api.routes import health, risk

logging.basicConfig(
    level=logging.DEBUG if settings.environment == "development" else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan: startup and shutdown events."""
    logger.info("DevCodeX64 AI Service starting up...")
    # Phase 8+: initialise embedding model, pgvector connection pool
    yield
    logger.info("DevCodeX64 AI Service shutting down...")


app = FastAPI(
    title=settings.service_name,
    description="AI/ML microservice powering code analysis, RAG, and AI agents for DevCodeX64",
    version=settings.version,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS
# Only the NestJS backend calls this service in production.
# During development, allow localhost origins.
_allowed_origins = [
    settings.api_url,
    settings.frontend_url,
    "http://localhost:3001",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(risk.router, tags=["Risk"])

from app.api.routes import embeddings, rag
app.include_router(embeddings.router,    prefix="/embed",         tags=["Embeddings"])
app.include_router(rag.router,           prefix="/rag",           tags=["RAG"])
# from app.api.routes import ml, review, agent, tests, documentation
# app.include_router(ml.router,            prefix="/ml",            tags=["ML"])
# app.include_router(review.router,        prefix="/review",        tags=["Code Review"])
# app.include_router(agent.router,         prefix="/agent",         tags=["Agent"])
# app.include_router(tests.router,         prefix="/tests",         tags=["Test Generation"])
# app.include_router(documentation.router, prefix="/documentation", tags=["Documentation"])


@app.get("/", include_in_schema=False)
async def root() -> dict:
    return {
        "service": settings.service_name,
        "version": settings.version,
        "status": "operational",
        "docs": "/docs",
    }
