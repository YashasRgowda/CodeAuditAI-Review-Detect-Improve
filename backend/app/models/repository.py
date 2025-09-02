from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

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

# Add relationship to User model
from app.models.user import User
User.repositories = relationship("Repository", back_populates="user")