# ============================================================================
# CORE/DATABASE.PY — PostgreSQL Database Connection & Session Management
# ============================================================================
# Sets up SQLAlchemy engine connected to PostgreSQL.
# Provides:
#   - engine: The database connection engine with connection pooling
#   - SessionLocal: Factory for creating database sessions
#   - Base: Base class that all database models inherit from
#   - get_db(): FastAPI dependency that provides a DB session per request
#   - test_connection(): Helper to verify the database is reachable
# ============================================================================

import ssl
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

database_url = settings.DATABASE_URL

# Normalize driver prefix
if "postgresql+asyncpg://" in database_url:
    database_url = database_url.replace("postgresql+asyncpg://", "postgresql+pg8000://")
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+pg8000://", 1)

# pg8000 does not accept ?sslmode=require in the URL — strip it and pass SSL
# via connect_args instead. We enable SSL whenever the URL targets a remote
# host (i.e. not localhost / 127.0.0.1).
parsed = urlparse(database_url)
query_params = parse_qs(parsed.query, keep_blank_values=True)
needs_ssl = query_params.pop("sslmode", None) is not None  # True if URL had sslmode

# Rebuild URL without sslmode
clean_query = urlencode({k: v[0] for k, v in query_params.items()})
database_url = urlunparse(parsed._replace(query=clean_query))

# Build connect_args: only add SSL when sslmode=require was explicitly in the
# URL (e.g. Supabase). Never force SSL for local/Docker databases — they don't
# support it and will crash with "Server refuses SSL".
connect_args: dict = {}
if needs_ssl:
    ssl_context = ssl.create_default_context()
    # Supabase pooler uses a self-signed cert in the chain — disable verification
    # while keeping the connection encrypted
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    connect_args["ssl_context"] = ssl_context

engine = create_engine(
    database_url,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=300,
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


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
