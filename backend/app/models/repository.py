# ============================================================================
# MODELS/REPOSITORY.PY — Repository Database Model (repositories table)
# ============================================================================
# Stores GitHub repositories that a user has added for tracking/analysis.
# Fields: repo_name (e.g. "user/repo"), repo_url, github_repo_id, description
# Relationships: belongs to User, has many Analyses, PullRequests, PRAnalyses
# ============================================================================

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Repository(Base):
    __tablename__ = "repositories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    repo_name = Column(String, nullable=False)  # e.g., "username/repo-name"
    repo_url = Column(String, nullable=False)   # GitHub repo URL
    github_repo_id = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    last_analyzed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship to user
    user = relationship("User", back_populates="repositories")

    def __repr__(self):
        return f"<Repository(id={self.id}, name='{self.repo_name}')>"

# Add relationship to User model (must be after class definition to avoid circular imports)
from app.models.user import User  # noqa: E402

User.repositories = relationship("Repository", back_populates="user")

# Add relationship to PullRequest model (NEW)
Repository.pull_requests = relationship("PullRequest", back_populates="repository")

# Add relationship to PRAnalysis model (NEW)
Repository.pr_analyses = relationship("PRAnalysis", back_populates="repository")
