# ============================================================================
# AUTOFIX/AUTOFIX_SERVICE.PY — AI Code Fix Generator (Google Gemini)
# ============================================================================
# The engine behind auto-fix. When a user reviews their analysis report and
# says "fix issue #1 and #3", this service:
#
#   1. Takes the original code diff + the issues found by the analysis
#   2. Builds a specialized "fix generation" prompt for Gemini
#   3. Gemini returns ACTUAL corrected code (not just advice)
#   4. Returns before/after diffs with explanations and confidence scores
#
# Two modes:
#   - generate_fixes_for_commit(): Fix issues from a real analysis report
#   - generate_custom_fix(): Fix a user-provided code snippet + issue
#
# GenAI Features:
#   - Code Generation: AI writes actual code, not just descriptions
#   - Structured Output: Fixes returned as strict JSON
#   - Confidence Scoring: AI rates its own confidence (low/medium/high)
#   - Human-in-the-Loop: Nothing is auto-applied — user reviews all fixes
# ============================================================================

import json
from typing import Any

import google.generativeai as genai
from google.generativeai.types import GenerationConfig

from app.config import settings

# ---- JSON schema for fix generation (commit-based) ----
FIX_GENERATION_SCHEMA = """{
  "fixes": [
    {
      "issue_title": "Short title of the issue being fixed",
      "issue_type": "security | performance | architecture | quality",
      "severity": "low | medium | high",
      "file_name": "path/to/file.py",
      "original_code": "the exact original code that has the issue",
      "fixed_code": "the corrected version of the code",
      "explanation": "what was changed and why — be specific",
      "confidence": "low | medium | high"
    }
  ],
  "summary": "Brief overview of all fixes generated"
}"""

# ---- JSON schema for custom fix (ad-hoc) ----
CUSTOM_FIX_SCHEMA = """{
  "fixed_code": "the corrected version of the code",
  "explanation": "what was changed and why — detailed explanation",
  "confidence": "low | medium | high",
  "additional_suggestions": ["suggestion1", "suggestion2"]
}"""


class AutoFixService:
    """Generates AI-powered code fixes on demand using Google Gemini."""

    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)

        # JSON mode for structured fix output
        self.model = genai.GenerativeModel(
            "gemini-2.5-flash",
            generation_config=GenerationConfig(
                response_mime_type="application/json",
                temperature=0.2,  # Lower temp = more precise code generation
            ),
        )

    # ====================================================================
    # COMMIT-BASED FIX GENERATION — Fix issues from an analysis report
    # ====================================================================
    async def generate_fixes_for_commit(
        self,
        commit_data: dict[str, Any],
        analysis_result: dict[str, Any],
        issue_indices: list[int] | None = None,
    ) -> dict[str, Any]:
        """Generate code fixes for issues found in a commit analysis.

        Takes the original code diff + the analysis report (with issues),
        and generates actual corrected code for each issue.

        Args:
            commit_data: The raw commit data from GitHub (files, patches, etc.)
            analysis_result: The analysis report (recommendations, concerns, etc.)
            issue_indices: Which issues to fix (by index). None = fix all.

        Returns:
            Dict with fixes list, each containing original/fixed code + explanation.
        """
        # Collect all issues from the analysis report
        all_issues = self._extract_issues_from_analysis(analysis_result)

        if not all_issues:
            return {
                "commit_hash": commit_data.get("sha", ""),
                "total_issues_found": 0,
                "total_fixes_generated": 0,
                "fixes": [],
                "summary": "No fixable issues found in the analysis report.",
            }

        # Filter to requested issues (or keep all)
        if issue_indices:
            selected_issues = [
                all_issues[i] for i in issue_indices if i < len(all_issues)
            ]
        else:
            selected_issues = all_issues

        if not selected_issues:
            return {
                "commit_hash": commit_data.get("sha", ""),
                "total_issues_found": len(all_issues),
                "total_fixes_generated": 0,
                "fixes": [],
                "summary": "No valid issue indices provided.",
            }

        # Build the fix generation prompt
        prompt = self._build_fix_prompt(commit_data, selected_issues)

        # Get fixes from Gemini
        try:
            response = self.model.generate_content(prompt)
            fix_result = json.loads(response.text)
        except json.JSONDecodeError:
            return {
                "commit_hash": commit_data.get("sha", ""),
                "total_issues_found": len(all_issues),
                "total_fixes_generated": 0,
                "fixes": [],
                "summary": "AI returned invalid response. Please try again.",
            }
        except Exception as e:
            return {
                "commit_hash": commit_data.get("sha", ""),
                "total_issues_found": len(all_issues),
                "total_fixes_generated": 0,
                "fixes": [],
                "summary": f"Fix generation failed: {str(e)}",
            }

        fixes = fix_result.get("fixes", [])

        return {
            "commit_hash": commit_data.get("sha", ""),
            "total_issues_found": len(all_issues),
            "total_fixes_generated": len(fixes),
            "fixes": fixes,
            "summary": fix_result.get("summary", f"Generated {len(fixes)} fix(es)."),
        }

    # ====================================================================
    # CUSTOM FIX — Fix a user-provided code snippet + issue
    # ====================================================================
    async def generate_custom_fix(
        self,
        code_snippet: str,
        language: str,
        issue_description: str,
        file_name: str = "untitled",
    ) -> dict[str, Any]:
        """Generate a fix for a user-provided code snippet.

        The user pastes their code, describes what's wrong, and
        the AI generates the corrected version.

        Args:
            code_snippet: The raw code that has the issue.
            language: Programming language (python, javascript, etc.)
            issue_description: What the user wants fixed.
            file_name: Optional file name for context.

        Returns:
            Dict with fixed_code, explanation, confidence, and suggestions.
        """
        prompt = self._build_custom_fix_prompt(
            code_snippet, language, issue_description, file_name
        )

        try:
            response = self.model.generate_content(prompt)
            fix_result = json.loads(response.text)
        except json.JSONDecodeError:
            return {
                "file_name": file_name,
                "language": language,
                "original_code": code_snippet,
                "fixed_code": "",
                "explanation": "AI returned invalid response. Please try again.",
                "confidence": "low",
                "additional_suggestions": [],
            }
        except Exception as e:
            return {
                "file_name": file_name,
                "language": language,
                "original_code": code_snippet,
                "fixed_code": "",
                "explanation": f"Fix generation failed: {str(e)}",
                "confidence": "low",
                "additional_suggestions": [],
            }

        return {
            "file_name": file_name,
            "language": language,
            "original_code": code_snippet,
            "fixed_code": fix_result.get("fixed_code", ""),
            "explanation": fix_result.get("explanation", ""),
            "confidence": fix_result.get("confidence", "medium"),
            "additional_suggestions": fix_result.get("additional_suggestions", []),
        }

    # ====================================================================
    # ISSUE EXTRACTION — Pull fixable issues from analysis report
    # ====================================================================
    def _extract_issues_from_analysis(
        self, analysis_result: dict[str, Any]
    ) -> list[dict[str, str]]:
        """Extract all fixable issues from an analysis report.

        Combines recommendations, security concerns, and agent reports
        into a flat list of issues that the AI can attempt to fix.
        """
        issues: list[dict[str, str]] = []

        # Extract from recommendations
        for rec in analysis_result.get("recommendations", []):
            if isinstance(rec, str):
                issues.append({
                    "title": rec[:80],
                    "description": rec,
                    "type": "quality",
                    "severity": "medium",
                })
            elif isinstance(rec, dict):
                issues.append({
                    "title": rec.get("title", rec.get("description", "")[:80]),
                    "description": rec.get("description", str(rec)),
                    "type": rec.get("type", "quality"),
                    "severity": rec.get("severity", "medium"),
                })

        # Extract from security concerns
        for concern in analysis_result.get("security_concerns", []):
            if isinstance(concern, str):
                issues.append({
                    "title": concern[:80],
                    "description": concern,
                    "type": "security",
                    "severity": "high",
                })
            elif isinstance(concern, dict):
                issues.append({
                    "title": concern.get("title", concern.get("description", "")[:80]),
                    "description": concern.get("description", str(concern)),
                    "type": "security",
                    "severity": concern.get("severity", "high"),
                })

        # Extract from multi-agent reports (if present)
        agent_reports = analysis_result.get("agent_reports", {})

        # Security agent vulnerabilities
        sec_report = agent_reports.get("security", {})
        for vuln in sec_report.get("vulnerabilities", []):
            if isinstance(vuln, dict):
                issues.append({
                    "title": vuln.get("type", "Security vulnerability"),
                    "description": vuln.get("description", str(vuln)),
                    "type": "security",
                    "severity": vuln.get("severity", "high"),
                    "file": vuln.get("file", ""),
                })

        # Performance agent issues
        perf_report = agent_reports.get("performance", {})
        for perf_issue in perf_report.get("issues", []):
            if isinstance(perf_issue, dict):
                issues.append({
                    "title": perf_issue.get("type", "Performance issue"),
                    "description": perf_issue.get("description", str(perf_issue)),
                    "type": "performance",
                    "severity": perf_issue.get("severity", "medium"),
                    "file": perf_issue.get("file", ""),
                })

        # Architecture agent anti-patterns
        arch_report = agent_reports.get("architecture", {})
        for anti in arch_report.get("anti_patterns_found", []):
            if isinstance(anti, dict):
                issues.append({
                    "title": anti.get("pattern", "Anti-pattern detected"),
                    "description": anti.get("description", str(anti)),
                    "type": "architecture",
                    "severity": "medium",
                    "file": anti.get("file", ""),
                })

        return issues

    # ====================================================================
    # PROMPT BUILDERS
    # ====================================================================
    def _build_fix_prompt(
        self,
        commit_data: dict[str, Any],
        issues: list[dict[str, str]],
    ) -> str:
        """Build the prompt for generating code fixes from an analysis report."""

        # Collect all code diffs from the commit
        code_diffs = []
        for file in commit_data.get("files", []):
            if file.get("patch"):
                code_diffs.append(
                    f"--- File: {file['filename']} ---\n{file['patch'][:1500]}"
                )

        code_context = "\n\n".join(code_diffs) if code_diffs else "No code diff available."

        # Format issues list
        issues_text = ""
        for i, issue in enumerate(issues):
            issues_text += (
                f"\nIssue #{i + 1}:\n"
                f"  Title: {issue['title']}\n"
                f"  Type: {issue['type']}\n"
                f"  Severity: {issue['severity']}\n"
                f"  Description: {issue['description']}\n"
            )
            if issue.get("file"):
                issues_text += f"  File: {issue['file']}\n"

        return f"""You are an expert code fixer. You are given code changes from a commit and a list
of issues found during code review. Your job is to generate ACTUAL FIXED CODE for each issue.

COMMIT: {commit_data.get('sha', 'unknown')[:12]} by {commit_data.get('author', 'unknown')}
MESSAGE: {commit_data.get('message', 'No message')}

CODE CHANGES:
{code_context}

ISSUES TO FIX:
{issues_text}

RULES FOR GENERATING FIXES:
1. For each issue, provide the EXACT original code that has the problem
2. Provide the CORRECTED version of that code
3. Explain specifically what you changed and why
4. Rate your confidence: "high" if it's a clear fix, "medium" if reasonable but
   needs review, "low" if it's a suggestion that may need adjustment
5. Keep fixes minimal — change only what's necessary to fix the issue
6. Preserve the original code style and formatting
7. If an issue is about removing code (e.g., remove console.log), show the
   code before and after removal
8. If an issue requires adding code (e.g., add error handling), show the
   expanded version with the addition
9. Generate a fix for EVERY issue listed above

Return your response as JSON matching this EXACT schema:
{FIX_GENERATION_SCHEMA}

Return ONLY valid JSON. No markdown, no explanation outside the JSON."""

    def _build_custom_fix_prompt(
        self,
        code_snippet: str,
        language: str,
        issue_description: str,
        file_name: str,
    ) -> str:
        """Build the prompt for fixing a user-provided code snippet."""

        return f"""You are an expert code fixer. A developer has given you their code and described
an issue. Generate the FIXED version of their code.

FILE: {file_name}
LANGUAGE: {language}

ORIGINAL CODE:
```{language}
{code_snippet}
```

ISSUE DESCRIBED BY DEVELOPER:
{issue_description}

RULES:
1. Fix ONLY the described issue — don't change unrelated code
2. Preserve the original code style, indentation, and formatting
3. Explain exactly what you changed and why
4. Rate your confidence: "high" if it's a clear fix, "medium" if reasonable,
   "low" if the fix might need adjustment
5. Provide 1-3 additional suggestions for improving the code further
   (these are optional extras, not part of the main fix)

Return your response as JSON matching this EXACT schema:
{CUSTOM_FIX_SCHEMA}

Return ONLY valid JSON. No markdown, no explanation outside the JSON."""


# Create global instance
autofix_service = AutoFixService()
