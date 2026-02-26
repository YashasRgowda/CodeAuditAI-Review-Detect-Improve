# ============================================================================
# AGENTS/BASE_AGENT.PY — Base Class for All Specialist AI Agents
# ============================================================================
# Provides the shared foundation that all specialist agents inherit from:
#
#   - Initializes the Gemini model with structured JSON output
#   - Defines the common interface: analyze(code_diff, context) → dict
#   - Handles error wrapping so individual agent failures don't crash the system
#   - Each subclass overrides: agent_name, system_prompt, output_schema
#
# The base agent enforces structured JSON output from Gemini, ensuring
# every specialist returns a predictable, parseable response.
# ============================================================================

import json
from abc import ABC, abstractmethod
from typing import Any

import google.generativeai as genai
from google.generativeai.types import GenerationConfig

from app.config import settings


class BaseAgent(ABC):
    """Abstract base class for all specialist AI agents.

    Each agent is a Gemini model instance with a specialized system prompt
    that makes it focus on one domain (security, performance, architecture).
    """

    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(
            'gemini-2.5-flash',
            generation_config=GenerationConfig(
                response_mime_type="application/json",
                temperature=0.2,  # Low temp = focused, consistent specialist output
            )
        )

    @property
    @abstractmethod
    def agent_name(self) -> str:
        """Human-readable name of this agent (e.g., 'SecurityAgent')."""

    @property
    @abstractmethod
    def system_prompt(self) -> str:
        """The system instruction that makes this agent a specialist."""

    @property
    @abstractmethod
    def output_schema(self) -> str:
        """JSON schema string that this agent MUST return."""

    def _build_prompt(self, code_context: str) -> str:
        """Combines the system prompt + code context + output schema into one prompt."""
        return f"""{self.system_prompt}

{code_context}

Return your analysis as JSON matching this EXACT schema:
{self.output_schema}

Return ONLY valid JSON. Be thorough, specific, and actionable."""

    async def analyze(self, code_context: str) -> dict[str, Any]:
        """Run this agent's analysis on the given code context.

        Args:
            code_context: Pre-formatted string containing code diffs,
                          file info, commit metadata, and static analysis results.

        Returns:
            Dict containing the agent's structured analysis result.
            On failure, returns a dict with agent_name, status='error', and error message.
        """
        try:
            prompt = self._build_prompt(code_context)
            response = self.model.generate_content(prompt)
            result = json.loads(response.text)

            # Tag the result with which agent produced it
            result["_agent"] = self.agent_name
            result["_status"] = "success"
            return result

        except json.JSONDecodeError as e:
            return {
                "_agent": self.agent_name,
                "_status": "error",
                "error": f"Agent returned invalid JSON: {str(e)}",
            }
        except Exception as e:
            return {
                "_agent": self.agent_name,
                "_status": "error",
                "error": f"Agent analysis failed: {str(e)}",
            }
