from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    github_id = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, index=True, nullable=False)
    email = Column(String, index=True, nullable=True)
    avatar_url = Column(String, nullable=True)
    access_token = Column(Text, nullable=False)  # GitHub access token
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}')>"