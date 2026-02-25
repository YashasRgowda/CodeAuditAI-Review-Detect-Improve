# ============================================================================
# ANALYSIS/ROUTES.PY — AI Analysis API Endpoints
# ============================================================================
# All endpoints for AI-powered code analysis:
#
#   STANDARD ENDPOINTS (JSON request/response):
#   - POST /analysis/quick             → Quick AI summary of a commit
#   - POST /analysis/                  → Full detailed AI analysis (saves to DB)
#   - GET  /analysis/                  → List all past analyses (with filters)
#   - GET  /analysis/{id}              → Get a specific analysis by ID
#   - GET  /analysis/compare/{id1}/{id2} → Compare two analyses side-by-side
#   - DELETE /analysis/{id}            → Delete an analysis
#   - POST /analysis/pr/quick          → Quick AI PR analysis
#   - POST /analysis/pr/               → Full AI PR analysis (saves to DB)
#
#   STREAMING ENDPOINTS (Server-Sent Events):
#   - POST /analysis/stream            → Real-time streaming commit analysis
#   - POST /analysis/pr/stream         → Real-time streaming PR analysis
#
# Quick analysis returns results without saving to DB.
# Full analysis saves results to the database for history tracking.
# Stream endpoints send real-time progress events via SSE.
# ============================================================================

import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sse_starlette.sse import EventSourceResponse

from app.analysis.gemini_service import gemini_service
from app.analysis.models import (
    AnalysisCreate,
    AnalysisRequest,
    AnalysisResponse,
    DetailedAnalysisResponse,
    QuickAnalysisResponse,
    StreamAnalysisRequest,
)
from app.analysis.pr_analysis_models import (
    PRAnalysisRequest,
    PRAnalysisResponse,
    QuickPRAnalysisRequest,
    QuickPRAnalysisResponse,
    StreamPRAnalysisRequest,
)
from app.database import get_db
from app.models.analysis import Analysis
from app.models.pr_analysis import PRAnalysis
from app.models.repository import Repository
from app.models.user import User
from app.repositories.github_service import github_service

router = APIRouter()


# ====================================================================
# STREAMING ENDPOINTS — Real-time SSE (Server-Sent Events)
# ====================================================================

@router.post("/stream")
async def stream_analysis(request: StreamAnalysisRequest, db: Session = Depends(get_db)):
    """Stream AI analysis in real-time via Server-Sent Events (SSE).

    Sends progress events as the analysis runs:
    - event: progress → {step, message, progress%}
    - event: complete → {result, message, progress: 100}
    - event: error    → {message}
    """
    # Validate repository and user
    repository = db.query(Repository).filter(Repository.id == request.repository_id).first()
    if not repository:
        raise HTTPException(status_code=404, detail="Repository not found")

    user = db.query(User).filter(User.id == repository.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Repository owner not found")

    # Fetch commit data from GitHub
    try:
        commit_data = await github_service.get_commit_diff(user, repository.repo_name, request.commit_sha)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch commit: {str(e)}")

    # Stream the analysis as SSE events
    async def event_generator():
        async for event in gemini_service.stream_analysis(commit_data):
            yield {
                "event": event["event"],
                "data": json.dumps(event["data"])
            }

    return EventSourceResponse(event_generator())


@router.post("/pr/stream")
async def stream_pr_analysis(request: StreamPRAnalysisRequest, db: Session = Depends(get_db)):
    """Stream PR analysis in real-time via Server-Sent Events (SSE)."""
    repository = db.query(Repository).filter(Repository.id == request.repository_id).first()
    if not repository:
        raise HTTPException(status_code=404, detail="Repository not found")

    user = db.query(User).filter(User.id == repository.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Repository owner not found")

    try:
        pr_data = await github_service.get_pull_request_files(user, repository.repo_name, request.pr_number)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch PR: {str(e)}")

    async def event_generator():
        async for event in gemini_service.stream_pr_analysis(pr_data):
            yield {
                "event": event["event"],
                "data": json.dumps(event["data"])
            }

    return EventSourceResponse(event_generator())


# ====================================================================
# STANDARD COMMIT ANALYSIS ENDPOINTS
# ====================================================================

@router.post("/quick", response_model=QuickAnalysisResponse)
async def quick_analysis(request: AnalysisRequest, db: Session = Depends(get_db)):
    """Quick AI analysis of a commit — returns results without saving to DB"""

    repository = db.query(Repository).filter(Repository.id == request.repository_id).first()
    if not repository:
        raise HTTPException(status_code=404, detail="Repository not found")

    user = db.query(User).filter(User.id == repository.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Repository owner not found")

    # Fetch real commit data from GitHub
    try:
        commit_data = await github_service.get_commit_diff(user, repository.repo_name, request.commit_sha)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch commit: {str(e)}")

    # Analyze with Gemini AI (structured JSON output)
    try:
        analysis_result = await gemini_service.analyze_code_changes(commit_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

    return QuickAnalysisResponse(
        summary=analysis_result["summary"],
        risk_level=analysis_result["risk_level"],
        change_type=analysis_result["change_type"],
        files_changed=analysis_result["files_changed"],
        lines_added=analysis_result["lines_added"],
        lines_removed=analysis_result["lines_removed"],
        commit_hash=analysis_result["commit_hash"],
        commit_message=analysis_result["commit_message"],
        author=analysis_result["author"],
        recommendations=analysis_result.get("recommendations", []),
        impact_areas=analysis_result.get("impact_areas", []),
        security_concerns=analysis_result.get("security_concerns", []),
        maintainability_score=analysis_result.get("maintainability_score", 70),
        security_score=analysis_result.get("security_score", 100),
        performance_score=analysis_result.get("performance_score", 100),
        overall_score=analysis_result.get("overall_score", 7),
    )


@router.post("/", response_model=AnalysisResponse)
async def create_analysis(
    analysis_data: AnalysisCreate,
    db: Session = Depends(get_db)
):
    """Create and save a detailed analysis to the database"""

    repository = db.query(Repository).filter(Repository.id == analysis_data.repository_id).first()
    if not repository:
        raise HTTPException(status_code=404, detail="Repository not found")

    user = db.query(User).filter(User.id == repository.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Repository owner not found")

    # Check if analysis already exists for this commit
    existing_analysis = db.query(Analysis).filter(
        Analysis.repository_id == analysis_data.repository_id,
        Analysis.commit_hash == analysis_data.commit_hash
    ).first()

    if existing_analysis:
        return existing_analysis

    # Fetch real commit data from GitHub
    try:
        commit_diff = await github_service.get_commit_diff(user, repository.repo_name, analysis_data.commit_hash)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch commit: {str(e)}")

    # Analyze with Gemini AI (structured JSON output)
    try:
        analysis_result = await gemini_service.analyze_code_changes(commit_diff)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

    # Save to database
    try:
        analysis = Analysis(
            repository_id=analysis_data.repository_id,
            commit_hash=analysis_data.commit_hash,
            summary=analysis_result.get("summary", "Analysis completed"),
            changes_data=analysis_result,
            risk_level=analysis_result.get("risk_level", "medium"),
            files_changed=analysis_result.get("files_changed", 0),
            lines_added=analysis_result.get("lines_added", 0),
            lines_removed=analysis_result.get("lines_removed", 0),
            # AI-generated scores (from structured JSON — no more defaults!)
            maintainability_score=analysis_result.get("maintainability_score", 70),
            security_score=analysis_result.get("security_score", 100),
            performance_score=analysis_result.get("performance_score", 100),
            dependency_complexity=len(analysis_result.get("dependency_analysis", {}).get("cross_file_connections", [])),
            technical_debt_ratio=sum(a.get("technical_debt_ratio", 0) for a in analysis_result.get("ast_analysis", {}).get("complexity_summary", []))
        )

        db.add(analysis)
        db.commit()
        db.refresh(analysis)

        return analysis
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save analysis: {str(e)}")


@router.get("/", response_model=list[AnalysisResponse])
async def get_analyses(
    repository_id: Optional[int] = Query(None),
    limit: int = Query(10, le=50),
    db: Session = Depends(get_db)
):
    """Get analysis history"""
    query = db.query(Analysis)

    if repository_id:
        query = query.filter(Analysis.repository_id == repository_id)

    analyses = query.order_by(Analysis.created_at.desc()).limit(limit).all()
    return analyses


@router.get("/{analysis_id}", response_model=DetailedAnalysisResponse)
async def get_analysis(analysis_id: int, db: Session = Depends(get_db)):
    """Get detailed analysis by ID"""
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    changes = analysis.changes_data or {}

    return DetailedAnalysisResponse(
        id=analysis.id,
        summary=analysis.summary,
        full_analysis=changes.get("full_analysis", ""),
        risk_level=analysis.risk_level,
        change_type=changes.get("change_type", "other"),
        files_changed=analysis.files_changed,
        lines_added=analysis.lines_added,
        lines_removed=analysis.lines_removed,
        commit_hash=analysis.commit_hash,
        commit_message=changes.get("commit_message", ""),
        author=changes.get("author", ""),
        repository_name=analysis.repository.repo_name,
        created_at=analysis.created_at,
        changes_data=changes,
        recommendations=changes.get("recommendations", []),
        impact_areas=changes.get("impact_areas", []),
        security_concerns=changes.get("security_concerns", []),
        maintainability_score=analysis.maintainability_score,
        security_score=analysis.security_score,
        performance_score=analysis.performance_score,
        overall_score=changes.get("overall_score", 7),
    )


# ====================================================================
# PR ANALYSIS ENDPOINTS
# ====================================================================

@router.post("/pr/quick", response_model=QuickPRAnalysisResponse)
async def quick_pr_analysis(request: QuickPRAnalysisRequest, db: Session = Depends(get_db)):
    """Quick PR analysis without saving to database"""
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=401, detail="No authenticated user found")

    try:
        pr_data = await github_service.get_pull_request_files(user, request.repo_full_name, request.pr_number)
        analysis_result = await gemini_service.analyze_pull_request(pr_data)

        return QuickPRAnalysisResponse(
            pr_number=analysis_result["pr_number"],
            title=analysis_result["pr_title"],
            summary=analysis_result["summary"],
            risk_level=analysis_result["risk_level"],
            change_type=analysis_result["change_type"],
            files_changed=analysis_result["files_changed"],
            lines_added=analysis_result["lines_added"],
            lines_removed=analysis_result["lines_removed"],
            impact_areas=analysis_result.get("impact_areas", []),
            security_concerns=analysis_result.get("security_concerns", []),
            recommendations=analysis_result.get("recommendations", []),
            maintainability_score=analysis_result.get("maintainability_score", 70),
            security_score=analysis_result.get("security_score", 100),
            performance_score=analysis_result.get("performance_score", 100),
            overall_score=analysis_result.get("overall_score", 7),
        )

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PR analysis failed: {str(e)}")


@router.post("/pr/", response_model=PRAnalysisResponse)
async def create_pr_analysis(analysis_request: PRAnalysisRequest, db: Session = Depends(get_db)):
    """Create and save PR analysis to database"""
    repository = db.query(Repository).filter(Repository.id == analysis_request.repository_id).first()
    if not repository:
        raise HTTPException(status_code=404, detail="Repository not found")

    user = db.query(User).filter(User.id == repository.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Repository owner not found")

    try:
        pr_data = await github_service.get_pull_request_files(user, repository.repo_name, analysis_request.pr_number)
        analysis_result = await gemini_service.analyze_pull_request(pr_data)

        pr_analysis = PRAnalysis(
            repository_id=analysis_request.repository_id,
            pr_number=analysis_request.pr_number,
            summary=analysis_result["summary"],
            full_analysis=analysis_result["full_analysis"],
            risk_level=analysis_result["risk_level"],
            change_type=analysis_result["change_type"],
            files_changed=analysis_result["files_changed"],
            lines_added=analysis_result["lines_added"],
            lines_removed=analysis_result["lines_removed"],
            overall_score=analysis_result["overall_score"],
            analysis_data=analysis_result
        )

        db.add(pr_analysis)
        db.commit()
        db.refresh(pr_analysis)

        return PRAnalysisResponse(
            id=pr_analysis.id,
            repository_id=pr_analysis.repository_id,
            pull_request_id=pr_analysis.pull_request_id,
            pr_number=pr_analysis.pr_number,
            summary=pr_analysis.summary,
            full_analysis=pr_analysis.full_analysis,
            risk_level=pr_analysis.risk_level,
            change_type=pr_analysis.change_type,
            files_changed=pr_analysis.files_changed,
            lines_added=pr_analysis.lines_added,
            lines_removed=pr_analysis.lines_removed,
            security_issues=[],
            recommendations=analysis_result.get("recommendations", []),
            maintainability_score=analysis_result.get("maintainability_score", 70),
            security_score=analysis_result.get("security_score", 100),
            performance_score=analysis_result.get("performance_score", 100),
            overall_score=analysis_result.get("overall_score", 7),
            created_at=pr_analysis.created_at
        )

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PR analysis creation failed: {str(e)}")


# ====================================================================
# UTILITY ENDPOINTS
# ====================================================================

@router.delete("/{analysis_id}")
async def delete_analysis(analysis_id: int, db: Session = Depends(get_db)):
    """Delete an analysis"""
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    db.delete(analysis)
    db.commit()

    return {"message": "Analysis deleted successfully"}


@router.get("/compare/{analysis_id1}/{analysis_id2}")
async def compare_analyses(analysis_id1: int, analysis_id2: int, db: Session = Depends(get_db)):
    """Compare two analyses side-by-side"""
    analysis1 = db.query(Analysis).filter(Analysis.id == analysis_id1).first()
    analysis2 = db.query(Analysis).filter(Analysis.id == analysis_id2).first()

    if not analysis1 or not analysis2:
        raise HTTPException(status_code=404, detail="Analysis not found")

    return {
        "comparison": {
            "maintainability_change": analysis2.maintainability_score - analysis1.maintainability_score,
            "security_change": analysis2.security_score - analysis1.security_score,
            "performance_change": analysis2.performance_score - analysis1.performance_score,
            "complexity_change": analysis2.dependency_complexity - analysis1.dependency_complexity,
            "improvement_trend": "positive" if analysis2.maintainability_score > analysis1.maintainability_score else "negative"
        },
        "analysis1": {"id": analysis1.id, "commit": analysis1.commit_hash, "created": analysis1.created_at},
        "analysis2": {"id": analysis2.id, "commit": analysis2.commit_hash, "created": analysis2.created_at}
    }
