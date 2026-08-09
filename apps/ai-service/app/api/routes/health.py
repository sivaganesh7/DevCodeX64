"""DevCodeX64 AI Service — Health Check Routes"""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["Health"])


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


@router.get("", response_model=HealthResponse, summary="Health check")
async def health_check() -> HealthResponse:
    """Returns the health status of the AI service."""
    return HealthResponse(
        status="healthy",
        service="DevCodeX64 AI Service",
        version="1.0.0",
    )
