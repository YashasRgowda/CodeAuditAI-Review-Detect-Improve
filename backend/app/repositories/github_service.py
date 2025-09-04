import httpx
from github import Github
from fastapi import HTTPException
from typing import List, Dict, Any
from app.models.user import User

class GitHubService:
    def __init__(self):
        self.api_base_url = "https://api.github.com"
    
    async def get_user_repositories(self, user: User, per_page: int = 30) -> List[Dict[str, Any]]:
        """Fetch user's GitHub repositories"""
        try:
            # Use PyGithub for easier API interaction
            g = Github(user.access_token)
            github_user = g.get_user()
            
            repositories = []
            # Get repositories without per_page parameter - PyGithub handles pagination internally
            for repo in github_user.get_repos(sort="updated"):
                if len(repositories) >= per_page:
                    break
                    
                repo_data = {
                    "id": repo.id,
                    "name": repo.name,
                    "full_name": repo.full_name,
                    "description": repo.description,
                    "html_url": repo.html_url,
                    "clone_url": repo.clone_url,
                    "ssh_url": repo.ssh_url,
                    "private": repo.private,
                    "language": repo.language,
                    "stargazers_count": repo.stargazers_count,
                    "forks_count": repo.forks_count,
                    "updated_at": repo.updated_at.isoformat() if repo.updated_at else None,
                    "created_at": repo.created_at.isoformat() if repo.created_at else None,
                    "default_branch": repo.default_branch,
                    "size": repo.size
                }
                repositories.append(repo_data)
            
            return repositories
            
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to fetch repositories: {str(e)}")
    
    async def get_repository_details(self, user: User, repo_full_name: str) -> Dict[str, Any]:
        """Get detailed information about a specific repository"""
        try:
            g = Github(user.access_token)
            repo = g.get_repo(repo_full_name)
            
            return {
                "id": repo.id,
                "name": repo.name,
                "full_name": repo.full_name,
                "description": repo.description,
                "html_url": repo.html_url,
                "clone_url": repo.clone_url,
                "ssh_url": repo.ssh_url,
                "private": repo.private,
                "language": repo.language,
                "languages": dict(repo.get_languages()) if hasattr(repo, 'get_languages') else {},
                "stargazers_count": repo.stargazers_count,
                "forks_count": repo.forks_count,
                "open_issues_count": repo.open_issues_count,
                "updated_at": repo.updated_at.isoformat() if repo.updated_at else None,
                "created_at": repo.created_at.isoformat() if repo.created_at else None,
                "pushed_at": repo.pushed_at.isoformat() if repo.pushed_at else None,
                "default_branch": repo.default_branch,
                "size": repo.size,
                "archived": repo.archived,
                "disabled": repo.disabled,
                "topics": repo.get_topics()
            }
            
        except Exception as e:
            raise HTTPException(status_code=404, detail=f"Repository not found: {str(e)}")
    
    async def get_recent_commits(self, user: User, repo_full_name: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent commits from a repository"""
        try:
            g = Github(user.access_token)
            repo = g.get_repo(repo_full_name)
            
            commits = []
            for commit in repo.get_commits()[:limit]:
                commit_data = {
                    "sha": commit.sha,
                    "message": commit.commit.message,
                    "author": {
                        "name": commit.commit.author.name,
                        "email": commit.commit.author.email,
                        "date": commit.commit.author.date.isoformat()
                    },
                    "committer": {
                        "name": commit.commit.committer.name,
                        "email": commit.commit.committer.email,
                        "date": commit.commit.committer.date.isoformat()
                    },
                    "html_url": commit.html_url,
                    "stats": {
                        "total": commit.stats.total,
                        "additions": commit.stats.additions,
                        "deletions": commit.stats.deletions
                    } if commit.stats else None
                }
                commits.append(commit_data)
            
            return commits
            
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to fetch commits: {str(e)}")
    
    async def get_commit_diff(self, user: User, repo_full_name: str, commit_sha: str) -> Dict[str, Any]:
        """Get detailed diff information for a specific commit"""
        try:
            g = Github(user.access_token)
            repo = g.get_repo(repo_full_name)
            commit = repo.get_commit(commit_sha)
            
            files_changed = []
            for file in commit.files:
                file_data = {
                    "filename": file.filename,
                    "status": file.status,  # added, removed, modified, renamed
                    "additions": file.additions,
                    "deletions": file.deletions,
                    "changes": file.changes,
                    "patch": file.patch if hasattr(file, 'patch') else None
                }
                files_changed.append(file_data)
            
            return {
                "sha": commit.sha,
                "message": commit.commit.message,
                "author": commit.commit.author.name,
                "date": commit.commit.author.date.isoformat(),
                "stats": {
                    "total": commit.stats.total,
                    "additions": commit.stats.additions,
                    "deletions": commit.stats.deletions
                },
                "files": files_changed
            }
            
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to fetch commit diff: {str(e)}")

    async def get_repository_pull_requests(self, user: User, repo_full_name: str, state: str = "open", limit: int = 30) -> List[Dict[str, Any]]:
        """Get pull requests from a repository"""
        try:
            g = Github(user.access_token)
            repo = g.get_repo(repo_full_name)
            
            pull_requests = []
            for pr in repo.get_pulls(state=state, sort="updated")[:limit]:
                pr_data = {
                    "id": pr.id,
                    "number": pr.number,
                    "title": pr.title,
                    "body": pr.body,
                    "state": pr.state,
                    "user": pr.user.login,
                    "html_url": pr.html_url,
                    "base_branch": pr.base.ref,
                    "head_branch": pr.head.ref,
                    "created_at": pr.created_at.isoformat() if pr.created_at else None,
                    "updated_at": pr.updated_at.isoformat() if pr.updated_at else None,
                    "additions": pr.additions,
                    "deletions": pr.deletions,
                    "changed_files": pr.changed_files
                }
                pull_requests.append(pr_data)
            
            return pull_requests
            
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to fetch pull requests: {str(e)}")

    async def get_pull_request_files(self, user: User, repo_full_name: str, pr_number: int) -> Dict[str, Any]:
        """Get detailed file changes for a specific pull request"""
        try:
            g = Github(user.access_token)
            repo = g.get_repo(repo_full_name)
            pr = repo.get_pull(pr_number)
            
            files_changed = []
            for file in pr.get_files():
                file_data = {
                    "filename": file.filename,
                    "status": file.status,
                    "additions": file.additions,
                    "deletions": file.deletions,
                    "changes": file.changes,
                    "patch": file.patch if hasattr(file, 'patch') else None
                }
                files_changed.append(file_data)
            
            return {
                "pr_number": pr.number,
                "title": pr.title,
                "description": pr.body,
                "author": pr.user.login,
                "base_branch": pr.base.ref,
                "head_branch": pr.head.ref,
                "state": pr.state,
                "created_at": pr.created_at.isoformat() if pr.created_at else None,
                "stats": {
                    "total_files": pr.changed_files,
                    "additions": pr.additions,
                    "deletions": pr.deletions,
                    "total_changes": pr.additions + pr.deletions
                },
                "files": files_changed
            }
            
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to fetch PR files: {str(e)}")
        
# Create global instance
github_service = GitHubService()