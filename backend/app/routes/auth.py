# ============================================================================
# ROUTES/AUTH.PY — Authentication API Endpoints
# ============================================================================
# Handles all authentication-related API routes:
#   - GET  /auth/github/login    → Returns GitHub OAuth URL for login
#   - GET  /auth/github/callback → GitHub redirects here after user approves;
#     exchanges code for token, creates/updates user in DB, redirects to frontend
#   - POST /auth/github/callback → Same as above but via POST (for frontend)
#   - GET  /auth/me              → Get current authenticated user info
#   - POST /auth/logout          → Logout (client deletes token)
# ============================================================================

import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import GitHubCallbackRequest
from app.services.github_oauth import github_oauth

router = APIRouter()


@router.get("/github/login")
async def github_login():
    """Initiate GitHub OAuth login"""
    state = secrets.token_urlsafe(32)
    auth_url = github_oauth.get_authorization_url(state=state)

    return {
        "auth_url": auth_url,
        "message": "Visit the auth_url to login with GitHub"
    }


@router.get("/github/callback")
async def github_callback(code: str, state: str = None, db: Session = Depends(get_db)):
    """Handle GitHub OAuth callback"""
    try:
        from app.core.security import create_access_token

        token_data = await github_oauth.exchange_code_for_token(code)
        access_token = token_data.get("access_token")

        if not access_token:
            raise HTTPException(status_code=400, detail="No access token received")

        github_user = await github_oauth.get_user_info(access_token)

        db_user = db.query(User).filter(User.github_id == str(github_user["id"])).first()

        if not db_user:
            db_user = User(
                github_id=str(github_user["id"]),
                username=github_user["login"],
                email=github_user.get("email"),
                avatar_url=github_user.get("avatar_url"),
                access_token=access_token
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
        else:
            db_user.access_token = access_token
            db_user.username = github_user["login"]
            db_user.email = github_user.get("email")
            db_user.avatar_url = github_user.get("avatar_url")
            db.commit()

        create_access_token(data={"sub": str(db_user.id)})

        from fastapi.responses import RedirectResponse
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/auth/callback?code={code}&state={state}",
            status_code=302
        )

    except Exception:
        from fastapi.responses import RedirectResponse
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/auth?error=callback_failed",
            status_code=302
        )


@router.post("/github/callback")
async def github_callback_post(
    callback_data: GitHubCallbackRequest,
    db: Session = Depends(get_db)
):
    """Handle GitHub OAuth callback via POST (for frontend)"""
    return await github_callback(
        code=callback_data.code,
        state=callback_data.state,
        db=db
    )


@router.get("/me")
async def get_current_user_info():
    """Get current authenticated user"""
    return {"message": "Authentication endpoint - requires valid token"}


@router.post("/logout")
async def logout():
    """Logout user (client should delete the token)"""
    return {"message": "Successfully logged out"}
