# ============================================================================
# MODELS/ANALYSIS.PY — Commit Analysis Database Model (analysis_results table)
# ============================================================================
# Stores AI-generated analysis results for individual commits.
# Each analysis contains: AI summary, risk level, changes data (JSON),
# and quantified scores — maintainability, security, performance,
# dependency complexity, and technical debt ratio.
# Created when user triggers POST /analysis/ for a specific commit.
# ============================================================================

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Analysis(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    repository_id = Column(Integer, ForeignKey("repositories.id"), nullable=False)
    commit_hash = Column(String, nullable=False)
    summary = Column(Text, nullable=False)  # AI-generated summary
    changes_data = Column(JSON, nullable=False)  # Detailed changes info
    risk_level = Column(String, nullable=False, default="low")  # low, medium, high
    files_changed = Column(Integer, default=0)
    lines_added = Column(Integer, default=0)
    lines_removed = Column(Integer, default=0)
    maintainability_score = Column(Integer, default=70)
    security_score = Column(Integer, default=100)
    performance_score = Column(Integer, default=100)
    dependency_complexity = Column(Integer, default=0)
    technical_debt_ratio = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to repository
    repository = relationship("Repository", back_populates="analyses")

    def __repr__(self):
        return f"<Analysis(id={self.id}, commit='{self.commit_hash[:8]}')>"

# Add relationship to Repository model (must be after class definition to avoid circular imports)
from app.models.repository import Repository  # noqa: E402

Repository.analyses = relationship("Analysis", back_populates="repository")
