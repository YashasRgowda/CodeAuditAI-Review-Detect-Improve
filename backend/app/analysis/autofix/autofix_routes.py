# ============================================================================
# AUTOFIX/AUTOFIX_ROUTES.PY — Auto-Fix API Endpoints
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
#   2. Report shows issues with "🔧 Fix available" flags
#   3. User calls POST /analysis/auto-fix with issue indices
#   4. AI generates actual corrected code for each requested issue
#   5. User reviews the fixes and decides whether to apply them
# ============================================================================

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.analysis.autofix.autofix_models import (
    AutoFixCustomRequest,
    AutoFixCustomResponse,
    AutoFixRequest,
    AutoFixResponse,
    CodeFix,
)
from app.analysis.autofix.autofix_service import autofix_service
from app.analysis.gemini_service import gemini_service
from app.database import get_db
from app.models.repository import Repository
from app.models.user import User
from app.repositories.github_service import github_service

router = APIRouter()


@router.post("/auto-fix", response_model=AutoFixResponse)
async def generate_auto_fix(
    request: AutoFixRequest,
    db: Session = Depends(get_db),
):
    """Generate AI code fixes for issues found in a commit analysis.

    This is an ON-DEMAND endpoint — the user must first run an analysis
    (POST /analysis/quick or /multi-agent/quick), review the report,
    and then call this endpoint to get actual code fixes.

    Steps:
    1. Fetches the commit from GitHub
    2. Runs the same AI analysis to identify issues
    3. Generates ACTUAL corrected code for each issue (or selected ones)
    4. Returns before/after code with explanations

    Request body:
    - repository_id: ID of the repository
    - commit_sha: The commit hash to fix issues for
    - issue_indices: (optional) List of issue indices to fix.
      Empty list = fix ALL fixable issues.

    Response: List of fixes with original_code, fixed_code, explanation, confidence.
    """
    # Validate repository exists
    repository = db.query(Repository).filter(Repository.id == request.repository_id).first()
    if not repository:
        raise HTTPException(status_code=404, detail="Repository not found")

    # Get repo owner's GitHub credentials
    user = db.query(User).filter(User.id == repository.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Repository owner not found")

    # Fetch commit data from GitHub
    try:
        commit_data = await github_service.get_commit_diff(
            user, repository.repo_name, request.commit_sha
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch commit: {str(e)}")

    # Step 1: Run analysis first to identify issues
    try:
        analysis_result = await gemini_service.analyze_code_changes(commit_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

    # Step 2: Generate fixes for the issues found
    try:
        fix_result = await autofix_service.generate_fixes_for_commit(
            commit_data=commit_data,
            analysis_result=analysis_result,
            issue_indices=request.issue_indices if request.issue_indices else None,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fix generation failed: {str(e)}")

    # Build response
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
    """Generate an AI fix for a user-provided code snippet.

    No GitHub or prior analysis required — the user pastes their code,
    describes what's wrong, and the AI generates a corrected version.

    Great for:
    - Quick one-off fixes without running a full analysis
    - Fixing code that isn't in a GitHub repository
    - Learning — see how the AI would fix a specific issue

    Request body:
    - code_snippet: The raw code that has the issue
    - language: Programming language (python, javascript, etc.)
    - issue_description: What the user wants fixed
    - file_name: (optional) File name for context

    Response: Fixed code with explanation, confidence, and additional suggestions.
    """
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
