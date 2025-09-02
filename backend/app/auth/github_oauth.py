import httpx
from fastapi import HTTPException
from app.config import settings

class GitHubOAuth:
    def __init__(self):
        self.client_id = settings.GITHUB_CLIENT_ID
        self.client_secret = settings.GITHUB_CLIENT_SECRET
        self.authorize_url = "https://github.com/login/oauth/authorize"
        self.token_url = "https://github.com/login/oauth/access_token"
        self.user_url = "https://api.github.com/user"
    
    def get_authorization_url(self, state: str = None) -> str:
        """Generate GitHub OAuth authorization URL"""
        params = {
            "client_id": self.client_id,
            "scope": "user:email,repo",  # Request user info and repo access
            "redirect_uri": "http://localhost:8000/auth/github/callback"
        }
        if state:
            params["state"] = state
        
        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"{self.authorize_url}?{query_string}"
    
    async def exchange_code_for_token(self, code: str) -> dict:
        """Exchange authorization code for access token"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.token_url,
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                json={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "code": code
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to exchange code for token")
            
            return response.json()
    
    async def get_user_info(self, access_token: str) -> dict:
        """Get user information from GitHub API"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                self.user_url,
                headers={
                    "Authorization": f"token {access_token}",
                    "Accept": "application/json"
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to get user info")
            
            return response.json()

# Create global instance
github_oauth = GitHubOAuth()