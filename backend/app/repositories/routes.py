# ============================================================================
# REPOSITORIES/ROUTES.PY — Repository & GitHub Data API Endpoints
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

from app.database import get_db
from app.models.repository import Repository
from app.models.user import User
from app.repositories.github_service import github_service
from app.repositories.models import CommitDiffResponse, CommitResponse, GitHubRepositoryResponse, RepositoryResponse
from app.repositories.pull_request_models import (
    GitHubPullRequestResponse,
    PullRequestFilesResponse,
)

router = APIRouter()

@router.get("/github/list", response_model=list[GitHubRepositoryResponse])
async def list_github_repositories(
    per_page: int = Query(30, le=100),
    db: Session = Depends(get_db)
):
    """List user's GitHub repositories"""
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=401, detail="No authenticated user found")

    try:
        repositories = await github_service.get_user_repositories(user, per_page)
        return [GitHubRepositoryResponse(**repo) for repo in repositories]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch GitHub repos: {str(e)}")

@router.post("/add-github-repo", response_model=RepositoryResponse)
async def add_github_repository(
    repo_name: str = Query(..., description="Repository full name like 'username/repo-name'"),
    db: Session = Depends(get_db)
):
    """Add a GitHub repository for analysis by its full name"""
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=401, detail="No authenticated user found")

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

        return repository

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to add repository: {str(e)}")

@router.get("/", response_model=list[RepositoryResponse])
async def get_user_repositories(db: Session = Depends(get_db)):
    """Get user's added repositories for analysis"""
    # Get the authenticated user
    user = db.query(User).first()  # For now, getting first user
    if not user:
        return []  # Return empty array if no user

    # Filter repositories by user_id
    repositories = db.query(Repository).filter(
        Repository.user_id == user.id
    ).order_by(Repository.created_at.desc()).all()

    return repositories

@router.get("/{repo_id}", response_model=RepositoryResponse)
async def get_repository(repo_id: int, db: Session = Depends(get_db)):
    """Get specific repository details"""
    repository = db.query(Repository).filter(Repository.id == repo_id).first()

    if not repository:
        raise HTTPException(status_code=404, detail="Repository not found")

    return repository

@router.delete("/{repo_id}")
async def remove_repository(repo_id: int, db: Session = Depends(get_db)):
    """Remove repository from analysis"""
    repository = db.query(Repository).filter(Repository.id == repo_id).first()

    if not repository:
        raise HTTPException(status_code=404, detail="Repository not found")

    try:
        # Delete related analyses first
        from app.models.analysis import Analysis
        db.query(Analysis).filter(Analysis.repository_id == repo_id).delete()

        # Delete related PR analyses if they exist
        try:
            from app.models.pr_analysis import PRAnalysis
            db.query(PRAnalysis).filter(PRAnalysis.repository_id == repo_id).delete()
        except Exception:
            pass  # Table might not exist yet

        # Now delete the repository
        db.delete(repository)
        db.commit()

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

    try:
        commits = await github_service.get_recent_commits(user, repository.repo_name, limit)
        return [CommitResponse(**commit) for commit in commits]
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

    try:
        commit_diff = await github_service.get_commit_diff(user, repository.repo_name, commit_sha)
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

    try:
        prs = await github_service.get_repository_pull_requests(user, repository.repo_name, state, limit)
        return [GitHubPullRequestResponse(**pr) for pr in prs]
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

    try:
        pr_files = await github_service.get_pull_request_files(user, repository.repo_name, pr_number)
        return PullRequestFilesResponse(**pr_files)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to get PR files: {str(e)}")
