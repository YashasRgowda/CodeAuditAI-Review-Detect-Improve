# ============================================================================
# SERVICES/AGENTS/ORCHESTRATOR.PY — Multi-Agent Orchestrator
# ============================================================================
# The "brain" of the multi-agent system. Coordinates all specialist agents:
#
#   1. Takes code diff + commit metadata as input
#   2. Runs static analysis pipeline (AST, security, dependency, performance)
#   3. Retrieves RAG context (past analyses from AI memory)
#   4. Builds a shared code context string for all agents
#   5. Launches SecurityAgent, PerformanceAgent, ArchitectureAgent IN PARALLEL
#   6. Collects all agent results
#   7. Merges them into a single unified report (same JSON shape as before)
#   8. Auto-stores the result in RAG for future reference
#
# Key advantage: All 3 agents run at the SAME TIME using asyncio.gather(),
# so the total time ≈ slowest agent, not sum of all agents.
#
# Key methods:
#   - run_multi_agent_analysis()  → Full parallel analysis for commits
#   - run_multi_agent_pr_analysis() → Full parallel analysis for PRs
#   - stream_multi_agent_analysis() → SSE streaming with per-agent progress
# ============================================================================

import asyncio
from collections.abc import AsyncGenerator
from typing import Any

from app.analyzers.ast_parser import ast_parser
from app.analyzers.dependency_analyzer import dependency_analyzer
from app.analyzers.performance_analyzer import performance_analyzer
from app.analyzers.security_scanner import security_scanner
from app.services.agents.architecture_agent import architecture_agent
from app.services.agents.performance_agent import performance_agent
from app.services.agents.security_agent import security_agent


class AgentOrchestrator:
    """Orchestrates multiple specialist AI agents to produce a unified code review."""

    def __init__(self):
        self.agents = [security_agent, performance_agent, architecture_agent]

    # ====================================================================
    # CODE CONTEXT BUILDER — Shared input for all agents
    # ====================================================================
    def _build_code_context(
        self,
        commit_data: dict[str, Any],
        static_results: dict[str, Any],
        rag_context: str = "",
    ) -> str:
        """Build the shared code context string that all agents will receive."""
        ast_analyses = static_results["ast_analyses"]

        # Build file summaries with AST insights
        files_info = []
        for i, file in enumerate(commit_data.get("files", [])):
            file_summary = (
                f"File: {file['filename']} | Status: {file['status']} "
                f"| +{file['additions']} -{file['deletions']}"
            )

            if i < len(ast_analyses) and not ast_analyses[i].get("error"):
                ast = ast_analyses[i]
                file_summary += (
                    f"\n  Structure: {ast.get('functions', 0)} functions, "
                    f"{ast.get('classes', 0)} classes, "
                    f"complexity={ast.get('complexity_score', 0)}"
                )
                if ast.get("security_patterns"):
                    file_summary += f"\n  Security flags: {', '.join(ast['security_patterns'])}"
                if ast.get("code_quality_issues"):
                    file_summary += f"\n  Quality issues: {', '.join(ast['code_quality_issues'])}"

            if file.get("patch"):
                file_summary += f"\n  Diff:\n{file['patch'][:800]}"

            files_info.append(file_summary)

        # Static analysis summaries
        sec = static_results["security_analysis"]
        sec_summary = f"Security scan: {sec.get('total_findings', 0)} findings, risk score {sec.get('overall_risk_score', 0)}/100"

        perf = static_results["performance_analysis"]
        perf_summary = f"Performance scan: {perf.get('total_issues', 0)} issues, score {perf.get('performance_score', 100)}/100"

        dep = static_results["dependency_analysis"]
        dep_summary = f"Dependencies: complexity {dep.get('complexity_score', 0)}/100, {len(dep.get('dependency_risks', []))} risks"

        # RAG section
        rag_section = ""
        if rag_context:
            rag_section = f"""
PAST ANALYSIS HISTORY (from AI memory):
{rag_context}
Reference past reviews to identify patterns, recurring issues, or improvements over time.
"""

        return f"""COMMIT: {commit_data['sha'][:12]} by {commit_data['author']}
MESSAGE: {commit_data['message']}
STATS: {commit_data['stats']['total']} changes (+{commit_data['stats']['additions']} -{commit_data['stats']['deletions']})

STATIC ANALYSIS RESULTS:
{sec_summary}
{perf_summary}
{dep_summary}

FILES CHANGED:
{chr(10).join(files_info)}
{rag_section}"""

    def _build_pr_context(
        self,
        pr_data: dict[str, Any],
        rag_context: str = "",
    ) -> str:
        """Build code context string for PR analysis."""
        files_info = []
        for file in pr_data.get("files", [])[:20]:
            file_summary = (
                f"File: {file['filename']} | Status: {file['status']} "
                f"| +{file['additions']} -{file['deletions']}"
            )
            if file.get("patch") and len(file["patch"]) < 1000:
                file_summary += f"\n  Diff:\n{file['patch'][:600]}"
            files_info.append(file_summary)

        rag_section = ""
        if rag_context:
            rag_section = f"""
PAST ANALYSIS HISTORY (from AI memory):
{rag_context}
Reference past reviews to identify patterns, recurring issues, or improvements over time.
"""

        return f"""PR #{pr_data['pr_number']}: {pr_data['title']}
Author: {pr_data['author']}
Branches: {pr_data['head_branch']} → {pr_data['base_branch']}
Stats: {pr_data['stats']['total_files']} files, +{pr_data['stats']['additions']} -{pr_data['stats']['deletions']}

Description:
{pr_data.get('description', 'No description')[:500]}

FILES CHANGED:
{chr(10).join(files_info)}
{rag_section}"""

    # ====================================================================
    # STATIC ANALYSIS — Same pipeline as the generalist
    # ====================================================================
    def _run_static_analysis(self, commit_data: dict[str, Any]) -> dict[str, Any]:
        """Run all static analysis tools on the code files."""
        ast_analyses = []
        files_for_analysis = []

        for file in commit_data.get("files", []):
            if file.get("patch"):
                filename = file["filename"]
                patch_content = file["patch"]
                ast_analysis = ast_parser.calculate_advanced_metrics(patch_content, filename)
                ast_analyses.append(ast_analysis)
                files_for_analysis.append({"filename": filename, "content": patch_content})

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
    # RAG HELPERS — Retrieve past analyses + auto-store new ones
    # ====================================================================
    def _get_rag_context(self, commit_data: dict[str, Any]) -> str:
        """Retrieve relevant past analyses from RAG knowledge base."""
        try:
            from app.services.rag_service import rag_service

            search_text = f"{commit_data.get('message', '')} "
            for file in commit_data.get("files", [])[:5]:
                search_text += f"{file.get('filename', '')} "

            rag_result = rag_service.get_rag_context(
                current_analysis_text=search_text.strip(),
                top_k=3,
            )
            return rag_result.get("context", "")
        except Exception:
            return ""

    def _get_rag_context_for_pr(self, pr_data: dict[str, Any]) -> str:
        """Retrieve relevant past PR analyses from RAG knowledge base."""
        try:
            from app.services.rag_service import rag_service

            search_text = f"{pr_data.get('title', '')} {pr_data.get('description', '')[:200]} "
            for file in pr_data.get("files", [])[:5]:
                search_text += f"{file.get('filename', '')} "

            rag_result = rag_service.get_rag_context(
                current_analysis_text=search_text.strip(),
                top_k=3,
            )
            return rag_result.get("context", "")
        except Exception:
            return ""

    def _store_in_rag(self, analysis_result: dict[str, Any]) -> None:
        """Auto-store completed analysis in RAG for future reference."""
        try:
            from app.services.rag_service import rag_service

            rag_service.store_analysis(
                analysis_data=analysis_result,
                repository_name=analysis_result.get("repository_name"),
            )
        except Exception:
            pass

    # ====================================================================
    # MERGE AGENT RESULTS — Combine 3 specialist reports into 1 unified report
    # ====================================================================
    def _merge_agent_results(
        self,
        agent_results: list[dict[str, Any]],
        commit_data: dict[str, Any],
        static_results: dict[str, Any],
    ) -> dict[str, Any]:
        """Merge results from all specialist agents into a single unified report."""
        # Separate results by agent
        security_result = {}
        performance_result = {}
        architecture_result = {}

        for result in agent_results:
            agent_name = result.get("_agent", "")
            if agent_name == "SecurityAgent":
                security_result = result
            elif agent_name == "PerformanceAgent":
                performance_result = result
            elif agent_name == "ArchitectureAgent":
                architecture_result = result

        return {
            "summary": self._build_unified_summary(
                security_result, performance_result, architecture_result
            ),
            "maintainability_score": architecture_result.get("maintainability_score", 70),
            "security_score": security_result.get("security_score", 100),
            "performance_score": performance_result.get("performance_score", 100),
            "overall_score": self._calculate_overall_score(
                security_result, performance_result, architecture_result
            ),
            "risk_level": self._get_highest_risk(
                security_result.get("risk_level", "low"),
                architecture_result.get("risk_level", "low"),
            ),
            "change_type": architecture_result.get("change_type", "other"),
            "recommendations": self._merge_recommendations(
                security_result, performance_result, architecture_result
            ),
            "impact_areas": self._extract_impact_areas(
                security_result, performance_result, architecture_result
            ),
            "security_concerns": [
                v.get("description", v.get("type", "Unknown"))
                for v in security_result.get("vulnerabilities", [])
            ],
            "code_quality_assessment": architecture_result.get("architecture_summary", ""),
            "files_changed": len(commit_data.get("files", [])),
            "lines_added": commit_data["stats"]["additions"],
            "lines_removed": commit_data["stats"]["deletions"],
            "commit_hash": commit_data["sha"],
            "commit_message": commit_data["message"],
            "author": commit_data["author"],
            "analysis_date": commit_data.get("date", ""),
            "ast_analysis": {
                "files_analyzed": len(static_results["ast_analyses"]),
                "total_functions": sum(
                    a.get("functions", 0) for a in static_results["ast_analyses"]
                ),
                "total_classes": sum(
                    a.get("classes", 0) for a in static_results["ast_analyses"]
                ),
                "complexity_summary": static_results["ast_analyses"],
                "security_patterns_found": [
                    p
                    for a in static_results["ast_analyses"]
                    for p in a.get("security_patterns", [])
                ],
            },
            "dependency_analysis": static_results["dependency_analysis"],
            "security_analysis": static_results["security_analysis"],
            "performance_analysis": static_results["performance_analysis"],
            "agent_reports": {
                "security": {
                    "agent": "SecurityAgent",
                    "status": security_result.get("_status", "not_run"),
                    "score": security_result.get("security_score", 100),
                    "risk_level": security_result.get("risk_level", "low"),
                    "vulnerabilities": security_result.get("vulnerabilities", []),
                    "owasp_categories": security_result.get("owasp_categories", []),
                    "secure_coding_practices": security_result.get("secure_coding_practices", []),
                    "threat_summary": security_result.get("threat_summary", ""),
                },
                "performance": {
                    "agent": "PerformanceAgent",
                    "status": performance_result.get("_status", "not_run"),
                    "score": performance_result.get("performance_score", 100),
                    "issues": performance_result.get("issues", []),
                    "complexity_assessment": performance_result.get("complexity_assessment", ""),
                    "optimization_opportunities": performance_result.get("optimization_opportunities", []),
                    "resource_concerns": performance_result.get("resource_concerns", []),
                    "performance_summary": performance_result.get("performance_summary", ""),
                },
                "architecture": {
                    "agent": "ArchitectureAgent",
                    "status": architecture_result.get("_status", "not_run"),
                    "score": architecture_result.get("maintainability_score", 70),
                    "change_type": architecture_result.get("change_type", "other"),
                    "design_patterns_found": architecture_result.get("design_patterns_found", []),
                    "anti_patterns_found": architecture_result.get("anti_patterns_found", []),
                    "solid_assessment": architecture_result.get("solid_assessment", {}),
                    "code_smells": architecture_result.get("code_smells", []),
                    "tech_debt_items": architecture_result.get("tech_debt_items", []),
                    "architecture_summary": architecture_result.get("architecture_summary", ""),
                },
            },
        }

    def _merge_pr_results(
        self,
        agent_results: list[dict[str, Any]],
        pr_data: dict[str, Any],
    ) -> dict[str, Any]:
        """Merge agent results for PR analysis."""
        security_result = {}
        performance_result = {}
        architecture_result = {}

        for result in agent_results:
            agent_name = result.get("_agent", "")
            if agent_name == "SecurityAgent":
                security_result = result
            elif agent_name == "PerformanceAgent":
                performance_result = result
            elif agent_name == "ArchitectureAgent":
                architecture_result = result

        return {
            "summary": self._build_unified_summary(
                security_result, performance_result, architecture_result
            ),
            "maintainability_score": architecture_result.get("maintainability_score", 70),
            "security_score": security_result.get("security_score", 100),
            "performance_score": performance_result.get("performance_score", 100),
            "overall_score": self._calculate_overall_score(
                security_result, performance_result, architecture_result
            ),
            "risk_level": self._get_highest_risk(
                security_result.get("risk_level", "low"),
                architecture_result.get("risk_level", "low"),
            ),
            "change_type": architecture_result.get("change_type", "other"),
            "recommendations": self._merge_recommendations(
                security_result, performance_result, architecture_result
            ),
            "impact_areas": self._extract_impact_areas(
                security_result, performance_result, architecture_result
            ),
            "security_concerns": [
                v.get("description", v.get("type", "Unknown"))
                for v in security_result.get("vulnerabilities", [])
            ],
            "performance_impact": performance_result.get("performance_summary", ""),
            "code_quality_assessment": architecture_result.get("architecture_summary", ""),
            "files_changed": pr_data["stats"]["total_files"],
            "lines_added": pr_data["stats"]["additions"],
            "lines_removed": pr_data["stats"]["deletions"],
            "pr_number": pr_data["pr_number"],
            "pr_title": pr_data["title"],
            "author": pr_data["author"],
            "agent_reports": {
                "security": {
                    "agent": "SecurityAgent",
                    "status": security_result.get("_status", "not_run"),
                    "score": security_result.get("security_score", 100),
                    "vulnerabilities": security_result.get("vulnerabilities", []),
                    "owasp_categories": security_result.get("owasp_categories", []),
                    "threat_summary": security_result.get("threat_summary", ""),
                },
                "performance": {
                    "agent": "PerformanceAgent",
                    "status": performance_result.get("_status", "not_run"),
                    "score": performance_result.get("performance_score", 100),
                    "issues": performance_result.get("issues", []),
                    "performance_summary": performance_result.get("performance_summary", ""),
                },
                "architecture": {
                    "agent": "ArchitectureAgent",
                    "status": architecture_result.get("_status", "not_run"),
                    "score": architecture_result.get("maintainability_score", 70),
                    "anti_patterns_found": architecture_result.get("anti_patterns_found", []),
                    "solid_assessment": architecture_result.get("solid_assessment", {}),
                    "architecture_summary": architecture_result.get("architecture_summary", ""),
                },
            },
        }

    # ====================================================================
    # HELPER METHODS
    # ====================================================================
    def _build_unified_summary(
        self,
        security_result: dict[str, Any],
        performance_result: dict[str, Any],
        architecture_result: dict[str, Any],
    ) -> str:
        """Combine agent summaries into one unified summary."""
        parts = []
        arch_summary = architecture_result.get("architecture_summary", "")
        if arch_summary:
            parts.append(arch_summary)

        sec_summary = security_result.get("threat_summary", "")
        if sec_summary and security_result.get("security_score", 100) < 100:
            parts.append(f"Security: {sec_summary}")

        perf_summary = performance_result.get("performance_summary", "")
        if perf_summary and performance_result.get("performance_score", 100) < 100:
            parts.append(f"Performance: {perf_summary}")

        return " ".join(parts) if parts else "Multi-agent analysis completed."

    def _calculate_overall_score(
        self,
        security_result: dict[str, Any],
        performance_result: dict[str, Any],
        architecture_result: dict[str, Any],
    ) -> int:
        """Calculate overall score (1-10) as a weighted average.

        Weights: Security 40%, Performance 25%, Architecture 35%
        """
        sec_score = security_result.get("security_score", 100)
        perf_score = performance_result.get("performance_score", 100)
        arch_score = architecture_result.get("maintainability_score", 70)

        weighted = (sec_score * 0.40) + (perf_score * 0.25) + (arch_score * 0.35)
        overall = max(1, min(10, round(weighted / 10)))
        return overall

    def _get_highest_risk(self, *risk_levels: str) -> str:
        """Return the highest risk level from all agents."""
        priority = {"critical": 4, "high": 3, "medium": 2, "low": 1}
        highest = max(risk_levels, key=lambda r: priority.get(r, 0))
        return highest

    def _merge_recommendations(
        self,
        security_result: dict[str, Any],
        performance_result: dict[str, Any],
        architecture_result: dict[str, Any],
    ) -> list[str]:
        """Merge recommendations from all agents, prefixed with agent name."""
        recommendations = []

        for rec in security_result.get("security_recommendations", [])[:2]:
            recommendations.append(f"[Security] {rec}")

        for rec in performance_result.get("performance_recommendations", [])[:2]:
            recommendations.append(f"[Performance] {rec}")

        for rec in architecture_result.get("architecture_recommendations", [])[:2]:
            recommendations.append(f"[Architecture] {rec}")

        return recommendations[:6]

    def _extract_impact_areas(
        self,
        security_result: dict[str, Any],
        performance_result: dict[str, Any],
        architecture_result: dict[str, Any],
    ) -> list[str]:
        """Extract unique impact areas from all agents."""
        areas = set()

        if security_result.get("vulnerabilities"):
            areas.add("Security")
        for cat in security_result.get("owasp_categories", []):
            areas.add(cat)

        if performance_result.get("issues"):
            areas.add("Performance")

        if architecture_result.get("anti_patterns_found"):
            areas.add("Code Architecture")
        if architecture_result.get("tech_debt_items"):
            areas.add("Tech Debt")

        return sorted(areas) if areas else ["General"]

    # ====================================================================
    # MAIN ENTRY POINT — Run multi-agent commit analysis
    # ====================================================================
    async def run_multi_agent_analysis(
        self, commit_data: dict[str, Any]
    ) -> dict[str, Any]:
        """Run all specialist agents in parallel on a commit."""
        static_results = self._run_static_analysis(commit_data)
        rag_context = self._get_rag_context(commit_data)
        code_context = self._build_code_context(commit_data, static_results, rag_context)

        agent_results = await asyncio.gather(
            security_agent.analyze(code_context),
            performance_agent.analyze(code_context),
            architecture_agent.analyze(code_context),
        )

        final_result = self._merge_agent_results(
            list(agent_results), commit_data, static_results
        )

        self._store_in_rag(final_result)
        return final_result

    # ====================================================================
    # PR ANALYSIS — Multi-agent PR review
    # ====================================================================
    async def run_multi_agent_pr_analysis(
        self, pr_data: dict[str, Any]
    ) -> dict[str, Any]:
        """Run all specialist agents in parallel on a pull request."""
        rag_context = self._get_rag_context_for_pr(pr_data)
        code_context = self._build_pr_context(pr_data, rag_context)

        agent_results = await asyncio.gather(
            security_agent.analyze(code_context),
            performance_agent.analyze(code_context),
            architecture_agent.analyze(code_context),
        )

        final_result = self._merge_pr_results(list(agent_results), pr_data)
        self._store_in_rag(final_result)
        return final_result

    # ====================================================================
    # STREAMING — SSE streaming with per-agent progress updates
    # ====================================================================
    async def stream_multi_agent_analysis(
        self, commit_data: dict[str, Any]
    ) -> AsyncGenerator[dict[str, Any]]:
        """Stream multi-agent analysis progress as SSE events."""

        yield {
            "event": "progress",
            "data": {"step": "start", "message": "Starting multi-agent analysis...", "progress": 5},
        }

        yield {
            "event": "progress",
            "data": {"step": "static", "message": "Running static analysis pipeline...", "progress": 15},
        }
        static_results = self._run_static_analysis(commit_data)

        yield {
            "event": "progress",
            "data": {"step": "rag", "message": "Retrieving past analyses from AI memory...", "progress": 25},
        }
        rag_context = self._get_rag_context(commit_data)

        code_context = self._build_code_context(commit_data, static_results, rag_context)

        yield {
            "event": "progress",
            "data": {
                "step": "agents_launch",
                "message": "Launching 3 specialist agents in parallel...",
                "progress": 35,
                "agents": ["SecurityAgent", "PerformanceAgent", "ArchitectureAgent"],
            },
        }

        yield {
            "event": "progress",
            "data": {
                "step": "agents_running",
                "message": "SecurityAgent + PerformanceAgent + ArchitectureAgent analyzing...",
                "progress": 55,
            },
        }

        agent_results = await asyncio.gather(
            security_agent.analyze(code_context),
            performance_agent.analyze(code_context),
            architecture_agent.analyze(code_context),
        )

        for result in agent_results:
            status = "completed" if result.get("_status") == "success" else "failed"
            yield {
                "event": "agent_complete",
                "data": {
                    "agent": result.get("_agent", "Unknown"),
                    "status": result.get("_status", "error"),
                    "message": f"{result.get('_agent', 'Unknown')} {status}",
                    "progress": 75,
                },
            }

        yield {
            "event": "progress",
            "data": {"step": "merge", "message": "Merging specialist reports...", "progress": 85},
        }
        final_result = self._merge_agent_results(
            list(agent_results), commit_data, static_results
        )

        yield {
            "event": "progress",
            "data": {"step": "rag_store", "message": "Storing in knowledge base...", "progress": 95},
        }
        self._store_in_rag(final_result)

        yield {
            "event": "complete",
            "data": {
                "result": final_result,
                "progress": 100,
                "message": "Multi-agent analysis complete!",
                "agents_used": 3,
            },
        }


# Create global instance
agent_orchestrator = AgentOrchestrator()
