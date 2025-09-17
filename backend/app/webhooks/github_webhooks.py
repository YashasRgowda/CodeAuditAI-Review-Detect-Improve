from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.repository import Repository
from app.analysis.gemini_service import gemini_service
import json

router = APIRouter()

@router.post("/github")
async def github_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle GitHub webhook for automatic analysis"""
    try:
        payload = await request.json()
        
        # Handle new pull requests
        if payload.get("action") == "opened" and "pull_request" in payload:
            pr_data = payload["pull_request"]
            repo_full_name = payload["repository"]["full_name"]
            
            # Find repository in our database
            repo = db.query(Repository).filter(Repository.repo_name == repo_full_name).first()
            if repo:
                return {
                    "message": f"PR #{pr_data['number']} from {repo_full_name} queued for analysis",
                    "pr_number": pr_data["number"],
                    "repository": repo_full_name,
                    "status": "queued"
                }
        
        # Handle new commits
        elif "commits" in payload:
            repo_full_name = payload["repository"]["full_name"]
            commits = payload["commits"]
            
            return {
                "message": f"{len(commits)} commits from {repo_full_name} received",
                "repository": repo_full_name,
                "commits_count": len(commits),
                "status": "received"
            }
        
        return {"message": "Webhook received", "status": "processed"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook processing failed: {str(e)}")

@router.get("/test")
async def test_webhook():
    """Test webhook endpoint"""
    return {"message": "Webhook system is working", "status": "active"}