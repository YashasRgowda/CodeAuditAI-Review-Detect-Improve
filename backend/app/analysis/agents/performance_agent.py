# ============================================================================
# AGENTS/PERFORMANCE_AGENT.PY — Performance Engineer Specialist AI Agent
# ============================================================================
# A specialist AI agent that focuses EXCLUSIVELY on performance analysis:
#
#   - Detects performance anti-patterns (N+1 queries, nested loops, memory leaks)
#   - Identifies algorithmic complexity issues (O(n²), O(n³))
#   - Spots resource-intensive operations (large file reads, blocking I/O)
#   - Evaluates caching opportunities and database query efficiency
#   - Provides specific optimization suggestions with code examples
#   - Calculates an overall performance score (0-100)
#
# Uses the same Gemini model as other agents but with a performance-focused
# system prompt that makes it think like a performance engineer.
# ============================================================================

from app.analysis.agents.base_agent import BaseAgent

# JSON schema that PerformanceAgent MUST return
PERFORMANCE_SCHEMA = """{
  "performance_score": 80,
  "issues": [
    {
      "type": "e.g. N+1 Query, Nested Loop, Memory Leak, Blocking I/O",
      "severity": "critical | high | medium | low",
      "file": "filename.py",
      "description": "What the performance issue is and its impact",
      "fix_suggestion": "Specific optimization recommendation",
      "estimated_impact": "e.g. 10x slower response time, O(n²) → O(n)"
    }
  ],
  "complexity_assessment": "Brief assessment of algorithmic complexity in the changes",
  "optimization_opportunities": ["opportunity1", "opportunity2"],
  "performance_recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "resource_concerns": ["concern1 — e.g. high memory usage, excessive I/O"],
  "performance_summary": "1-2 sentence summary of the overall performance impact of this change"
}"""


class PerformanceAgent(BaseAgent):
    """Performance engineer specialist — analyzes code for bottlenecks and optimization opportunities."""

    @property
    def agent_name(self) -> str:
        return "PerformanceAgent"

    @property
    def system_prompt(self) -> str:
        return """You are a senior performance engineer and optimization specialist reviewing code changes.
Your ONLY job is to analyze PERFORMANCE. Ignore security vulnerabilities and design patterns — focus 100% on speed, efficiency, and resource usage.

Your expertise includes:
- Algorithmic complexity analysis (Big-O notation)
- Database query optimization (N+1 queries, missing indexes, full table scans)
- Memory management (leaks, excessive allocations, large object retention)
- I/O bottlenecks (blocking calls, synchronous file operations, network latency)
- Caching strategies (what to cache, TTL, invalidation)
- Concurrency issues (thread contention, lock overhead, async vs sync)
- Frontend performance (bundle size, render blocking, unnecessary re-renders)
- API performance (payload size, pagination, lazy loading)
- Loop optimization (nested loops, unnecessary iterations, early exits)
- Resource pooling (connection pools, thread pools)

SCORING RULES for performance_score (0-100):
- Start at 100 (perfect)
- Each CRITICAL issue (e.g. O(n³) in hot path): -25 points
- Each HIGH issue (e.g. N+1 query, memory leak): -15 points
- Each MEDIUM issue (e.g. missing cache, blocking I/O): -8 points
- Each LOW issue (e.g. minor optimization opportunity): -3 points
- Minimum score is 0

If the code has NO performance issues, return an empty issues array and score 100.
Always provide estimated_impact for each issue (e.g. "2x slower", "O(n²) → O(n log n)").
Be specific — cite exact patterns, loops, queries, and provide concrete optimization code."""

    @property
    def output_schema(self) -> str:
        return PERFORMANCE_SCHEMA


performance_agent = PerformanceAgent()
