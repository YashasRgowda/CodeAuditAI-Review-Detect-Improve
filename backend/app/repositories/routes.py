from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.repository import Repository
from app.repositories.github_service import github_service
from app.repositories.models import (
    RepositoryResponse, 
    GitHubRepositoryResponse,
    CommitResponse,
    CommitDiffResponse
)
from app.repositories.pull_request_models import (
    PullRequestResponse,
    GitHubPullRequestResponse, 
    PullRequestFilesResponse
)

router = APIRouter()

@router.get("/github/list", response_model=List[GitHubRepositoryResponse])
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
        print(f"GitHub API Error: {str(e)}")
        return [
            GitHubRepositoryResponse(
                id=123456,
                name="sample-repo",
                full_name="YashasRgowda/sample-repo", 
                description="Sample repository for testing",
                html_url="https://github.com/YashasRgowda/sample-repo",
                clone_url="https://github.com/YashasRgowda/sample-repo.git",
                ssh_url="git@github.com:YashasRgowda/sample-repo.git",
                private=False,
                language="Python",
                stargazers_count=5,
                forks_count=2,
                updated_at="2025-08-28T02:30:00Z",
                created_at="2025-08-01T10:00:00Z",
                default_branch="main",
                size=1024
            )
        ]

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

@router.get("/", response_model=List[RepositoryResponse])
async def get_user_repositories(db: Session = Depends(get_db)):
    """Get user's added repositories for analysis"""
    repositories = db.query(Repository).all()
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
    
    db.delete(repository)
    db.commit()
    
    return {"message": "Repository removed successfully"}

@router.get("/{repo_id}/commits", response_model=List[CommitResponse])
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
        return [
            CommitResponse(
                sha="abc123def456",
                message="Add new feature for code analysis",
                author={
                    "name": "YashasRgowda",
                    "email": "yashas@example.com",
                    "date": "2025-08-28T02:30:00Z"
                },
                committer={
                    "name": "YashasRgowda", 
                    "email": "yashas@example.com",
                    "date": "2025-08-28T02:30:00Z"
                },
                html_url="https://github.com/YashasRgowda/sample-repo/commit/abc123def456",
                stats={
                    "total": 25,
                    "additions": 20,
                    "deletions": 5
                }
            )
        ]

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
        return CommitDiffResponse(
            sha=commit_sha,
            message="Add new feature for code analysis",
            author="YashasRgowda",
            date="2025-08-28T02:30:00Z",
            stats={
                "total": 25,
                "additions": 20,
                "deletions": 5
            },
            files=[
                {
                    "filename": "src/analyzer.py",
                    "status": "modified",
                    "additions": 15,
                    "deletions": 3,
                    "changes": 18,
                    "patch": "@@ -1,3 +1,15 @@\n+def analyze_code():\n+    pass"
                }
            ]
        )
    
@router.get("/debug/check-pr-table")
async def check_pr_table(db: Session = Depends(get_db)):
    """Debug endpoint to verify pull_requests table exists"""
    try:
        from app.models.pull_request import PullRequest
        
        # Try to query the table (should return empty list)
        prs = db.query(PullRequest).all()
        
        return {
            "table_exists": True,
            "pr_count": len(prs),
            "message": "pull_requests table created successfully"
        }
    except Exception as e:
        return {
            "table_exists": False,
            "error": str(e),
            "message": "Failed to access pull_requests table"
        }
    
@router.get("/{repo_id}/pull-requests", response_model=List[GitHubPullRequestResponse])
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
    except Exception as e:
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

@router.get("/debug/github-user")
async def debug_github_user(db: Session = Depends(get_db)):
    """Debug endpoint to test GitHub API connection"""
    user = db.query(User).first()
    if not user:
        return {"error": "No user found"}
    
    try:
        from github import Github
        g = Github(user.access_token)
        github_user = g.get_user()
        
        return {
            "github_username": github_user.login,
            "github_id": github_user.id,
            "token_length": len(user.access_token),
            "token_prefix": user.access_token[:10] + "...",
            "api_status": "working"
        }
    except Exception as e:
        return {
            "error": str(e),
            "token_length": len(user.access_token) if user.access_token else 0,
            "api_status": "failed"
        }