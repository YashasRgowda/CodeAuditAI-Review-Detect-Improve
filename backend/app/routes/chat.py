# ============================================================================
# ROUTES/CHAT.PY — Conversational AI Review API Endpoints
# ============================================================================
# Endpoints for multi-turn AI chat about code analysis results:
#
#   POST /analysis/chat/start     → Start a new chat session (linked to analysis)
#   POST /analysis/chat/message   → Send a follow-up question to the AI
#   GET  /analysis/chat/{id}/history → Get full conversation history
#
# Flow:
#   1. Run an analysis (quick or full) → get the result
#   2. POST /chat/start with analysis_id → get session_id
#   3. POST /chat/message with session_id + question → get AI reply
#   4. Repeat step 3 for more follow-up questions
#
# Sessions are stored in Redis and auto-expire after 2 hours.
# ============================================================================

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.analysis import Analysis
from app.schemas.chat import (
    ChatHistoryResponse,
    ChatMessage,
    ChatMessageRequest,
    ChatMessageResponse,
    ChatStartRequest,
    ChatStartResponse,
)
from app.services.chat_service import SESSION_TTL, chat_service

router = APIRouter()


# ====================================================================
# START CHAT SESSION — Link to an analysis and begin conversation
# ====================================================================
@router.post("/chat/start", response_model=ChatStartResponse)
async def start_chat_session(request: ChatStartRequest, db: Session = Depends(get_db)):
    """Start a new chat session linked to a code analysis."""
    analysis_data = None

    if request.analysis_id:
        analysis = db.query(Analysis).filter(Analysis.id == request.analysis_id).first()
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")

        changes = analysis.changes_data or {}
        analysis_data = {
            "summary": analysis.summary,
            "risk_level": analysis.risk_level,
            "change_type": changes.get("change_type", "other"),
            "files_changed": analysis.files_changed,
            "lines_added": analysis.lines_added,
            "lines_removed": analysis.lines_removed,
            "commit_hash": analysis.commit_hash,
            "commit_message": changes.get("commit_message", ""),
            "author": changes.get("author", ""),
            "recommendations": changes.get("recommendations", []),
            "security_concerns": changes.get("security_concerns", []),
            "impact_areas": changes.get("impact_areas", []),
            "code_quality_assessment": changes.get("code_quality_assessment", ""),
            "full_analysis": changes.get("full_analysis", ""),
            "maintainability_score": analysis.maintainability_score,
            "security_score": analysis.security_score,
            "performance_score": analysis.performance_score,
            "overall_score": changes.get("overall_score", 7),
            "ast_analysis": changes.get("ast_analysis", {}),
            "security_analysis": changes.get("security_analysis", {}),
            "performance_analysis": changes.get("performance_analysis", {}),
            "dependency_analysis": changes.get("dependency_analysis", {}),
        }

    elif request.context:
        analysis_data = request.context

    else:
        raise HTTPException(
            status_code=400,
            detail="Provide either analysis_id (saved analysis) or context (raw analysis result)"
        )

    try:
        session_id = chat_service.start_session(analysis_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create chat session: {str(e)}")

    return ChatStartResponse(
        session_id=session_id,
        message="Chat session started! Ask me anything about this analysis.",
        expires_in_seconds=SESSION_TTL,
    )


# ====================================================================
# SEND MESSAGE — Ask a follow-up question
# ====================================================================
@router.post("/chat/message", response_model=ChatMessageResponse)
async def send_chat_message(request: ChatMessageRequest):
    """Send a follow-up question about the analysis."""
    try:
        result = await chat_service.send_message(request.session_id, request.message)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

    return ChatMessageResponse(
        session_id=request.session_id,
        reply=result["reply"],
        history=[ChatMessage(**msg) for msg in result["history"]],
    )


# ====================================================================
# GET HISTORY — Retrieve full conversation
# ====================================================================
@router.get("/chat/{session_id}/history", response_model=ChatHistoryResponse)
async def get_chat_history(session_id: str):
    """Get the full conversation history for a chat session."""
    try:
        result = chat_service.get_history(session_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return ChatHistoryResponse(
        session_id=session_id,
        messages=[ChatMessage(**msg) for msg in result["messages"]],
        analysis_summary=result["analysis_summary"],
    )
