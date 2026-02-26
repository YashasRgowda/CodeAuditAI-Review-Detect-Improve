# ============================================================================
# ANALYSIS/CHAT_MODELS.PY — Pydantic Schemas for Conversational AI Review
# ============================================================================
# Defines request/response shapes for the multi-turn chat feature:
#
#   - ChatStartRequest:  Start a new chat session linked to an analysis
#   - ChatStartResponse: Returns a session_id to use for follow-up messages
#   - ChatMessageRequest:  Send a follow-up question in an existing session
#   - ChatMessageResponse: AI's response with the full conversation history
#   - ChatMessage:  A single message in the conversation (role + content)
#   - ChatHistoryResponse: Full conversation history for a session
#
# Chat sessions are stored in Redis with auto-expiration (2 hours).
# The AI receives the full analysis context so it can answer specific
# questions about scores, recommendations, code patterns, etc.
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
