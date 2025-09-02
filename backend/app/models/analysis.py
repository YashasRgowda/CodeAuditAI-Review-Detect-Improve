from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

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
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship to repository
    repository = relationship("Repository", back_populates="analyses")
    
    def __repr__(self):
        return f"<Analysis(id={self.id}, commit='{self.commit_hash[:8]}')>"

# Add relationship to Repository model
from app.models.repository import Repository
Repository.analyses = relationship("Analysis", back_populates="repository")