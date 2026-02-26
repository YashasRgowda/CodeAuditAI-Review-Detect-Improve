# ============================================================================
# MODELS/PR_ANALYSIS.PY — PR Analysis Database Model (pr_analysis_results table)
# ============================================================================
# Stores AI-generated analysis results for pull requests.
# Similar to commit analysis but specific to PRs. Contains: AI summary,
# full analysis text, risk level, change type, overall score (1-10),
# and complete analysis data as JSON.
# Created when user triggers POST /analysis/pr/ for a specific PR.
# ============================================================================

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class PRAnalysis(Base):
    __tablename__ = "pr_analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    repository_id = Column(Integer, ForeignKey("repositories.id"), nullable=False)
    pull_request_id = Column(Integer, ForeignKey("pull_requests.id"), nullable=True)
    pr_number = Column(Integer, nullable=False)
    summary = Column(Text, nullable=False)
    full_analysis = Column(Text, nullable=False)
    risk_level = Column(String, nullable=False, default="medium")
    change_type = Column(String, nullable=False, default="other")
    files_changed = Column(Integer, default=0)
    lines_added = Column(Integer, default=0)
    lines_removed = Column(Integer, default=0)
    overall_score = Column(Integer, default=7)  # 1-10 rating
    analysis_data = Column(JSON, nullable=False)  # Complete analysis details
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    repository = relationship("Repository", back_populates="pr_analyses")
    pull_request = relationship("PullRequest", back_populates="pr_analysis")

    def __repr__(self):
        return f"<PRAnalysis(id={self.id}, pr_number=#{self.pr_number}, risk={self.risk_level})>"
