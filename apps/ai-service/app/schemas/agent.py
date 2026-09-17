"""DevCodeX64 - AI Engineering Agent Schemas (Phase 10)

Enforces strict Pydantic schemas for the ReAct orchestrator loop,
tool invocations, and agent response payloads per AI_ARCHITECTURE.md Section 5.
"""

from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ToolPermission(str, Enum):
    READ = "READ"
    GENERATE = "GENERATE"


class AgentStep(BaseModel):
    iteration: int = Field(..., description="1-indexed iteration number in the ReAct loop")
    thought: str = Field(..., description="Agent reasoning and planning for this step")
    action: Optional[str] = Field(None, description="Selected tool name to execute")
    actionInput: Optional[Dict[str, Any]] = Field(
        default=None, description="Input parameters passed to the tool"
    )
    observation: Optional[str] = Field(
        default=None, description="Sanitized result returned from tool execution"
    )


class AgentRunRequest(BaseModel):
    repositoryId: str = Field(..., description="Target repository UUID")
    task: str = Field(..., description="User prompt or engineering task for the agent")
    maxIterations: Optional[int] = Field(
        default=10, ge=1, le=20, description="Maximum ReAct iterations allowed"
    )


class AgentResponse(BaseModel):
    task: str = Field(..., description="Original user task")
    steps: List[AgentStep] = Field(
        default_factory=list, description="Step-by-step ReAct execution trace"
    )
    finalAnswer: str = Field(..., description="Final synthesized solution or finding")
    iterationsUsed: int = Field(..., description="Total iterations executed")
    success: bool = Field(..., description="True if task completed with a final answer")
    toolsUsed: List[str] = Field(
        default_factory=list, description="Distinct tools invoked during the run"
    )
