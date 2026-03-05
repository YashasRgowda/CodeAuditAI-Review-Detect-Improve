# ============================================================================
# CORE/CONFIG.PY — Application Configuration
# ============================================================================
# Loads all environment variables from the .env file using Pydantic Settings.
# Contains: Database URL, Redis URL, Gemini API key, GitHub OAuth credentials,
# JWT secret key, and app settings (debug mode, host, port).
# All values can be overridden via environment variables or the .env file.
# ============================================================================


from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Database
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/ai_code_review"
    REDIS_URL: str = "redis://localhost:6379"

    # Google Gemini AI
    GEMINI_API_KEY: str

    # GitHub OAuth
    GITHUB_CLIENT_ID: str | None = None
    GITHUB_CLIENT_SECRET: str | None = None

    # Security — no default; must be set in env
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # URLs — used to build redirect URIs and CORS; override in production
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"

    # Comma-separated list of allowed CORS origins, e.g.:
    #   ALLOWED_ORIGINS=https://myapp.vercel.app,https://myapp.com
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003"

    # App Settings
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    class Config:
        env_file = ".env"

    @property
    def cors_origins(self) -> list[str]:
        """Parse ALLOWED_ORIGINS env var into a list."""
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]


# Create global settings instance
settings = Settings()
