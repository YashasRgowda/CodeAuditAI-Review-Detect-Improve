# ============================================================================
# CONFIG.PY — Application Configuration
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

    # Security
    SECRET_KEY: str = "your-super-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # App Settings
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    class Config:
        env_file = ".env"

# Create global settings instance
settings = Settings()
