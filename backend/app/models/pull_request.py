from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class PullRequest(Base):
    __tablename__ = "pull_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    repository_id = Column(Integer, ForeignKey("repositories.id"), nullable=False)
    pr_number = Column(Integer, nullable=False)  # GitHub PR number like #123
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    author = Column(String, nullable=False)  # GitHub username who created PR
    state = Column(String, nullable=False, default="open")  # open, closed, merged
    base_branch = Column(String, nullable=False, default="main")  # target branch
    head_branch = Column(String, nullable=False)  # source branch
    github_pr_id = Column(String, unique=True, index=True, nullable=False)  # GitHub's internal PR ID
    html_url = Column(String, nullable=False)  # Link to PR on GitHub
    files_changed = Column(Integer, default=0)
    lines_added = Column(Integer, default=0)
    lines_removed = Column(Integer, default=0)
    last_analyzed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship to repository
    repository = relationship("Repository", back_populates="pull_requests")
    
    def __repr__(self):
        return f"<PullRequest(id={self.id}, pr_number=#{self.pr_number}, title='{self.title}')>"
    
    # Add relationship to PRAnalysis model
PullRequest.pr_analysis = relationship("PRAnalysis", back_populates="pull_request")