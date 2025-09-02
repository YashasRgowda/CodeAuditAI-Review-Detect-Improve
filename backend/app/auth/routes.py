from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.auth.github_oauth import github_oauth
from app.auth.models import TokenResponse, UserResponse, GitHubCallbackRequest
import secrets

router = APIRouter()

@router.get("/github/login")
async def github_login():
    """Initiate GitHub OAuth login"""
    # Generate a random state for security
    state = secrets.token_urlsafe(32)
    
    # Get GitHub authorization URL
    auth_url = github_oauth.get_authorization_url(state=state)
    
    return {
        "auth_url": auth_url,
        "message": "Visit the auth_url to login with GitHub"
    }

@router.get("/github/callback")
async def github_callback(code: str, state: str = None, db: Session = Depends(get_db)):
    """Handle GitHub OAuth callback"""
    try:
        # Import here to avoid circular import
        from app.utils.security import create_access_token
        
        # Exchange code for access token
        token_data = await github_oauth.exchange_code_for_token(code)
        access_token = token_data.get("access_token")
        
        if not access_token:
            raise HTTPException(status_code=400, detail="No access token received")
        
        # Get user info from GitHub
        github_user = await github_oauth.get_user_info(access_token)
        
        # Check if user already exists
        db_user = db.query(User).filter(User.github_id == str(github_user["id"])).first()
        
        if not db_user:
            # Create new user
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
            # Update existing user's token and info
            db_user.access_token = access_token
            db_user.username = github_user["login"]
            db_user.email = github_user.get("email")
            db_user.avatar_url = github_user.get("avatar_url")
            db.commit()
        
        # Create JWT token for our app
        app_token = create_access_token(data={"sub": str(db_user.id)})
        
        return TokenResponse(
            access_token=app_token,
            token_type="bearer",
            user=UserResponse.model_validate(db_user)
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Authentication failed: {str(e)}")

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
    # We'll implement this properly later once auth is working

@router.post("/logout")
async def logout():
    """Logout user (client should delete the token)"""
    return {"message": "Successfully logged out"}