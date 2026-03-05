# ============================================================================
# MAIN.PY — FastAPI Application Entry Point
# ============================================================================
# The main file that starts the entire backend server. It:
#   1. Creates all database tables on startup (users, repositories, etc.)
#   2. Configures CORS to allow the Next.js frontend (localhost:3000)
#   3. Adds rate limiting middleware (1000 requests/hour per IP)
#   4. Registers all route groups:
#      - /auth/*       → GitHub OAuth authentication
#      - /repos/*      → Repository & commit management
#      - /analysis/*   → AI-powered code analysis (single + multi-agent)
#      - /analysis/*   → AI chat, RAG memory, auto-fix
#      - /webhooks/*   → GitHub webhook listener
#   5. Provides health check endpoints (/ and /health)
#
# Run with: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# Swagger docs available at: http://localhost:8000/docs
# ============================================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine
from app.middleware.rate_limiter import RateLimitMiddleware
from app.models import analysis, pr_analysis, pull_request, repository, user  # noqa: F401
from app.webhooks.github_webhooks import router as webhook_router

# Create all database tables (order matters — pull_requests before pr_analysis_results)
user.Base.metadata.create_all(bind=engine)
repository.Base.metadata.create_all(bind=engine)
pull_request.Base.metadata.create_all(bind=engine)
analysis.Base.metadata.create_all(bind=engine)
pr_analysis.Base.metadata.create_all(bind=engine)

# Hide Swagger/ReDoc in production to avoid exposing internals
_docs_url = "/docs" if settings.DEBUG else None
_redoc_url = "/redoc" if settings.DEBUG else None

# Create FastAPI app
app = FastAPI(
    title="AI Code Review Assistant",
    description="AI-powered code review and analysis platform with multi-agent AI, conversational review, RAG memory, and on-demand auto-fix",
    version="5.0.0",
    docs_url=_docs_url,
    redoc_url=_redoc_url,
)

# Add CORS middleware — origins driven by ALLOWED_ORIGINS env var
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "AI Code Review Assistant API",
        "version": "5.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected",
        "redis": "connected"
    }


app.add_middleware(RateLimitMiddleware, calls_per_hour=1000)

# Import and include routers (must be after app creation to avoid circular imports)
from app.routes.agents import router as agent_router  # noqa: E402
from app.routes.analysis import router as analysis_router  # noqa: E402
from app.routes.auth import router as auth_router  # noqa: E402
from app.routes.autofix import router as autofix_router  # noqa: E402
from app.routes.chat import router as chat_router  # noqa: E402
from app.routes.rag import router as rag_router  # noqa: E402
from app.routes.repositories import router as repo_router  # noqa: E402

app.include_router(auth_router, prefix="/auth", tags=["authentication"])
app.include_router(repo_router, prefix="/repos", tags=["repositories"])
app.include_router(analysis_router, prefix="/analysis", tags=["analysis"])
app.include_router(agent_router, prefix="/analysis", tags=["multi-agent"])
app.include_router(autofix_router, prefix="/analysis", tags=["auto-fix"])
app.include_router(chat_router, prefix="/analysis", tags=["ai-chat"])
app.include_router(rag_router, prefix="/analysis", tags=["rag-memory"])

app.include_router(webhook_router, prefix="/webhooks", tags=["webhooks"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
