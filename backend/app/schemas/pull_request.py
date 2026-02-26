# ============================================================================
# SCHEMAS/PULL_REQUEST.PY — Pull Request Request/Response Models
# ============================================================================
# Defines data shapes for pull request API endpoints:
#   - PullRequestResponse:       PR metadata from database
#   - GitHubPullRequestResponse: Raw PR data from GitHub API
#   - PullRequestFilesResponse:  Full PR data including files and diffs
# ============================================================================

from datetime import datetime
from typing import Any

from pydantic import BaseModel


class PullRequestResponse(BaseModel):
    id: int
    repository_id: int
    pr_number: int
    title: str
    description: str | None = None
    author: str
    state: str
    base_branch: str
    head_branch: str
    github_pr_id: str
    html_url: str
    files_changed: int
    lines_added: int
    lines_removed: int
    last_analyzed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class GitHubPullRequestResponse(BaseModel):
    id: int
    number: int
    title: str
    body: str | None = None
    state: str
    user: str
    html_url: str
    base_branch: str
    head_branch: str
    created_at: str | None = None
    updated_at: str | None = None
    additions: int
    deletions: int
    changed_files: int


class PullRequestFilesResponse(BaseModel):
    pr_number: int
    title: str
    description: str | None = None
    author: str
    base_branch: str
    head_branch: str
    state: str
    created_at: str | None = None
    stats: dict[str, Any]
    files: list[dict[str, Any]]
