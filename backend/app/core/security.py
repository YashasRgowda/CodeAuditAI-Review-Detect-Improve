# ============================================================================
# CORE/SECURITY.PY — JWT Authentication & Token Management
# ============================================================================
# Handles all JWT (JSON Web Token) operations for securing API endpoints:
#   - create_access_token() → Creates a signed JWT with user_id + expiry
#   - verify_token()        → Decodes and validates a JWT token
#   - get_current_user()    → FastAPI dependency — extracts user from token
#   - get_current_user_optional() → Same but returns None if no token
# Tokens expire after 30 minutes (configurable in config.py).
# Used as a dependency in route handlers: Depends(get_current_user)
# ============================================================================

from datetime import UTC, datetime, timedelta

import httpx
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User

# OAuth2 scheme
security = HTTPBearer()

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> dict | None:
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = verify_token(credentials.credentials)
    if payload is None:
        raise credentials_exception

    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception

    return user

async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db)
) -> User | None:
    """Get current user if authenticated, else None"""
    if not credentials:
        return None

    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None


async def get_github_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    """
    Resolve the current user from a GitHub OAuth token.

    The frontend sends: Authorization: token <github_access_token>
    We look up the user in the DB by their stored token. If they don't
    exist yet (e.g. fresh Docker DB), we call the GitHub API to fetch
    their profile and create the record automatically.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header:
        raise HTTPException(status_code=401, detail="No authorization token provided")

    if auth_header.startswith("token "):
        github_token = auth_header[6:]
    elif auth_header.startswith("Bearer "):
        github_token = auth_header[7:]
    else:
        raise HTTPException(status_code=401, detail="Invalid authorization header format")

    # Fast path: token already in DB
    user = db.query(User).filter(User.access_token == github_token).first()
    if user:
        return user

    # Slow path: unknown token — verify with GitHub and create/update user
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"token {github_token}", "Accept": "application/json"},
                timeout=10.0,
            )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid or expired GitHub token")
        gh = resp.json()
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=401, detail=f"Failed to verify GitHub token: {exc}") from exc

    # Find by GitHub ID and update, or create fresh
    user = db.query(User).filter(User.github_id == str(gh["id"])).first()
    if user:
        user.access_token = github_token
        user.username = gh.get("login", user.username)
        user.avatar_url = gh.get("avatar_url", user.avatar_url)
        db.commit()
        db.refresh(user)
    else:
        user = User(
            github_id=str(gh["id"]),
            username=gh["login"],
            email=gh.get("email"),
            avatar_url=gh.get("avatar_url"),
            access_token=github_token,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user
