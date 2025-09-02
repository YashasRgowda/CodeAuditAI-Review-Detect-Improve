#!/usr/bin/env python3
"""
Test script to verify our setup works
"""

import sys
import os

# Add app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

def test_imports():
    """Test all imports work"""
    try:
        from app.config import settings
        from app.database import test_connection, engine, Base
        from app.redis_client import test_redis_connection
        from app.models.user import User
        from app.models.repository import Repository  
        from app.models.analysis import Analysis
        
        print("✅ All imports successful!")
        return True
    except Exception as e:
        print(f"❌ Import error: {e}")
        return False

def test_settings():
    """Test settings load"""
    try:
        from app.config import settings
        print(f"✅ Settings loaded!")
        print(f"  - Database URL: {settings.DATABASE_URL[:50]}...")
        print(f"  - Redis URL: {settings.REDIS_URL}")
        print(f"  - Gemini API Key: {'***' + settings.GEMINI_API_KEY[-4:]}")
        return True
    except Exception as e:
        print(f"❌ Settings error: {e}")
        return False

def create_database():
    """Create database tables"""
    try:
        from app.database import engine, Base
        from app.models import user, repository, analysis
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created!")
        return True
    except Exception as e:
        print(f"❌ Database creation error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Testing AI Code Review Assistant Setup...\n")
    
    success = True
    
    # Test imports
    success &= test_imports()
    
    # Test settings  
    success &= test_settings()
    
    # Test database connection
    from app.database import test_connection
    success &= test_connection()
    
    # Test Redis connection
    from app.redis_client import test_redis_connection  
    success &= test_redis_connection()
    
    # Create database tables
    success &= create_database()
    
    if success:
        print("\n🎉 Setup complete! Everything is working!")
    else:
        print("\n❌ Setup failed. Check the errors above.")
        sys.exit(1)