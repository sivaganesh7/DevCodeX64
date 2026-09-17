"""DevCodeX64 - AI Documentation Generation Schemas (Phase 12)

Strictly validates AI documentation generation requests and responses
according to docs/AI_ARCHITECTURE.md Section 7 and docs/API_SPEC.md Section 14.
"""

from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class DocType(str, Enum):
    README = "README"
    API = "API"
    ARCHITECTURE = "ARCHITECTURE"
    FUNCTION = "FUNCTION"
    SETUP = "SETUP"
    DATABASE = "DATABASE"
    DEVELOPER_GUIDE = "DEVELOPER_GUIDE"


class DocumentationGenerationRequest(BaseModel):
    doc_type: DocType = Field(
        default=DocType.README,
        description="Type of documentation: README, API, ARCHITECTURE, FUNCTION, SETUP, DATABASE, DEVELOPER_GUIDE"
    )
    title: Optional[str] = Field(
        None, description="Optional custom title for the generated documentation"
    )
    file_path: Optional[str] = Field(
        None, description="Target source code file path (especially for FUNCTION docs)"
    )
    code_content: Optional[str] = Field(
        None, description="Raw source code content or snippet under documentation"
    )
    repository_name: Optional[str] = Field(
        "repository", description="Repository name or slug"
    )
    repository_description: Optional[str] = Field(
        None, description="Repository overview / description"
    )
    context: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Additional repository metadata: file tree, tech stack, endpoints, dependencies"
    )


class DocumentationGenerationResponse(BaseModel):
    doc_type: DocType
    title: str = Field(..., description="Document title")
    content: str = Field(..., description="Complete Markdown formatted documentation")
    file_path: Optional[str] = None
