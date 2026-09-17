"""DevCodeX64 - AI Code Review Schemas (Phase 9)

Strictly validates AI code review inputs and structured outputs
according to docs/AI_ARCHITECTURE.md Section 4.2.
"""

from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ReviewType(str, Enum):
    FILE = "FILE"
    PR = "PR"
    SNIPPET = "SNIPPET"


class ReviewRating(str, Enum):
    EXCELLENT = "EXCELLENT"
    GOOD = "GOOD"
    NEEDS_WORK = "NEEDS_WORK"
    POOR = "POOR"


class ReviewIssueSeverity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class ReviewIssueCategory(str, Enum):
    SECURITY = "SECURITY"
    PERFORMANCE = "PERFORMANCE"
    MAINTAINABILITY = "MAINTAINABILITY"
    CORRECTNESS = "CORRECTNESS"
    STYLE = "STYLE"


class ReviewIssue(BaseModel):
    severity: ReviewIssueSeverity = Field(
        ..., description="Severity level: CRITICAL, HIGH, MEDIUM, LOW"
    )
    category: ReviewIssueCategory = Field(
        ..., description="Issue category: SECURITY, PERFORMANCE, MAINTAINABILITY, CORRECTNESS, STYLE"
    )
    title: str = Field(..., description="Short descriptive title of the issue")
    description: str = Field(..., description="Detailed explanation of the problem found")
    file: str = Field(..., description="File path associated with the issue")
    line: Optional[int] = Field(None, description="Line number if applicable, or null")
    recommendation: str = Field(..., description="Actionable recommendation or suggested fix")


class ReviewRequest(BaseModel):
    reviewType: ReviewType = Field(default=ReviewType.FILE, description="Type of review: FILE, PR, or SNIPPET")
    filePath: Optional[str] = Field(None, description="Path to the file being reviewed")
    language: Optional[str] = Field(None, description="Programming language of the target code")
    content: Optional[str] = Field(None, description="Source code content to review")
    diff: Optional[str] = Field(None, description="Git unified diff text for PR review")
    pullRequestNumber: Optional[int] = Field(None, description="Pull Request number if applicable")
    pullRequestTitle: Optional[str] = Field(None, description="Pull Request title if applicable")
    pullRequestDescription: Optional[str] = Field(None, description="Pull Request body/description")
    riskContext: Optional[List[Dict[str, Any]]] = Field(
        default=None, description="Optional ML risk context for surrounding files"
    )
    securityContext: Optional[List[Dict[str, Any]]] = Field(
        default=None, description="Optional security findings context for surrounding files"
    )


class ReviewResponse(BaseModel):
    summary: str = Field(..., description="High-level executive review summary")
    overallRating: ReviewRating = Field(
        ..., description="Overall code assessment: EXCELLENT, GOOD, NEEDS_WORK, POOR"
    )
    issues: List[ReviewIssue] = Field(
        default_factory=list, description="List of structured findings and issues"
    )
    positives: List[str] = Field(
        default_factory=list, description="Positive aspects, clean patterns, and well-designed constructs"
    )
    recommendations: List[str] = Field(
        default_factory=list, description="Prioritized recommendations to improve the codebase"
    )
