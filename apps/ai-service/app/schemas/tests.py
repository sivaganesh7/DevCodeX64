"""DevCodeX64 - AI Test Generation & Execution Schemas (Phase 11)

Strictly validates AI test generation requests, generated suites,
and sandboxed execution results according to docs/AI_ARCHITECTURE.md Section 6.
"""

from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class TestFramework(str, Enum):
    JEST = "jest"
    VITEST = "vitest"
    PYTEST = "pytest"


class TestLanguage(str, Enum):
    TYPESCRIPT = "typescript"
    JAVASCRIPT = "javascript"
    PYTHON = "python"


class TestCaseCategory(str, Enum):
    HAPPY_PATH = "HAPPY_PATH"
    EDGE_CASE = "EDGE_CASE"
    BOUNDARY = "BOUNDARY"
    ERROR_CASE = "ERROR_CASE"


class TestExecutionStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    PASSED = "passed"
    FAILED = "failed"
    ERROR = "error"
    SKIPPED = "skipped"


class TestCaseItem(BaseModel):
    name: str = Field(..., description="Short descriptive test case title")
    description: str = Field(..., description="What scenario this test asserts")
    category: TestCaseCategory = Field(
        default=TestCaseCategory.HAPPY_PATH,
        description="Category: HAPPY_PATH, EDGE_CASE, BOUNDARY, ERROR_CASE"
    )


class TestGenerationRequest(BaseModel):
    file_path: str = Field(..., description="Target source code file path")
    code_content: str = Field(..., description="Raw source code content to generate tests for")
    function_name: Optional[str] = Field(
        None, description="Optional specific function or method to focus test generation on"
    )
    language: Optional[str] = Field(
        "typescript", description="Language: typescript, javascript, python"
    )
    framework: Optional[str] = Field(
        None, description="Target framework: jest, vitest, pytest. Inferred if omitted."
    )
    context: Optional[Dict[str, Any]] = Field(
        default=None, description="Additional context such as repository metadata or types"
    )


class TestGenerationResponse(BaseModel):
    file_path: str
    function_name: Optional[str] = None
    language: str
    framework: str
    test_content: str = Field(..., description="Complete executable unit test suite code")
    test_cases: List[TestCaseItem] = Field(
        default_factory=list, description="Structured catalog of generated test scenarios"
    )
    execution_status: str = Field(
        default="pending", description="Initial execution status (pending)"
    )


class TestExecutionRequest(BaseModel):
    test_content: str = Field(..., description="The test file content to execute")
    code_content: Optional[str] = Field(
        default="", description="The target source file content under test"
    )
    file_path: Optional[str] = Field(
        default="subject", description="Source file relative path"
    )
    language: str = Field(
        default="typescript", description="Language: typescript, javascript, python"
    )
    framework: Optional[str] = Field(
        default="jest", description="Framework: jest, vitest, pytest"
    )
    timeout_seconds: Optional[int] = Field(
        default=15, ge=1, le=60, description="Max allowed execution timeout in seconds"
    )


class TestExecutionResponse(BaseModel):
    status: str = Field(..., description="Execution status: passed, failed, error")
    output: str = Field(..., description="Captured execution stdout, stderr, or error report")
    duration_ms: int = Field(default=0, description="Execution run time in milliseconds")
    passed_count: int = Field(default=0, description="Number of passed tests")
    failed_count: int = Field(default=0, description="Number of failed tests")
    sandbox_type: str = Field(
        default="isolated_runner", description="Execution environment: docker or isolated_runner"
    )
