# ============================================================================
# REPOSITORIES/MODELS.PY — Pydantic Schemas for Repositories & Commits
# ============================================================================
# Defines request/response shapes for repository-related API endpoints:
#   - RepositoryCreate: Input schema when adding a new repo to track
#   - RepositoryResponse: Full repo data returned to frontend
#   - CommitResponse: Commit metadata (sha, author, message, date)
#   - CommitDiffResponse: Full commit diff with file-by-file changes
# ============================================================================

from datetime import datetime
from typing import Any

from pydantic import BaseModel


class RepositoryCreate(BaseModel):
    repo_name: str
    repo_url: str
    github_repo_id: str
    description: str | None = None

class RepositoryResponse(BaseModel):
    id: int
    user_id: int
    repo_name: str
    repo_url: str
    github_repo_id: str
    description: str | None = None
    last_analyzed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True

class GitHubRepositoryResponse(BaseModel):
    id: int
    name: str
    full_name: str
    description: str | None = None
    html_url: str
    clone_url: str
    ssh_url: str
    private: bool
    language: str | None = None
    stargazers_count: int
    forks_count: int
    updated_at: str | None = None
    created_at: str | None = None
    default_branch: str
    size: int

class CommitResponse(BaseModel):
    sha: str
    message: str
    author: dict[str, Any]
    committer: dict[str, Any]
    html_url: str
    stats: dict[str, Any] | None = None

class CommitDiffResponse(BaseModel):
    sha: str
    message: str
    author: str
    date: str
    stats: dict[str, Any]
    files: list[dict[str, Any]]
