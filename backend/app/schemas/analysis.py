# ============================================================================
# SCHEMAS/ANALYSIS.PY — Code Analysis Request/Response Models
# ============================================================================
# All data shapes for commit analysis and PR analysis endpoints:
#
#   Commit Analysis:
#   - AnalysisCreate / AnalysisRequest → Input for full/quick analysis
#   - AnalysisResponse              → Full analysis result from database
#   - QuickAnalysisResponse         → Quick AI result (NOT saved to DB)
#   - DetailedAnalysisResponse      → Detailed view with all fields
#   - StreamAnalysisRequest         → Input for streaming analysis (SSE)
#   - FixableIssue                  → Issue that can be auto-fixed
#
#   PR Analysis:
#   - PRAnalysisRequest / QuickPRAnalysisRequest → Input for PR analysis
#   - PRAnalysisResponse / QuickPRAnalysisResponse → PR analysis results
#   - StreamPRAnalysisRequest       → Input for streaming PR analysis (SSE)
# ============================================================================

from datetime import datetime
from typing import Any

from pydantic import BaseModel

# ─── Commit Analysis Requests ───────────────────────────────────────────────

class AnalysisCreate(BaseModel):
    repository_id: int
    commit_hash: str


class AnalysisRequest(BaseModel):
    repository_id: int
    commit_sha: str


class StreamAnalysisRequest(BaseModel):
    repository_id: int
    commit_sha: str


# ─── Commit Analysis Responses ──────────────────────────────────────────────

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
    # Recommendations are objects (FixableIssue dicts), not plain strings
    recommendations: list[Any] = []
    impact_areas: list[str] = []
    security_concerns: list[str] = []
    maintainability_score: int = 70
    security_score: int = 100
    performance_score: int = 100
    overall_score: int = 7


# ─── PR Analysis Requests ──────────────────────────────────────────────────

class PRAnalysisRequest(BaseModel):
    repository_id: int
    pr_number: int


class QuickPRAnalysisRequest(BaseModel):
    repo_full_name: str
    pr_number: int


class StreamPRAnalysisRequest(BaseModel):
    repository_id: int
    pr_number: int


# ─── PR Analysis Responses ─────────────────────────────────────────────────

class PRAnalysisResponse(BaseModel):
    id: int
    repository_id: int
    pull_request_id: int
    pr_number: int
    summary: str
    full_analysis: str
    risk_level: str
    change_type: str
    files_changed: int
    lines_added: int
    lines_removed: int
    security_issues: list[str] = []
    recommendations: list[str] = []
    maintainability_score: int = 70
    security_score: int = 100
    performance_score: int = 100
    overall_score: int = 7
    created_at: datetime

    class Config:
        from_attributes = True


class QuickPRAnalysisResponse(BaseModel):
    pr_number: int
    title: str
    summary: str
    risk_level: str
    change_type: str
    files_changed: int
    lines_added: int
    lines_removed: int
    impact_areas: list[str] = []
    security_concerns: list[str] = []
    recommendations: list[str] = []
    maintainability_score: int = 70
    security_score: int = 100
    performance_score: int = 100
    overall_score: int = 7
