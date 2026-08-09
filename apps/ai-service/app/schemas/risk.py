from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class RiskFeatures(BaseModel):
    loc: int = Field(default=0, ge=0, description="Lines of code")
    complexity: int = Field(default=0, ge=0, description="Cyclomatic complexity")
    functions: int = Field(default=0, ge=0, description="Number of functions")
    dependencies: int = Field(default=0, ge=0, description="Number of dependencies")
    codeSmells: int = Field(default=0, ge=0, description="Number of code smells")
    securityFindings: int = Field(default=0, ge=0, description="Number of security findings")
    highFindings: int = Field(default=0, ge=0, description="Number of high/critical security findings")

class RiskPredictionRequest(BaseModel):
    features: RiskFeatures

class RiskFactor(BaseModel):
    feature: str
    impact: str

class RiskPredictionResponse(BaseModel):
    riskProbability: float = Field(..., ge=0.0, le=1.0)
    riskLevel: str
    factors: List[RiskFactor]
    modelVersion: str
