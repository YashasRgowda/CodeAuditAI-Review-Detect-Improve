# ============================================================================
# REPOSITORIES/PULL_REQUEST_MODELS.PY — Pydantic Schemas for Pull Requests
# ============================================================================
# Defines response shapes for pull request API endpoints:
#   - PullRequestResponse: PR metadata (title, author, state, branches)
#   - PullRequestDetailResponse: Full PR data including files changed,
#     lines added/removed, list of commits, and the complete code diff
# ============================================================================

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class PullRequestResponse(BaseModel):
    id: int
    repository_id: int
    pr_number: int
    title: str
    description: Optional[str] = None
    author: str
    state: str
    base_branch: str
    head_branch: str
    github_pr_id: str
    html_url: str
    files_changed: int
    lines_added: int
    lines_removed: int
    last_analyzed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class GitHubPullRequestResponse(BaseModel):
    id: int
    number: int
    title: str
    body: Optional[str] = None
    state: str
    user: str
    html_url: str
    base_branch: str
    head_branch: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    additions: int
    deletions: int
    changed_files: int

class PullRequestFilesResponse(BaseModel):
    pr_number: int
    title: str
    description: Optional[str] = None
    author: str
    base_branch: str
    head_branch: str
    state: str
    created_at: Optional[str] = None
    stats: Dict[str, Any]
    files: List[Dict[str, Any]]