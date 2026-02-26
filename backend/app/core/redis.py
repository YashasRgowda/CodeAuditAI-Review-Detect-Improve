# ============================================================================
# CORE/REDIS.PY — Redis Connection & Cache Management
# ============================================================================
# Connects to Redis server for caching and temporary data storage.
# Provides:
#   - redis_client: Global Redis connection instance
#   - test_redis_connection(): Verifies Redis is reachable
#   - CacheManager: Helper class with set/get/delete/exists methods
#     for easy caching with automatic expiration (default: 1 hour)
# ============================================================================

import redis

from app.core.config import settings

# Create Redis client
redis_client = redis.from_url(
    settings.REDIS_URL,
    encoding="utf-8",
    decode_responses=True,
    health_check_interval=30
)

# Test Redis connection
def test_redis_connection():
    try:
        redis_client.ping()
        print("✅ Redis connection successful!")
        return True
    except Exception as e:
        print(f"❌ Redis connection failed: {e}")
        return False

# Cache helper functions
class CacheManager:
    @staticmethod
    def set(key: str, value: str, expire: int = 3600):
        """Set cache value with expiration"""
        return redis_client.setex(key, expire, value)

    @staticmethod
    def get(key: str):
        """Get cache value"""
        return redis_client.get(key)

    @staticmethod
    def delete(key: str):
        """Delete cache key"""
        return redis_client.delete(key)

    @staticmethod
    def exists(key: str):
        """Check if key exists"""
        return redis_client.exists(key)
