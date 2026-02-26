# ============================================================================
# ANALYSIS/CHAT_SERVICE.PY — Multi-Turn Conversational AI Review Engine
# ============================================================================
# Enables interactive, multi-turn conversations about code analysis results.
#
# HOW IT WORKS:
#   1. User starts a chat session → linked to a specific analysis result
#   2. The analysis context (code diff, scores, recommendations) is loaded
#      and used as a system prompt so the AI "knows" the review
#   3. User sends follow-up questions → AI answers with full context
#   4. Chat history is stored in Redis (auto-expires after 2 hours)
#   5. Gemini's chat API maintains conversation coherence
#
# GenAI Features:
#   - Multi-turn conversation with Gemini (not just single prompts)
#   - Context-aware: AI remembers the full analysis + all prior messages
#   - Redis-backed session storage for fast access + auto-cleanup
#
# Key methods:
#   - start_session()    → Create a new chat session with analysis context
#   - send_message()     → Send a follow-up question, get AI response
#   - get_history()      → Retrieve full conversation history
#   - _build_system_context() → Build initial context from analysis data
# ============================================================================

import json
import uuid

import google.generativeai as genai
from google.generativeai.types import GenerationConfig

from app.config import settings
from app.redis_client import redis_client

# Session expiration time (2 hours)
SESSION_TTL = 7200


class ChatService:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(
            'gemini-2.5-flash',
            generation_config=GenerationConfig(
                temperature=0.4,  # Slightly more creative for conversations
            )
        )

    # ====================================================================
    # START SESSION — Create a new chat with analysis context
    # ====================================================================
    def start_session(self, analysis_data: dict) -> str:
        """Create a new chat session and store context in Redis.

        Args:
            analysis_data: The full analysis result (from DB or raw)

        Returns:
            session_id: Unique session identifier
        """
        session_id = f"chat:{uuid.uuid4().hex[:16]}"

        # Build the system context from the analysis
        system_context = self._build_system_context(analysis_data)

        # Store session data in Redis
        session_data = {
            "context": system_context,
            "summary": analysis_data.get("summary", "Code analysis"),
            "history": []  # Will hold list of {"role": ..., "content": ...}
        }

        redis_client.setex(
            session_id,
            SESSION_TTL,
            json.dumps(session_data)
        )

        return session_id

    # ====================================================================
    # SEND MESSAGE — Ask a follow-up question
    # ====================================================================
    async def send_message(self, session_id: str, user_message: str) -> dict:
        """Send a follow-up question and get AI response.

        Args:
            session_id: The chat session ID
            user_message: The user's follow-up question

        Returns:
            dict with 'reply' and 'history'

        Raises:
            ValueError: If session not found or expired
        """
        # Load session from Redis
        session_raw = redis_client.get(session_id)
        if not session_raw:
            raise ValueError("Chat session not found or expired. Start a new session.")

        session_data = json.loads(session_raw)
        context = session_data["context"]
        history = session_data["history"]

        # Build Gemini chat history from our stored history
        gemini_history = []
        for msg in history:
            gemini_history.append({
                "role": msg["role"],
                "parts": [msg["content"]]
            })

        # Start a Gemini chat with the existing history
        # First message in history is always the context + first user question
        chat = self.model.start_chat(history=gemini_history)

        # Build the prompt: include context on first message, just question on follow-ups
        if not history:
            # First message in the session — include full context
            full_prompt = f"""{context}

USER QUESTION:
{user_message}

Respond helpfully and specifically. Reference the actual code, scores, and findings from the analysis above. Be concise but thorough."""
        else:
            # Follow-up message — context is already in chat history
            full_prompt = user_message

        # Send to Gemini and get response
        try:
            response = chat.send_message(full_prompt)
            ai_reply = response.text
        except Exception as e:
            ai_reply = f"I encountered an error processing your question: {str(e)}"

        # Update history with the new exchange
        if not history:
            # Store the full context prompt as the first user message
            history.append({"role": "user", "content": full_prompt})
        else:
            history.append({"role": "user", "content": user_message})

        history.append({"role": "model", "content": ai_reply})

        # Save updated history back to Redis (refresh TTL)
        session_data["history"] = history
        redis_client.setex(
            session_id,
            SESSION_TTL,
            json.dumps(session_data)
        )

        # Build clean history for the response (hide internal context prompt)
        clean_history = []
        for i, msg in enumerate(history):
            role = "assistant" if msg["role"] == "model" else "user"
            content = msg["content"]

            # For the first user message, show only their question (not full context)
            if i == 0 and role == "user":
                content = user_message if len(history) == 2 else self._extract_user_question(content)

            clean_history.append({"role": role, "content": content})

        return {
            "reply": ai_reply,
            "history": clean_history
        }

    # ====================================================================
    # GET HISTORY — Retrieve conversation history
    # ====================================================================
    def get_history(self, session_id: str) -> dict:
        """Get the full conversation history for a session.

        Args:
            session_id: The chat session ID

        Returns:
            dict with 'messages' and 'analysis_summary'

        Raises:
            ValueError: If session not found or expired
        """
        session_raw = redis_client.get(session_id)
        if not session_raw:
            raise ValueError("Chat session not found or expired.")

        session_data = json.loads(session_raw)
        history = session_data["history"]
        summary = session_data.get("summary", "Code analysis")

        # Build clean message list
        messages = []
        for i, msg in enumerate(history):
            role = "assistant" if msg["role"] == "model" else "user"
            content = msg["content"]

            # Hide internal context from first message
            if i == 0 and role == "user":
                content = self._extract_user_question(content)

            messages.append({"role": role, "content": content})

        return {
            "messages": messages,
            "analysis_summary": summary
        }

    # ====================================================================
    # INTERNAL HELPERS
    # ====================================================================
    def _build_system_context(self, analysis_data: dict) -> str:
        """Build the initial context prompt from analysis data.

        This tells the AI everything about the analysis so it can
        answer follow-up questions accurately.
        """
        summary = analysis_data.get("summary", "No summary available")
        risk_level = analysis_data.get("risk_level", "unknown")
        change_type = analysis_data.get("change_type", "unknown")
        recommendations = analysis_data.get("recommendations", [])
        security_concerns = analysis_data.get("security_concerns", [])
        impact_areas = analysis_data.get("impact_areas", [])

        # Scores
        maintainability = analysis_data.get("maintainability_score", "N/A")
        security = analysis_data.get("security_score", "N/A")
        performance = analysis_data.get("performance_score", "N/A")
        overall = analysis_data.get("overall_score", "N/A")

        # Code details
        files_changed = analysis_data.get("files_changed", 0)
        lines_added = analysis_data.get("lines_added", 0)
        lines_removed = analysis_data.get("lines_removed", 0)
        commit_hash = analysis_data.get("commit_hash", "N/A")
        commit_message = analysis_data.get("commit_message", "N/A")
        author = analysis_data.get("author", "N/A")

        # Full AI analysis (if available)
        full_analysis = analysis_data.get("full_analysis", "")
        code_quality = analysis_data.get("code_quality_assessment", "")

        # Static analysis details
        ast_info = analysis_data.get("ast_analysis", {})
        security_scan = analysis_data.get("security_analysis", {})
        perf_analysis = analysis_data.get("performance_analysis", {})
        dep_analysis = analysis_data.get("dependency_analysis", {})

        return f"""You are CodeAuditAI, an expert code review assistant. You just completed an analysis of a code change. The user will now ask you follow-up questions about this analysis. Answer based on the analysis data below.

=== ANALYSIS CONTEXT ===

COMMIT: {commit_hash}
MESSAGE: {commit_message}
AUTHOR: {author}
STATS: {files_changed} files changed, +{lines_added} -{lines_removed}

SUMMARY: {summary}

RISK LEVEL: {risk_level}
CHANGE TYPE: {change_type}

SCORES:
- Maintainability: {maintainability}/100
- Security: {security}/100
- Performance: {performance}/100
- Overall: {overall}/10

RECOMMENDATIONS:
{chr(10).join(f'  - {r}' for r in recommendations) if recommendations else '  (none)'}

SECURITY CONCERNS:
{chr(10).join(f'  - {c}' for c in security_concerns) if security_concerns else '  (none)'}

IMPACT AREAS: {', '.join(impact_areas) if impact_areas else 'N/A'}

CODE QUALITY: {code_quality}

FULL AI ANALYSIS:
{full_analysis[:2000] if full_analysis else 'N/A'}

STATIC ANALYSIS DATA:
- AST: {json.dumps(ast_info, indent=2)[:500] if ast_info else 'N/A'}
- Security Scan: {json.dumps(security_scan, indent=2)[:500] if security_scan else 'N/A'}
- Performance: {json.dumps(perf_analysis, indent=2)[:500] if perf_analysis else 'N/A'}
- Dependencies: {json.dumps(dep_analysis, indent=2)[:500] if dep_analysis else 'N/A'}

=== END OF CONTEXT ===

RULES:
- Answer the user's questions specifically about THIS analysis
- Reference actual scores, code patterns, and findings
- If asked to explain a score, reference the specific issues found
- If asked for fixes, provide concrete code examples
- Be conversational but technical
- Keep responses focused and concise"""

    def _extract_user_question(self, full_prompt: str) -> str:
        """Extract just the user's question from the full context prompt."""
        marker = "USER QUESTION:"
        if marker in full_prompt:
            question_part = full_prompt.split(marker)[1]
            # Remove the instruction suffix
            end_marker = "Respond helpfully"
            if end_marker in question_part:
                question_part = question_part.split(end_marker)[0]
            return question_part.strip()
        return full_prompt


# Create global instance
chat_service = ChatService()
