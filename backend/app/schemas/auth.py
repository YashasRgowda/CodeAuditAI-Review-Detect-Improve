# ============================================================================
# SCHEMAS/AUTH.PY — Authentication Request/Response Models
# ============================================================================
# Defines the data shapes for auth-related API endpoints:
#   - UserCreate:           Data needed to create a new user in the database
#   - UserResponse:         User data returned to the frontend (no secrets)
#   - TokenResponse:        JWT token + user info returned after login
#   - GitHubCallbackRequest: The OAuth code sent from GitHub after authorization
# ============================================================================

from datetime import datetime

from pydantic import BaseModel


class UserCreate(BaseModel):
    github_id: str
    username: str
    email: str | None = None
    avatar_url: str | None = None
    access_token: str


class UserResponse(BaseModel):
    id: int
    github_id: str
    username: str
    email: str | None = None
    avatar_url: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class GitHubCallbackRequest(BaseModel):
    code: str
    state: str | None = None
