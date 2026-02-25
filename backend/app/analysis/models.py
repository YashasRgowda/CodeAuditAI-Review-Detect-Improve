# ============================================================================
# ANALYSIS/MODELS.PY — Pydantic Schemas for Code Analysis
# ============================================================================
# Defines request/response shapes for analysis API endpoints:
#   - AnalysisCreate: Input for triggering analysis (repo_id + commit_hash)
#   - AnalysisResponse: Full analysis result (scores, summary, risk level)
#   - QuickAnalysisResponse: Lightweight analysis result (just summary + risk)
#   - AnalysisCompare: Side-by-side comparison of two analyses
# ============================================================================

from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class AnalysisCreate(BaseModel):
    repository_id: int
    commit_hash: str

class AnalysisResponse(BaseModel):
    id: int
    repository_id: int
    commit_hash: str
    summary: str
    changes_data: Dict[str, Any]
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

class AnalysisRequest(BaseModel):
    repository_id: int
    commit_sha: str

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
    recommendations: List[str] = []

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
    changes_data: Dict[str, Any]