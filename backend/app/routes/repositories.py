# ============================================================================
# ROUTES/REPOSITORIES.PY — Repository & GitHub Data API Endpoints
# ============================================================================
# All endpoints for managing repositories and fetching GitHub data:
#   - GET    /repos/                        → List user's tracked repos
#   - POST   /repos/                        → Add a new repo to track
#   - GET    /repos/{id}                    → Get single repo details
#   - DELETE /repos/{id}                    → Remove repo from tracking
#   - GET    /repos/{id}/commits            → Fetch recent commits from GitHub
#   - GET    /repos/{id}/commits/{sha}/diff → Get full code diff of a commit
#   - GET    /repos/{id}/pulls              → Fetch pull requests from GitHub
#   - GET    /repos/{id}/pulls/{num}        → Get detailed PR info + diff
#
# Most endpoints require authentication (JWT token) to identify the user.
# Commits/PRs are fetched live from GitHub, not stored locally.
# ============================================================================

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.redis import (
    TTL_COMMIT_DIFF,
    TTL_COMMITS_LIST,
    TTL_PR_FILES,
    TTL_PR_LIST,
    TTL_REPO_DETAIL,
    TTL_REPO_LIST,
    CacheManager,
)
from app.core.security import get_github_user
from app.models.repository import Repository
from app.models.user import User
from app.schemas.pull_request import (
    GitHubPullRequestResponse,
    PullRequestFilesResponse,
)
from app.schemas.repository import CommitDiffResponse, CommitResponse, GitHubRepositoryResponse, RepositoryResponse
from app.services.github_service import github_service

router = APIRouter()


@router.get("/github/list", response_model=list[GitHubRepositoryResponse])
async def list_github_repositories(
    per_page: int = Query(30, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_github_user),
):

    try:
        repositories = await github_service.get_user_repositories(user, per_page)
        return [GitHubRepositoryResponse(**repo) for repo in repositories]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch GitHub repos: {str(e)}")


@router.post("/add-github-repo", response_model=RepositoryResponse)
async def add_github_repository(
    repo_name: str = Query(..., description="Repository full name like 'username/repo-name'"),
    db: Session = Depends(get_db),
    user: User = Depends(get_github_user),
):

    try:
        repo_details = await github_service.get_repository_details(user, repo_name)

        existing_repo = db.query(Repository).filter(
            Repository.github_repo_id == str(repo_details["id"])
        ).first()

        if existing_repo:
            raise HTTPException(status_code=400, detail="Repository already added")

        repository = Repository(
            user_id=user.id,
            repo_name=repo_details["full_name"],
            repo_url=repo_details["html_url"],
            github_repo_id=str(repo_details["id"]),
            description=repo_details.get("description")
        )

        db.add(repository)
        db.commit()
        db.refresh(repository)

        # New repo added — invalidate user's repo list cache
        CacheManager.delete(f"repos:user:{user.id}")

        return repository

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to add repository: {str(e)}")


@router.get("/", response_model=list[RepositoryResponse])
async def get_user_repositories(
    db: Session = Depends(get_db),
    user: User = Depends(get_github_user),
):
    """Get user's added repositories for analysis"""
    cache_key = f"repos:user:{user.id}"
    cached = CacheManager.get_json(cache_key)
    if cached is not None:
        return cached

    repositories = db.query(Repository).filter(
        Repository.user_id == user.id
    ).order_by(Repository.created_at.desc()).all()

    result = [RepositoryResponse.model_validate(r).model_dump() for r in repositories]
    CacheManager.set_json(cache_key, result, TTL_REPO_LIST)
    return repositories


@router.get("/{repo_id}", response_model=RepositoryResponse)
async def get_repository(repo_id: int, db: Session = Depends(get_db)):
    """Get specific repository details"""
    cache_key = f"repo:{repo_id}"
    cached = CacheManager.get_json(cache_key)
    if cached is not None:
        return cached

    repository = db.query(Repository).filter(Repository.id == repo_id).first()
    if not repository:
        raise HTTPException(status_code=404, detail="Repository not found")

    result = RepositoryResponse.model_validate(repository).model_dump()
    CacheManager.set_json(cache_key, result, TTL_REPO_DETAIL)
    return repository


@router.delete("/{repo_id}")
async def remove_repository(repo_id: int, db: Session = Depends(get_db)):
    """Remove repository from analysis"""
    repository = db.query(Repository).filter(Repository.id == repo_id).first()

    if not repository:
        raise HTTPException(status_code=404, detail="Repository not found")

    try:
        from app.models.analysis import Analysis
        db.query(Analysis).filter(Analysis.repository_id == repo_id).delete()

        try:
            from app.models.pr_analysis import PRAnalysis
            db.query(PRAnalysis).filter(PRAnalysis.repository_id == repo_id).delete()
        except Exception:
            pass

        db.delete(repository)
        db.commit()

        # Invalidate caches for this repo and the user's repo list
        CacheManager.delete(f"repo:{repo_id}")
        CacheManager.delete(f"repos:user:{repository.user_id}")
        CacheManager.delete_pattern(f"commits:{repo_id}:*")
        CacheManager.delete_pattern(f"commit_diff:{repo_id}:*")
        CacheManager.delete_pattern(f"prs:{repo_id}:*")

        return {"message": "Repository removed successfully"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete repository: {str(e)}")


@router.get("/{repo_id}/commits", response_model=list[CommitResponse])
async def get_repository_commits(
    repo_id: int,
    limit: int = Query(10, le=50),
    db: Session = Depends(get_db)
):
    """Get recent commits from a repository"""
    repository = db.query(Repository).filter(Repository.id == repo_id).first()

    if not repository:
        raise HTTPException(status_code=404, detail="Repository not found")

    user = db.query(User).filter(User.id == repository.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Repository owner not found")

    cache_key = f"commits:{repo_id}:{limit}"
    cached = CacheManager.get_json(cache_key)
    if cached is not None:
        return cached

    try:
        commits = await github_service.get_recent_commits(user, repository.repo_name, limit)
        result = [CommitResponse(**c).model_dump() for c in commits]
        CacheManager.set_json(cache_key, result, TTL_COMMITS_LIST)
        return commits
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch commits: {str(e)}")


@router.get("/{repo_id}/commits/{commit_sha}/diff", response_model=CommitDiffResponse)
async def get_commit_diff(
    repo_id: int,
    commit_sha: str,
    db: Session = Depends(get_db)
):
    """Get detailed diff for a specific commit"""
    repository = db.query(Repository).filter(Repository.id == repo_id).first()

    if not repository:
        raise HTTPException(status_code=404, detail="Repository not found")

    user = db.query(User).filter(User.id == repository.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Repository owner not found")

    # Commit diffs are immutable — cache for 24 hours
    cache_key = f"commit_diff:{repo_id}:{commit_sha}"
    cached = CacheManager.get_json(cache_key)
    if cached is not None:
        return cached

    try:
        commit_diff = await github_service.get_commit_diff(user, repository.repo_name, commit_sha)
        CacheManager.set_json(cache_key, commit_diff, TTL_COMMIT_DIFF)
        return CommitDiffResponse(**commit_diff)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch commit diff: {str(e)}")


@router.get("/{repo_id}/pull-requests", response_model=list[GitHubPullRequestResponse])
async def get_repository_pull_requests(
    repo_id: int,
    state: str = Query("open", description="PR state: open, closed, or all"),
    limit: int = Query(10, le=50),
    db: Session = Depends(get_db)
):
    """Get pull requests from a repository"""
    repository = db.query(Repository).filter(Repository.id == repo_id).first()
    if not repository:
        raise HTTPException(status_code=404, detail="Repository not found")

    user = db.query(User).filter(User.id == repository.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Repository owner not found")

    cache_key = f"prs:{repo_id}:{state}:{limit}"
    cached = CacheManager.get_json(cache_key)
    if cached is not None:
        return cached

    try:
        prs = await github_service.get_repository_pull_requests(user, repository.repo_name, state, limit)
        result = [GitHubPullRequestResponse(**pr).model_dump() for pr in prs]
        CacheManager.set_json(cache_key, result, TTL_PR_LIST)
        return prs
    except Exception:
        return []


@router.get("/{repo_id}/pull-requests/{pr_number}/files", response_model=PullRequestFilesResponse)
async def get_pull_request_files(
    repo_id: int,
    pr_number: int,
    db: Session = Depends(get_db)
):
    """Get detailed file changes for a specific pull request"""
    repository = db.query(Repository).filter(Repository.id == repo_id).first()
    if not repository:
        raise HTTPException(status_code=404, detail="Repository not found")

    user = db.query(User).filter(User.id == repository.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Repository owner not found")

    cache_key = f"pr_files:{repo_id}:{pr_number}"
    cached = CacheManager.get_json(cache_key)
    if cached is not None:
        return cached

    try:
        pr_files = await github_service.get_pull_request_files(user, repository.repo_name, pr_number)
        CacheManager.set_json(cache_key, pr_files, TTL_PR_FILES)
        return PullRequestFilesResponse(**pr_files)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to get PR files: {str(e)}")
