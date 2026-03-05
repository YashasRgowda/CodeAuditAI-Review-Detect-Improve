# ============================================================================
# SERVICES/GITHUB_OAUTH.PY — GitHub OAuth Authentication Handler
# ============================================================================
# Handles the GitHub OAuth 2.0 flow for user login:
#   1. get_authorization_url() → Builds the GitHub login URL with scopes
#      (user:email + repo access)
#   2. exchange_code_for_token() → After user approves, exchanges the
#      authorization code for a GitHub access token
#   3. get_user_info() → Uses the access token to fetch user profile
#      (username, email, avatar) from GitHub API
#
# Flow: Frontend → GitHub Login → GitHub Callback → Token → User Info
# ============================================================================

import httpx
from fastapi import HTTPException

from app.core.config import settings




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
            "scope": "user:email,repo",
            "redirect_uri": f"{settings.BACKEND_URL}/auth/github/callback",
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
