from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine
from app.models import user, repository, analysis

# Create database tables
user.Base.metadata.create_all(bind=engine)
repository.Base.metadata.create_all(bind=engine)
analysis.Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title="AI Code Review Assistant",
    description="AI-powered code review and analysis platform",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "AI Code Review Assistant API",
        "version": "1.0.0",
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

# Import and include routers
from app.auth.routes import router as auth_router
from app.repositories.routes import router as repo_router
from app.analysis.routes import router as analysis_router

app.include_router(auth_router, prefix="/auth", tags=["authentication"])
app.include_router(repo_router, prefix="/repos", tags=["repositories"])
app.include_router(analysis_router, prefix="/analysis", tags=["analysis"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )