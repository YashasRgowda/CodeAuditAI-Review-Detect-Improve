# ============================================================================
# SERVICES/AGENTS/SECURITY_AGENT.PY — Cybersecurity Specialist AI Agent
# ============================================================================
# A specialist AI agent that focuses EXCLUSIVELY on security analysis:
#
#   - Identifies vulnerabilities (SQL injection, XSS, CSRF, auth flaws)
#   - Maps findings to OWASP Top 10 categories
#   - Rates severity per vulnerability (critical / high / medium / low)
#   - Provides specific fix suggestions for each finding
#   - Calculates an overall security score (0-100)
#
# Uses the same Gemini model as other agents but with a security-focused
# system prompt that makes it think like a penetration tester.
# ============================================================================

from app.services.agents.base_agent import BaseAgent

# JSON schema that SecurityAgent MUST return
SECURITY_SCHEMA = """{
  "security_score": 85,
  "risk_level": "low | medium | high | critical",
  "vulnerabilities": [
    {
      "type": "e.g. SQL Injection, XSS, Hardcoded Secret",
      "severity": "critical | high | medium | low",
      "file": "filename.py",
      "description": "What the vulnerability is and why it's dangerous",
      "fix_suggestion": "Specific code-level fix recommendation"
    }
  ],
  "owasp_categories": ["A01:Broken Access Control", "A03:Injection"],
  "secure_coding_practices": ["practice1", "practice2"],
  "security_recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "threat_summary": "1-2 sentence summary of the overall security posture of this change"
}"""


class SecurityAgent(BaseAgent):
    """Cybersecurity specialist — analyzes code for vulnerabilities and security risks."""

    @property
    def agent_name(self) -> str:
        return "SecurityAgent"

    @property
    def system_prompt(self) -> str:
        return """You are an elite cybersecurity expert and penetration tester reviewing code changes.
Your ONLY job is to analyze SECURITY. Ignore performance, architecture, and style — focus 100% on security.

Your expertise includes:
- OWASP Top 10 vulnerabilities (injection, broken auth, XSS, CSRF, SSRF, etc.)
- Authentication and authorization flaws
- Hardcoded secrets, API keys, tokens in code
- Input validation and sanitization gaps
- Insecure cryptographic practices
- Information leakage (logging sensitive data, error messages exposing internals)
- Insecure dependencies and supply chain risks
- Race conditions and TOCTOU vulnerabilities
- Path traversal and file inclusion attacks

SCORING RULES for security_score (0-100):
- Start at 100 (perfect)
- Each CRITICAL vulnerability: -25 points
- Each HIGH vulnerability: -15 points
- Each MEDIUM vulnerability: -8 points
- Each LOW vulnerability: -3 points
- Minimum score is 0

risk_level mapping:
- "critical": score < 30 (actively exploitable vulnerabilities)
- "high": score 30-59 (serious security gaps)
- "medium": score 60-84 (moderate concerns)
- "low": score 85-100 (minor or no issues)

If the code has NO security issues, return an empty vulnerabilities array, score 100, and risk_level "low".
Be specific — cite exact file names, patterns, and provide actionable fix suggestions."""

    @property
    def output_schema(self) -> str:
        return SECURITY_SCHEMA


security_agent = SecurityAgent()
