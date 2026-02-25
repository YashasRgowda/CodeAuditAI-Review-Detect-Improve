# ============================================================================
# AUTH/MODELS.PY — Pydantic Schemas for Authentication
# ============================================================================
# Defines request/response shapes for auth-related API endpoints:
#   - UserCreate: Data needed to create a new user in the database
#   - UserResponse: User data returned to the frontend (no sensitive fields)
#   - TokenResponse: JWT token + user info returned after successful login
#   - GitHubCallbackRequest: The code & state sent from GitHub after OAuth
# ============================================================================

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    github_id: str
    username: str
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    access_token: str

class UserResponse(BaseModel):
    id: int
    github_id: str
    username: str
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class GitHubCallbackRequest(BaseModel):
    code: str
    state: Optional[str] = None