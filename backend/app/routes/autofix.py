# ============================================================================
# ROUTES/AUTOFIX.PY — Auto-Fix API Endpoints
# ============================================================================
# Endpoints for on-demand AI code fix generation:
#
#   - POST /analysis/auto-fix          → Fix issues from a commit analysis
#   - POST /analysis/auto-fix/custom   → Fix a user-provided code snippet
#
# Key design: HUMAN-IN-THE-LOOP — The user runs an analysis first, reviews
# the report, and THEN decides which issues they want the AI to fix.
# Fixes are never auto-applied; the user reviews the before/after code.
#
# Flow:
#   1. User runs POST /analysis/quick (or multi-agent) → gets report
#   2. Report shows issues with "Fix available" flags
#   3. User calls POST /analysis/auto-fix with issue indices
#   4. AI generates actual corrected code for each requested issue
#   5. User reviews the fixes and decides whether to apply them
# ============================================================================

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.repository import Repository
from app.models.user import User
from app.schemas.autofix import (
    AutoFixCustomRequest,
    AutoFixCustomResponse,
    AutoFixRequest,
    AutoFixResponse,
    CodeFix,
)
from app.services.autofix_service import autofix_service
from app.services.gemini_service import gemini_service
from app.services.github_service import github_service

router = APIRouter()


@router.post("/auto-fix", response_model=AutoFixResponse)
async def generate_auto_fix(
    request: AutoFixRequest,
    db: Session = Depends(get_db),
):
    """Generate AI code fixes for issues found in a commit analysis."""
    repository = db.query(Repository).filter(Repository.id == request.repository_id).first()
    if not repository:
        raise HTTPException(status_code=404, detail="Repository not found")

    user = db.query(User).filter(User.id == repository.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Repository owner not found")

    try:
        commit_data = await github_service.get_commit_diff(
            user, repository.repo_name, request.commit_sha
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch commit: {str(e)}")

    try:
        analysis_result = await gemini_service.analyze_code_changes(commit_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

    try:
        fix_result = await autofix_service.generate_fixes_for_commit(
            commit_data=commit_data,
            analysis_result=analysis_result,
            issue_indices=request.issue_indices if request.issue_indices else None,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fix generation failed: {str(e)}")

    fixes = [
        CodeFix(
            issue_title=fix.get("issue_title", ""),
            issue_type=fix.get("issue_type", ""),
            severity=fix.get("severity", "medium"),
            file_name=fix.get("file_name", ""),
            original_code=fix.get("original_code", ""),
            fixed_code=fix.get("fixed_code", ""),
            explanation=fix.get("explanation", ""),
            confidence=fix.get("confidence", "medium"),
        )
        for fix in fix_result.get("fixes", [])
    ]

    return AutoFixResponse(
        commit_hash=fix_result.get("commit_hash", ""),
        total_issues_found=fix_result.get("total_issues_found", 0),
        total_fixes_generated=fix_result.get("total_fixes_generated", 0),
        fixes=fixes,
        summary=fix_result.get("summary", ""),
    )


@router.post("/auto-fix/custom", response_model=AutoFixCustomResponse)
async def generate_custom_fix(request: AutoFixCustomRequest):
    """Generate an AI fix for a user-provided code snippet."""
    if not request.code_snippet.strip():
        raise HTTPException(status_code=400, detail="Code snippet cannot be empty")

    if not request.issue_description.strip():
        raise HTTPException(
            status_code=400, detail="Issue description cannot be empty"
        )

    try:
        fix_result = await autofix_service.generate_custom_fix(
            code_snippet=request.code_snippet,
            language=request.language,
            issue_description=request.issue_description,
            file_name=request.file_name,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fix generation failed: {str(e)}")

    return AutoFixCustomResponse(
        file_name=fix_result.get("file_name", ""),
        language=fix_result.get("language", ""),
        original_code=fix_result.get("original_code", ""),
        fixed_code=fix_result.get("fixed_code", ""),
        explanation=fix_result.get("explanation", ""),
        confidence=fix_result.get("confidence", "medium"),
        additional_suggestions=fix_result.get("additional_suggestions", []),
    )
