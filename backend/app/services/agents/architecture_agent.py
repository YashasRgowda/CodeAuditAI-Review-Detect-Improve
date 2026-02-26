# ============================================================================
# SERVICES/AGENTS/ARCHITECTURE_AGENT.PY — Senior Architect Specialist Agent
# ============================================================================
# A specialist AI agent that focuses EXCLUSIVELY on code architecture:
#
#   - Evaluates design patterns and anti-patterns
#   - Checks SOLID principle adherence
#   - Identifies tech debt and code smells
#   - Assesses code structure, readability, and modularity
#   - Evaluates naming conventions and documentation quality
#   - Provides refactoring recommendations
#   - Calculates an overall maintainability score (0-100)
#
# Uses the same Gemini model as other agents but with an architecture-focused
# system prompt that makes it think like a principal engineer.
# ============================================================================

from app.services.agents.base_agent import BaseAgent

# JSON schema that ArchitectureAgent MUST return
ARCHITECTURE_SCHEMA = """{
  "maintainability_score": 75,
  "change_type": "feature | bug_fix | refactoring | documentation | configuration | other",
  "design_patterns_found": ["Pattern1", "Pattern2"],
  "anti_patterns_found": [
    {
      "pattern": "e.g. God Class, Spaghetti Code, Shotgun Surgery",
      "file": "filename.py",
      "description": "Why this is problematic",
      "refactoring_suggestion": "How to fix it"
    }
  ],
  "solid_assessment": {
    "single_responsibility": "pass | violation — brief explanation",
    "open_closed": "pass | violation — brief explanation",
    "liskov_substitution": "pass | not_applicable — brief explanation",
    "interface_segregation": "pass | not_applicable — brief explanation",
    "dependency_inversion": "pass | violation — brief explanation"
  },
  "code_smells": ["smell1", "smell2"],
  "tech_debt_items": [
    {
      "item": "What the tech debt is",
      "effort": "low | medium | high",
      "priority": "low | medium | high"
    }
  ],
  "architecture_recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "architecture_summary": "1-2 sentence summary of the code architecture quality"
}"""


class ArchitectureAgent(BaseAgent):
    """Senior architect specialist — analyzes code structure, patterns, and maintainability."""

    @property
    def agent_name(self) -> str:
        return "ArchitectureAgent"

    @property
    def system_prompt(self) -> str:
        return """You are a principal software architect and clean code advocate reviewing code changes.
Your ONLY job is to analyze CODE ARCHITECTURE and MAINTAINABILITY. Ignore security vulnerabilities and performance benchmarks — focus 100% on design quality.

Your expertise includes:
- Design patterns (Factory, Strategy, Observer, Repository, etc.)
- Anti-patterns (God Class, Spaghetti Code, Shotgun Surgery, Lava Flow, etc.)
- SOLID principles (Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion)
- Clean Code principles (meaningful naming, small functions, DRY, KISS, YAGNI)
- Code smells (long methods, large classes, feature envy, data clumps)
- Technical debt identification and prioritization
- Module coupling and cohesion analysis
- Error handling patterns and resilience
- Code documentation and self-documenting code quality
- Testing patterns and testability assessment

SCORING RULES for maintainability_score (0-100):
- Start at 100 (perfect clean code)
- Each anti-pattern found: -10 points
- Each SOLID violation: -8 points
- Each code smell: -5 points
- Each tech debt item (high priority): -10 points
- Each tech debt item (medium priority): -5 points
- Each tech debt item (low priority): -2 points
- Minimum score is 0

change_type classification:
- "feature": new functionality added
- "bug_fix": fixing existing broken behavior
- "refactoring": restructuring without changing behavior
- "documentation": docs/comments only
- "configuration": config files, env, CI/CD
- "other": doesn't fit above categories

If the code is well-structured, return empty anti_patterns and code_smells arrays.
Be specific — cite exact classes, functions, and file names in your assessment."""

    @property
    def output_schema(self) -> str:
        return ARCHITECTURE_SCHEMA


architecture_agent = ArchitectureAgent()
