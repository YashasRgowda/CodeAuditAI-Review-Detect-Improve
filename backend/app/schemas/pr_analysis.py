# ============================================================================
# SCHEMAS/PR_ANALYSIS.PY — Pydantic Schemas for Pull Request Analysis
# ============================================================================
# Defines request/response shapes for pull request analysis endpoints:
#   - PRAnalysisRequest: Input for triggering PR analysis (repo_id + pr_number)
#   - QuickPRAnalysisRequest: Input for quick PR analysis (repo name + pr_number)
#   - PRAnalysisResponse: Full PR analysis result saved to DB
#   - QuickPRAnalysisResponse: Quick PR result with AI scores (not saved)
#   - StreamPRAnalysisRequest: Input for streaming PR analysis
# ============================================================================

from datetime import datetime

from pydantic import BaseModel


class PRAnalysisRequest(BaseModel):
    repository_id: int
    pr_number: int


class QuickPRAnalysisRequest(BaseModel):
    repo_full_name: str
    pr_number: int


class StreamPRAnalysisRequest(BaseModel):
    repository_id: int
    pr_number: int


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
