# ============================================================================
# AGENTS/AGENT_ROUTES.PY — Multi-Agent Analysis API Endpoints
# ============================================================================
# Defines API endpoints for the multi-agent analysis system:
#
#   - POST /analysis/multi-agent/quick       → Quick multi-agent commit analysis
#   - POST /analysis/multi-agent/pr/quick    → Quick multi-agent PR analysis
#   - POST /analysis/multi-agent/stream      → Streaming multi-agent commit analysis
#
# These endpoints run 3 specialist AI agents (Security, Performance,
# Architecture) IN PARALLEL and merge their reports into a single
# comprehensive review — deeper insights than the single-agent analysis.
# ============================================================================

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sse_starlette.sse import EventSourceResponse

from app.analysis.agents.agent_models import (
    MultiAgentAnalysisRequest,
    MultiAgentPRAnalysisRequest,
)
from app.analysis.agents.orchestrator import agent_orchestrator
from app.database import get_db
from app.models.repository import Repository
from app.models.user import User
from app.repositories.github_service import github_service

router = APIRouter()


@router.post("/multi-agent/quick")
async def multi_agent_quick_analysis(
    request: MultiAgentAnalysisRequest,
    db: Session = Depends(get_db),
):
    """Run multi-agent AI analysis on a commit — 3 specialist agents in parallel.

    Launches SecurityAgent, PerformanceAgent, and ArchitectureAgent simultaneously.
    Each agent focuses exclusively on its domain, producing deeper insights than
    a single generalist prompt.

    Returns a unified report with:
    - Top-level scores and summary (backward compatible)
    - `agent_reports` section with detailed findings from each specialist
    """
    # Validate repository exists
    repository = db.query(Repository).filter(Repository.id == request.repository_id).first()
    if not repository:
        raise HTTPException(status_code=404, detail="Repository not found")

    # Get the repo owner's GitHub credentials
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

    # Run all 3 agents in parallel via orchestrator
    result = await agent_orchestrator.run_multi_agent_analysis(commit_data)
    return result


@router.post("/multi-agent/pr/quick")
async def multi_agent_quick_pr_analysis(
    request: MultiAgentPRAnalysisRequest,
    db: Session = Depends(get_db),
):
    """Run multi-agent AI analysis on a pull request — 3 specialist agents in parallel.

    Same specialist agents as commit analysis, but tailored for PR review.
    """
    repository = db.query(Repository).filter(Repository.id == request.repository_id).first()
    if not repository:
        raise HTTPException(status_code=404, detail="Repository not found")

    user = db.query(User).filter(User.id == repository.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Repository owner not found")

    try:
        pr_data = await github_service.get_pull_request_files(
            user, repository.repo_name, request.pr_number
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch PR: {str(e)}")

    result = await agent_orchestrator.run_multi_agent_pr_analysis(pr_data)
    return result


@router.post("/multi-agent/stream")
async def stream_multi_agent_analysis(
    request: MultiAgentAnalysisRequest,
    db: Session = Depends(get_db),
):
    """Stream multi-agent analysis progress via Server-Sent Events (SSE).

    Sends real-time progress events as each agent completes:
    - event: progress       → {step, message, progress%}
    - event: agent_complete  → {agent, status, message}
    - event: complete       → {result, agents_used, progress: 100}
    - event: error          → {message}
    """
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

    async def event_generator():
        async for event in agent_orchestrator.stream_multi_agent_analysis(commit_data):
            yield {
                "event": event["event"],
                "data": json.dumps(event["data"]),
            }

    return EventSourceResponse(event_generator())
