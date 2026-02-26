# ============================================================================
# ANALYSIS/MODELS.PY — Pydantic Schemas for Code Analysis
# ============================================================================
# Defines request/response shapes for analysis API endpoints:
#   - AnalysisCreate: Input for triggering full analysis (repo_id + commit_hash)
#   - AnalysisRequest: Input for quick analysis (repo_id + commit_sha)
#   - AnalysisResponse: Full analysis result saved to DB (scores, summary, risk)
#   - QuickAnalysisResponse: Quick result with AI scores (not saved to DB)
#   - DetailedAnalysisResponse: Detailed view with full AI data
#   - StreamAnalysisRequest: Input for streaming analysis
#   - StreamEvent: SSE event sent during streaming analysis
# ============================================================================

from datetime import datetime
from typing import Any

from pydantic import BaseModel


class AnalysisCreate(BaseModel):
    repository_id: int
    commit_hash: str


class AnalysisRequest(BaseModel):
    repository_id: int
    commit_sha: str


class StreamAnalysisRequest(BaseModel):
    repository_id: int
    commit_sha: str


class AnalysisResponse(BaseModel):
    id: int
    repository_id: int
    commit_hash: str
    summary: str
    changes_data: dict[str, Any]
    risk_level: str
    files_changed: int
    lines_added: int
    lines_removed: int
    maintainability_score: int = 70
    security_score: int = 100
    performance_score: int = 100
    dependency_complexity: int = 0
    technical_debt_ratio: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class FixableIssue(BaseModel):
    """An issue found during analysis with a fixable flag.

    If fixable=True, the user can request an AI-generated code fix
    via POST /analysis/auto-fix.
    """
    description: str = ""
    fixable: bool = False
    issue_type: str = "quality"  # security | performance | architecture | quality
    severity: str = "medium"  # low | medium | high


class QuickAnalysisResponse(BaseModel):
    summary: str
    risk_level: str
    change_type: str
    files_changed: int
    lines_added: int
    lines_removed: int
    commit_hash: str
    commit_message: str
    author: str
    recommendations: list[FixableIssue] = []
    impact_areas: list[str] = []
    security_concerns: list[str] = []
    maintainability_score: int = 70
    security_score: int = 100
    performance_score: int = 100
    overall_score: int = 7
    autofix_available: bool = True  # Tells the user they can request fixes


class DetailedAnalysisResponse(BaseModel):
    id: int
    summary: str
    full_analysis: str
    risk_level: str
    change_type: str
    files_changed: int
    lines_added: int
    lines_removed: int
    commit_hash: str
    commit_message: str
    author: str
    repository_name: str
    created_at: datetime
    changes_data: dict[str, Any]
    recommendations: list[str] = []
    impact_areas: list[str] = []
    security_concerns: list[str] = []
    maintainability_score: int = 70
    security_score: int = 100
    performance_score: int = 100
    overall_score: int = 7
