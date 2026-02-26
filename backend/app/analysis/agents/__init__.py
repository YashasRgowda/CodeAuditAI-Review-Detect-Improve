# ============================================================================
# ANALYSIS/AGENTS/ — Multi-Agent AI Code Review System
# ============================================================================
# This package implements a multi-agent architecture where specialized AI
# agents analyze code from different expert perspectives:
#
#   - SecurityAgent       → Cybersecurity expert (vulnerabilities, OWASP)
#   - PerformanceAgent    → Performance engineer (bottlenecks, complexity)
#   - ArchitectureAgent   → Senior architect (design patterns, SOLID, tech debt)
#   - AgentOrchestrator   → Runs all agents in parallel + merges their reports
#
# All agents use the SAME Gemini model but with DIFFERENT system prompts,
# making each one a domain specialist. This produces deeper, more focused
# insights compared to a single generalist prompt.
# ============================================================================

from app.analysis.agents.orchestrator import agent_orchestrator

__all__ = ["agent_orchestrator"]
