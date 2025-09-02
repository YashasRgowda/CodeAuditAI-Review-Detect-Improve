from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Use standard PostgreSQL driver (psycopg2)
database_url = settings.DATABASE_URL
if "postgresql+asyncpg://" in database_url:
    database_url = database_url.replace("postgresql+asyncpg://", "postgresql://")

# Create database engine - using psycopg2 for PostgreSQL
engine = create_engine(
    database_url,
    pool_pre_ping=True,
    pool_recycle=300,
    echo=settings.DEBUG  # Log SQL queries in debug mode
)

# Create sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for database models
Base = declarative_base()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Test database connection
def test_connection():
    try:
        with engine.connect() as connection:
            from sqlalchemy import text
            connection.execute(text("SELECT 1"))
        print("✅ Database connection successful!")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False