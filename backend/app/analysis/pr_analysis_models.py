from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class PRAnalysisRequest(BaseModel):
    repository_id: int
    pr_number: int

class QuickPRAnalysisRequest(BaseModel):
    repo_full_name: str
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
    security_issues: List[str] = []
    recommendations: List[str] = []
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
    impact_areas: List[str] = []
    security_concerns: List[str] = []
    recommendations: List[str] = []
    overall_score: int  # 1-10 score