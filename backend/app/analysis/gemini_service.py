# ============================================================================
# ANALYSIS/GEMINI_SERVICE.PY — Core AI Analysis Engine (Google Gemini)
# ============================================================================
# THE HEART OF THE AI SYSTEM. Orchestrates the full analysis pipeline:
#   1. Takes code diff (commit or PR changes)
#   2. Runs static analysis tools (AST, security, dependency, performance)
#   3. Retrieves relevant past analyses via RAG (AI memory)
#   4. Builds a detailed prompt combining code + static analysis + RAG context
#   5. Sends the prompt to Google Gemini 2.5 Flash AI
#   6. Receives STRUCTURED JSON response (no fragile text parsing!)
#   7. Auto-stores the result in RAG knowledge base for future reference
#
# GenAI Features:
#   - Structured Output: Gemini returns strict JSON via response_mime_type
#   - Streaming: Real-time SSE streaming of analysis progress
#   - RAG: Past analysis retrieval for trend detection and pattern matching
#   - Multi-tool Pipeline: AST + Security + Dependency + Performance + AI
#
# Key methods:
#   - analyze_code_changes()     → Full AI commit analysis (JSON output)
#   - analyze_pull_request()     → Full AI PR analysis (JSON output)
#   - stream_analysis()          → Streaming commit analysis with SSE events
#   - stream_pr_analysis()       → Streaming PR analysis with SSE events
# ============================================================================

import json
from collections.abc import AsyncGenerator
from typing import Any

import google.generativeai as genai
from fastapi import HTTPException
from google.generativeai.types import GenerationConfig

from app.analysis.ast_parser import ast_parser
from app.analysis.dependency_analyzer import dependency_analyzer
from app.analysis.performance_analyzer import performance_analyzer
from app.analysis.security_scanner import security_scanner
from app.config import settings

# ---- JSON Schema that Gemini MUST return for commit analysis ----
COMMIT_ANALYSIS_SCHEMA = """{
  "summary": "2-3 sentence overview of what this commit does",
  "risk_level": "low | medium | high",
  "change_type": "feature | bug_fix | refactoring | documentation | configuration | other",
  "impact_areas": ["area1", "area2"],
  "code_quality_assessment": "detailed assessment of code quality",
  "security_concerns": ["concern1", "concern2"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "maintainability_score": 85,
  "security_score": 90,
  "performance_score": 80,
  "overall_score": 8
}"""

# ---- JSON Schema that Gemini MUST return for PR analysis ----
PR_ANALYSIS_SCHEMA = """{
  "summary": "2-3 sentence overview of what this PR accomplishes",
  "risk_level": "low | medium | high",
  "change_type": "feature | bug_fix | refactoring | documentation | security | performance | other",
  "impact_areas": ["component1", "component2"],
  "code_quality_assessment": "detailed assessment of code structure and patterns",
  "security_concerns": ["concern1", "concern2"],
  "performance_impact": "assessment of performance effects",
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "maintainability_score": 85,
  "security_score": 90,
  "performance_score": 80,
  "overall_score": 8
}"""


class GeminiService:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)

        # Standard model — returns structured JSON
        self.model = genai.GenerativeModel(
            'gemini-2.5-flash',
            generation_config=GenerationConfig(
                response_mime_type="application/json",
                temperature=0.3,  # Lower = more consistent/deterministic
            )
        )

        # Streaming model — returns plain text for real-time streaming
        self.stream_model = genai.GenerativeModel(
            'gemini-2.5-flash',
            generation_config=GenerationConfig(
                temperature=0.3,
            )
        )

    # ====================================================================
    # STATIC ANALYSIS PIPELINE — Runs all local analyzers on code
    # ====================================================================
    def _run_static_analysis(self, commit_data: dict[str, Any]) -> dict[str, Any]:
        """Run all static analysis tools on the code files"""
        ast_analyses = []
        files_for_analysis = []

        for file in commit_data.get('files', []):
            if file.get('patch'):
                filename = file['filename']
                patch_content = file['patch']

                # AST analysis with advanced metrics
                ast_analysis = ast_parser.calculate_advanced_metrics(patch_content, filename)
                ast_analyses.append(ast_analysis)

                files_for_analysis.append({'filename': filename, 'content': patch_content})

        # Run all analyzers
        dependency_analysis = dependency_analyzer.analyze_dependencies(files_for_analysis)
        security_analysis = security_scanner.scan_multiple_files(files_for_analysis)
        performance_analysis = performance_analyzer.analyze_performance(files_for_analysis)

        return {
            "ast_analyses": ast_analyses,
            "dependency_analysis": dependency_analysis,
            "security_analysis": security_analysis,
            "performance_analysis": performance_analysis,
        }

    # ====================================================================
    # COMMIT ANALYSIS — Full AI analysis with structured JSON output + RAG
    # ====================================================================
    async def analyze_code_changes(self, commit_data: dict[str, Any]) -> dict[str, Any]:
        """Analyze code changes using Gemini AI — returns structured JSON.

        Pipeline: Static Analysis → RAG Retrieval → AI Analysis → Store in RAG
        """
        try:
            # Step 1: Run static analysis pipeline
            static_results = self._run_static_analysis(commit_data)

            # Step 2: Retrieve relevant past analyses from RAG (AI memory)
            rag_context = self._get_rag_context(commit_data)

            # Step 3: Build prompt with static analysis + RAG context
            prompt = self._build_commit_prompt(commit_data, static_results, rag_context)

            # Step 4: Get structured JSON response from Gemini
            response = self.model.generate_content(prompt)
            ai_result = json.loads(response.text)

            # Step 5: Merge AI results with static analysis data + commit metadata
            final_result = self._build_commit_result(ai_result, commit_data, static_results)

            # Step 6: Auto-store this analysis in RAG for future reference
            self._store_in_rag(final_result)

            return final_result

        except json.JSONDecodeError as e:
            raise HTTPException(status_code=500, detail=f"AI returned invalid JSON: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

    # ====================================================================
    # PR ANALYSIS — Full AI analysis with structured JSON output + RAG
    # ====================================================================
    async def analyze_pull_request(self, pr_data: dict[str, Any]) -> dict[str, Any]:
        """Analyze pull request changes using Gemini AI — returns structured JSON.

        Pipeline: RAG Retrieval → AI Analysis → Store in RAG
        """
        try:
            # Step 1: Retrieve relevant past analyses from RAG
            rag_context = self._get_rag_context_for_pr(pr_data)

            # Step 2: Build PR prompt with RAG context
            prompt = self._build_pr_prompt(pr_data, rag_context)

            # Step 3: Get structured JSON response from Gemini
            response = self.model.generate_content(prompt)
            ai_result = json.loads(response.text)

            # Step 4: Build final result with PR metadata
            final_result = self._build_pr_result(ai_result, pr_data)

            # Step 5: Auto-store this analysis in RAG for future reference
            self._store_in_rag(final_result)

            return final_result

        except json.JSONDecodeError as e:
            raise HTTPException(status_code=500, detail=f"AI returned invalid JSON: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"PR AI analysis failed: {str(e)}")

    # ====================================================================
    # STREAMING COMMIT ANALYSIS — Real-time SSE events + RAG
    # ====================================================================
    async def stream_analysis(self, commit_data: dict[str, Any]) -> AsyncGenerator[dict[str, Any]]:
        """Stream analysis progress as SSE events — yields dict events"""

        # Event 1: Starting
        yield {"event": "progress", "data": {"step": "fetch", "message": "Fetching code changes...", "progress": 10}}

        # Event 2: AST analysis
        yield {"event": "progress", "data": {"step": "ast", "message": "Parsing code structure (AST analysis)...", "progress": 20}}
        ast_analyses = []
        files_for_analysis = []
        for file in commit_data.get('files', []):
            if file.get('patch'):
                filename = file['filename']
                patch_content = file['patch']
                ast_analysis = ast_parser.calculate_advanced_metrics(patch_content, filename)
                ast_analyses.append(ast_analysis)
                files_for_analysis.append({'filename': filename, 'content': patch_content})

        # Event 3: Security scan
        yield {"event": "progress", "data": {"step": "security", "message": "Running security vulnerability scan...", "progress": 35}}
        security_analysis = security_scanner.scan_multiple_files(files_for_analysis)

        # Event 4: Dependency analysis
        yield {"event": "progress", "data": {"step": "dependency", "message": "Analyzing cross-file dependencies...", "progress": 45}}
        dependency_analysis = dependency_analyzer.analyze_dependencies(files_for_analysis)

        # Event 5: Performance analysis
        yield {"event": "progress", "data": {"step": "performance", "message": "Detecting performance anti-patterns...", "progress": 55}}
        performance_analysis = performance_analyzer.analyze_performance(files_for_analysis)

        static_results = {
            "ast_analyses": ast_analyses,
            "dependency_analysis": dependency_analysis,
            "security_analysis": security_analysis,
            "performance_analysis": performance_analysis,
        }

        # Event 6: RAG retrieval (searching AI memory)
        yield {"event": "progress", "data": {"step": "rag", "message": "Searching past analyses for patterns...", "progress": 65}}
        rag_context = self._get_rag_context(commit_data)

        # Event 7: AI analysis (the big one)
        yield {"event": "progress", "data": {"step": "ai", "message": "Gemini AI is analyzing your code (with historical context)...", "progress": 75}}

        try:
            prompt = self._build_commit_prompt(commit_data, static_results, rag_context)
            response = self.model.generate_content(prompt)
            ai_result = json.loads(response.text)

            # Event 8: Building result
            yield {"event": "progress", "data": {"step": "building", "message": "Building analysis report...", "progress": 90}}

            final_result = self._build_commit_result(ai_result, commit_data, static_results)

            # Auto-store in RAG for future reference
            self._store_in_rag(final_result)

            # Event 9: Complete — send final result
            yield {"event": "complete", "data": {"result": final_result, "progress": 100, "message": "Analysis complete!"}}

        except Exception as e:
            yield {"event": "error", "data": {"message": f"AI analysis failed: {str(e)}", "progress": 0}}

    # ====================================================================
    # STREAMING PR ANALYSIS — Real-time SSE events + RAG
    # ====================================================================
    async def stream_pr_analysis(self, pr_data: dict[str, Any]) -> AsyncGenerator[dict[str, Any]]:
        """Stream PR analysis progress as SSE events"""

        yield {"event": "progress", "data": {"step": "fetch", "message": "Fetching PR changes...", "progress": 15}}

        # RAG retrieval for PR
        yield {"event": "progress", "data": {"step": "rag", "message": "Searching past analyses for patterns...", "progress": 35}}
        rag_context = self._get_rag_context_for_pr(pr_data)

        yield {"event": "progress", "data": {"step": "ai", "message": "Gemini AI is reviewing your pull request (with historical context)...", "progress": 55}}

        try:
            prompt = self._build_pr_prompt(pr_data, rag_context)
            response = self.model.generate_content(prompt)
            ai_result = json.loads(response.text)

            yield {"event": "progress", "data": {"step": "building", "message": "Building PR review report...", "progress": 85}}

            final_result = self._build_pr_result(ai_result, pr_data)

            # Auto-store in RAG
            self._store_in_rag(final_result)

            yield {"event": "complete", "data": {"result": final_result, "progress": 100, "message": "PR analysis complete!"}}

        except Exception as e:
            yield {"event": "error", "data": {"message": f"PR analysis failed: {str(e)}", "progress": 0}}

    # ====================================================================
    # PROMPT BUILDERS
    # ====================================================================
    def _build_commit_prompt(self, commit_data: dict[str, Any], static_results: dict[str, Any], rag_context: str = "") -> str:
        """Build prompt for commit analysis with static analysis + RAG context"""
        ast_analyses = static_results["ast_analyses"]

        # Build file summaries with AST insights
        files_info = []
        for i, file in enumerate(commit_data.get('files', [])):
            file_summary = f"File: {file['filename']} | Status: {file['status']} | +{file['additions']} -{file['deletions']}"

            if i < len(ast_analyses) and not ast_analyses[i].get('error'):
                ast = ast_analyses[i]
                file_summary += f"\n  Structure: {ast.get('functions', 0)} functions, {ast.get('classes', 0)} classes, complexity={ast.get('complexity_score', 0)}"
                if ast.get('security_patterns'):
                    file_summary += f"\n  Security flags: {', '.join(ast['security_patterns'])}"
                if ast.get('code_quality_issues'):
                    file_summary += f"\n  Quality issues: {', '.join(ast['code_quality_issues'])}"

            if file.get('patch'):
                file_summary += f"\n  Diff:\n{file['patch'][:800]}"

            files_info.append(file_summary)

        # Security summary
        sec = static_results["security_analysis"]
        sec_summary = f"Security scan: {sec.get('total_findings', 0)} findings, risk score {sec.get('overall_risk_score', 0)}/100"

        # Performance summary
        perf = static_results["performance_analysis"]
        perf_summary = f"Performance scan: {perf.get('total_issues', 0)} issues, score {perf.get('performance_score', 100)}/100"

        # Dependency summary
        dep = static_results["dependency_analysis"]
        dep_summary = f"Dependencies: complexity {dep.get('complexity_score', 0)}/100, {len(dep.get('dependency_risks', []))} risks"

        # RAG section (only included if past analyses exist)
        rag_section = ""
        if rag_context:
            rag_section = f"""
{rag_context}
IMPORTANT: Use the past analysis history above to:
- Identify recurring issues (e.g., "this is the Nth time this pattern was flagged")
- Track trends (e.g., "maintainability has improved/degraded over recent commits")
- Reference specific past commits if the same file or pattern was reviewed before
"""

        return f"""You are an expert code reviewer. Analyze these code changes and return a JSON response.

COMMIT: {commit_data['sha'][:12]} by {commit_data['author']}
MESSAGE: {commit_data['message']}
STATS: {commit_data['stats']['total']} changes (+{commit_data['stats']['additions']} -{commit_data['stats']['deletions']})

STATIC ANALYSIS RESULTS:
{sec_summary}
{perf_summary}
{dep_summary}

FILES CHANGED:
{chr(10).join(files_info)}
{rag_section}
Return your analysis as JSON matching this EXACT schema:
{COMMIT_ANALYSIS_SCHEMA}

SCORING RULES:
- maintainability_score: 0-100 (100=excellent, consider complexity, readability, modularity)
- security_score: 0-100 (100=no issues, deduct for each security concern found)
- performance_score: 0-100 (100=optimal, deduct for anti-patterns)
- overall_score: 1-10 (holistic quality rating)
- risk_level: "low" for safe changes, "medium" for moderate risk, "high" for dangerous changes
- recommendations: provide 3-5 specific, actionable suggestions

Be thorough, technical, and precise. Return ONLY valid JSON."""

    def _build_pr_prompt(self, pr_data: dict[str, Any], rag_context: str = "") -> str:
        """Build prompt for PR analysis with optional RAG context"""

        files_info = []
        for file in pr_data.get('files', [])[:20]:
            file_summary = f"File: {file['filename']} | Status: {file['status']} | +{file['additions']} -{file['deletions']}"
            if file.get('patch') and len(file['patch']) < 1000:
                file_summary += f"\n  Diff:\n{file['patch'][:600]}"
            files_info.append(file_summary)

        # RAG section (only included if past analyses exist)
        rag_section = ""
        if rag_context:
            rag_section = f"""
{rag_context}
IMPORTANT: Use the past analysis history above to identify recurring patterns and trends.
"""

        return f"""You are a senior software architect reviewing a pull request. Return a JSON response.

PR #{pr_data['pr_number']}: {pr_data['title']}
Author: {pr_data['author']}
Branches: {pr_data['head_branch']} → {pr_data['base_branch']}
Stats: {pr_data['stats']['total_files']} files, +{pr_data['stats']['additions']} -{pr_data['stats']['deletions']}

Description:
{pr_data.get('description', 'No description')[:500]}

FILES CHANGED:
{chr(10).join(files_info)}
{rag_section}
Return your analysis as JSON matching this EXACT schema:
{PR_ANALYSIS_SCHEMA}

SCORING RULES:
- maintainability_score: 0-100 (100=excellent)
- security_score: 0-100 (100=no issues)
- performance_score: 0-100 (100=optimal)
- overall_score: 1-10 (holistic quality rating)
- risk_level: "low" | "medium" | "high"
- recommendations: provide 3-5 specific, actionable suggestions
- security_concerns: list actual security issues found (empty list if none)
- impact_areas: list the main system components affected

Be thorough, technical, and precise. Return ONLY valid JSON."""

    # ====================================================================
    # RESULT BUILDERS — Merge AI output with metadata
    # ====================================================================
    def _build_commit_result(self, ai_result: dict[str, Any], commit_data: dict[str, Any], static_results: dict[str, Any]) -> dict[str, Any]:
        """Merge AI structured output with commit metadata and static analysis"""
        ast_analyses = static_results["ast_analyses"]

        return {
            # AI-generated fields (structured JSON — no more text parsing!)
            "summary": ai_result.get("summary", "Analysis completed"),
            "full_analysis": json.dumps(ai_result, indent=2),
            "risk_level": ai_result.get("risk_level", "medium"),
            "change_type": ai_result.get("change_type", "other"),
            "recommendations": ai_result.get("recommendations", []),
            "code_quality_assessment": ai_result.get("code_quality_assessment", ""),
            "security_concerns": ai_result.get("security_concerns", []),
            "impact_areas": ai_result.get("impact_areas", []),
            "maintainability_score": ai_result.get("maintainability_score", 70),
            "security_score": ai_result.get("security_score", 100),
            "performance_score": ai_result.get("performance_score", 100),
            "overall_score": ai_result.get("overall_score", 7),

            # Commit metadata
            "files_changed": len(commit_data.get('files', [])),
            "lines_added": commit_data['stats']['additions'],
            "lines_removed": commit_data['stats']['deletions'],
            "commit_hash": commit_data['sha'],
            "commit_message": commit_data['message'],
            "author": commit_data['author'],
            "analysis_date": commit_data['date'],

            # Static analysis data (from our local analyzers)
            "ast_analysis": {
                "files_analyzed": len(ast_analyses),
                "total_functions": sum(a.get('functions', 0) for a in ast_analyses),
                "total_classes": sum(a.get('classes', 0) for a in ast_analyses),
                "complexity_summary": ast_analyses,
                "security_patterns_found": [p for a in ast_analyses for p in a.get('security_patterns', [])]
            },
            "dependency_analysis": static_results["dependency_analysis"],
            "security_analysis": static_results["security_analysis"],
            "performance_analysis": static_results["performance_analysis"],
        }

    def _build_pr_result(self, ai_result: dict[str, Any], pr_data: dict[str, Any]) -> dict[str, Any]:
        """Merge AI structured output with PR metadata"""
        return {
            # AI-generated fields (structured JSON)
            "summary": ai_result.get("summary", f"Analysis of PR #{pr_data['pr_number']}"),
            "full_analysis": json.dumps(ai_result, indent=2),
            "risk_level": ai_result.get("risk_level", "medium"),
            "change_type": ai_result.get("change_type", "other"),
            "recommendations": ai_result.get("recommendations", [])[:5],
            "code_quality_assessment": ai_result.get("code_quality_assessment", ""),
            "security_concerns": ai_result.get("security_concerns", []),
            "impact_areas": ai_result.get("impact_areas", []),
            "performance_impact": ai_result.get("performance_impact", ""),
            "maintainability_score": ai_result.get("maintainability_score", 70),
            "security_score": ai_result.get("security_score", 100),
            "performance_score": ai_result.get("performance_score", 100),
            "overall_score": ai_result.get("overall_score", 7),

            # PR metadata
            "files_changed": pr_data['stats']['total_files'],
            "lines_added": pr_data['stats']['additions'],
            "lines_removed": pr_data['stats']['deletions'],
            "pr_number": pr_data['pr_number'],
            "pr_title": pr_data['title'],
            "author": pr_data['author'],
        }

    # ====================================================================
    # RAG INTEGRATION — Retrieve past analyses to augment prompts
    # ====================================================================
    def _get_rag_context(self, commit_data: dict[str, Any]) -> str:
        """Retrieve relevant past analyses for a commit from the RAG knowledge base.

        Builds a search query from the commit data and retrieves similar
        past reviews. Returns the RAG context string (or empty if none found).
        """
        try:
            from app.analysis.rag_service import rag_service

            # Build search query from commit info
            search_text = f"{commit_data.get('message', '')} "
            for file in commit_data.get('files', [])[:5]:
                search_text += f"{file.get('filename', '')} "

            rag_result = rag_service.get_rag_context(
                current_analysis_text=search_text.strip(),
                top_k=3
            )
            return rag_result.get("context", "")
        except Exception:
            # RAG is optional — if it fails, continue without it
            return ""

    def _get_rag_context_for_pr(self, pr_data: dict[str, Any]) -> str:
        """Retrieve relevant past analyses for a PR from the RAG knowledge base."""
        try:
            from app.analysis.rag_service import rag_service

            # Build search query from PR info
            search_text = f"{pr_data.get('title', '')} {pr_data.get('description', '')[:200]} "
            for file in pr_data.get('files', [])[:5]:
                search_text += f"{file.get('filename', '')} "

            rag_result = rag_service.get_rag_context(
                current_analysis_text=search_text.strip(),
                top_k=3
            )
            return rag_result.get("context", "")
        except Exception:
            return ""

    def _store_in_rag(self, analysis_result: dict[str, Any]) -> None:
        """Auto-store a completed analysis in the RAG knowledge base.

        This runs after every analysis so the AI builds up memory
        over time. Failures are silently ignored (RAG is optional).
        """
        try:
            from app.analysis.rag_service import rag_service

            rag_service.store_analysis(
                analysis_data=analysis_result,
                repository_name=analysis_result.get("repository_name"),
            )
        except Exception:
            # RAG storage is best-effort — don't break analysis if it fails
            pass


# Create global instance
gemini_service = GeminiService()
