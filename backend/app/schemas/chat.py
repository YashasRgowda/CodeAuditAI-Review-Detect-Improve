# ============================================================================
# SCHEMAS/CHAT.PY — Conversational AI Chat Request/Response Models
# ============================================================================
# Data shapes for the multi-turn AI chat feature:
#   - ChatStartRequest:     Start a new chat session linked to an analysis
#   - ChatStartResponse:    Returns a session_id to use for follow-ups
#   - ChatMessageRequest:   Send a follow-up question in an existing session
#   - ChatMessageResponse:  AI's response with conversation history
#   - ChatMessage:          A single message (role + content)
#   - ChatHistoryResponse:  Full conversation history for a session
#
# Chat sessions are stored in Redis with auto-expiration (2 hours).
# ============================================================================

from pydantic import BaseModel


class ChatStartRequest(BaseModel):
    """Start a new chat session — provide either an analysis_id (DB) or raw context"""
    analysis_id: int | None = None
    context: dict | None = None  # Optional: pass raw analysis result directly


class ChatStartResponse(BaseModel):
    """Response when a chat session is created"""
    session_id: str
    message: str
    expires_in_seconds: int = 7200  # 2 hours


class ChatMessageRequest(BaseModel):
    """Send a follow-up question in an existing chat session"""
    session_id: str
    message: str


class ChatMessage(BaseModel):
    """A single message in the conversation"""
    role: str  # "user" or "assistant"
    content: str


class ChatMessageResponse(BaseModel):
    """AI's response to a follow-up question"""
    session_id: str
    reply: str
    history: list[ChatMessage]


class ChatHistoryResponse(BaseModel):
    """Full conversation history for a session"""
    session_id: str
    messages: list[ChatMessage]
    analysis_summary: str
