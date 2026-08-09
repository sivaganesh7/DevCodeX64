"""DevCodeX64 AI Service — Application Settings"""

import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Service
    service_name: str = "DevCodeX64 AI Service"
    version: str = "1.0.0"
    environment: str = "development"
    port: int = 8000
    frontend_url: str = "http://localhost:5173"
    api_url: str = "http://localhost:3001"

    # Database
    database_url: str = "postgresql://user:password@localhost:5432/devcodex64"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # LLM Provider
    ai_provider: str = "openai"
    ai_model: str = "gpt-4o-mini"
    ai_embedding_model: str = "text-embedding-3-small"
    ai_max_tokens: int = 4096
    ai_temperature: float = 0.1

    openai_api_key: str = ""
    anthropic_api_key: str = ""
    google_ai_api_key: str = ""

    # Agent
    max_agent_iterations: int = 10

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
