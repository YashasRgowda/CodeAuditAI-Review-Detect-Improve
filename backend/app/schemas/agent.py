# ============================================================================
# SCHEMAS/AGENT.PY — Multi-Agent Analysis Request/Response Models
# ============================================================================
# Data shapes for the multi-agent analysis system:
#   - MultiAgentAnalysisRequest:   Input for multi-agent commit analysis
#   - MultiAgentPRAnalysisRequest: Input for multi-agent PR analysis
#   - SecurityAgentReport:         Detailed findings from SecurityAgent
#   - PerformanceAgentReport:      Detailed findings from PerformanceAgent
#   - ArchitectureAgentReport:     Detailed findings from ArchitectureAgent
#   - AgentReports:                Container for all agent reports
#   - MultiAgentAnalysisResponse:  Full combined response
#
# Top-level fields are backward-compatible with single-agent analysis.
# The `agent_reports` field contains deep specialist insights.
# ============================================================================

from pydantic import BaseModel

# ─── Request Models ─────────────────────────────────────────────────────────

class MultiAgentAnalysisRequest(BaseModel):
    """Request to run multi-agent analysis on a commit."""
    repository_id: int
    commit_sha: str


class MultiAgentPRAnalysisRequest(BaseModel):
    """Request to run multi-agent analysis on a pull request."""
    repository_id: int
    pr_number: int


# ─── Detail Models (used inside agent reports) ──────────────────────────────

class VulnerabilityDetail(BaseModel):
    """A single security vulnerability found by the SecurityAgent."""
    type: str = ""
    severity: str = ""
    file: str = ""
    description: str = ""
    fix_suggestion: str = ""


class PerformanceIssueDetail(BaseModel):
    """A single performance issue found by the PerformanceAgent."""
    type: str = ""
    severity: str = ""
    file: str = ""
    description: str = ""
    fix_suggestion: str = ""
    estimated_impact: str = ""


class AntiPatternDetail(BaseModel):
    """A single anti-pattern found by the ArchitectureAgent."""
    pattern: str = ""
    file: str = ""
    description: str = ""
    refactoring_suggestion: str = ""


class TechDebtItem(BaseModel):
    """A single tech debt item identified by the ArchitectureAgent."""
    item: str = ""
    effort: str = "medium"
    priority: str = "medium"


# ─── Agent Report Models ────────────────────────────────────────────────────

class SecurityAgentReport(BaseModel):
    """Detailed report from the SecurityAgent."""
    agent: str = "SecurityAgent"
    status: str = "not_run"
    score: int = 100
    risk_level: str = "low"
    vulnerabilities: list[VulnerabilityDetail] = []
    owasp_categories: list[str] = []
    secure_coding_practices: list[str] = []
    threat_summary: str = ""


class PerformanceAgentReport(BaseModel):
    """Detailed report from the PerformanceAgent."""
    agent: str = "PerformanceAgent"
    status: str = "not_run"
    score: int = 100
    issues: list[PerformanceIssueDetail] = []
    complexity_assessment: str = ""
    optimization_opportunities: list[str] = []
    resource_concerns: list[str] = []
    performance_summary: str = ""


class ArchitectureAgentReport(BaseModel):
    """Detailed report from the ArchitectureAgent."""
    agent: str = "ArchitectureAgent"
    status: str = "not_run"
    score: int = 70
    change_type: str = "other"
    design_patterns_found: list[str] = []
    anti_patterns_found: list[AntiPatternDetail] = []
    solid_assessment: dict[str, str] = {}
    code_smells: list[str] = []
    tech_debt_items: list[TechDebtItem] = []
    architecture_summary: str = ""


class AgentReports(BaseModel):
    """Container for all individual agent reports."""
    security: SecurityAgentReport = SecurityAgentReport()
    performance: PerformanceAgentReport = PerformanceAgentReport()
    architecture: ArchitectureAgentReport = ArchitectureAgentReport()


# ─── Combined Response ──────────────────────────────────────────────────────

class MultiAgentAnalysisResponse(BaseModel):
    """Full multi-agent analysis response.

    Top-level fields are backward-compatible with the single-agent response.
    The `agent_reports` field contains the deep specialist insights.
    """
    # Same top-level fields as single-agent (backward compatible)
    summary: str = ""
    risk_level: str = "low"
    change_type: str = "other"
    files_changed: int = 0
    lines_added: int = 0
    lines_removed: int = 0
    commit_hash: str = ""
    commit_message: str = ""
    author: str = ""
    recommendations: list[str] = []
    impact_areas: list[str] = []
    security_concerns: list[str] = []
    code_quality_assessment: str = ""
    maintainability_score: int = 70
    security_score: int = 100
    performance_score: int = 100
    overall_score: int = 7

    # Individual agent reports with deep specialist insights
    agent_reports: AgentReports = AgentReports()
