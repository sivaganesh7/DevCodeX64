"""DevCodeX64 - AI Agent Route (Phase 10)

Exposes POST /agent/run for executing the autonomous ReAct engineering agent.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.agent import AgentRunRequest, AgentResponse
from app.core.agents.orchestrator import AgentOrchestrator

router = APIRouter()


@router.post("/run", response_model=AgentResponse, summary="Execute AI Engineering Agent")
async def run_agent(
    request: AgentRunRequest,
    db: AsyncSession = Depends(get_db),
) -> AgentResponse:
    """Runs single-agent ReAct loop across repository context."""
    orchestrator = AgentOrchestrator(repository_id=request.repositoryId, db=db)
    return await orchestrator.run(
        task=request.task,
        maxIterations=request.maxIterations or 10,
    )
