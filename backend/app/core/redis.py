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

import json
import logging

import redis

from app.core.config import settings

logger = logging.getLogger(__name__)

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

# Cache TTLs (seconds)
TTL_COMMIT_DIFF  = 86400   # 24 h  — commit diffs are immutable
TTL_COMMITS_LIST = 300     # 5 min — recent commits list
TTL_PR_LIST      = 180     # 3 min — PR list changes often
TTL_PR_FILES     = 600     # 10 min
TTL_REPO_LIST    = 300     # 5 min — user repo list
TTL_REPO_DETAIL  = 600     # 10 min
TTL_ANALYSIS     = 3600    # 1 h   — analyses are immutable once stored
TTL_ANALYSIS_LIST= 120     # 2 min — list changes when new analysis added
TTL_KB_INFO      = 300     # 5 min — knowledge-base stats


class CacheManager:
    @staticmethod
    def set(key: str, value: str, expire: int = 3600):
        """Set cache value with expiration"""
        try:
            return redis_client.setex(key, expire, value)
        except Exception as e:
            logger.warning(f"Cache SET failed for {key}: {e}")

    @staticmethod
    def get(key: str):
        """Get cache value"""
        try:
            return redis_client.get(key)
        except Exception as e:
            logger.warning(f"Cache GET failed for {key}: {e}")
            return None

    @staticmethod
    def delete(key: str):
        """Delete cache key"""
        try:
            return redis_client.delete(key)
        except Exception as e:
            logger.warning(f"Cache DELETE failed for {key}: {e}")

    @staticmethod
    def delete_pattern(pattern: str):
        """Delete all keys matching a pattern (use sparingly)"""
        try:
            keys = redis_client.keys(pattern)
            if keys:
                redis_client.delete(*keys)
        except Exception as e:
            logger.warning(f"Cache DELETE_PATTERN failed for {pattern}: {e}")

    @staticmethod
    def exists(key: str):
        """Check if key exists"""
        try:
            return redis_client.exists(key)
        except Exception:
            return False

    @staticmethod
    def set_json(key: str, value, expire: int = 3600):
        """Serialize value to JSON and cache it"""
        try:
            redis_client.setex(key, expire, json.dumps(value, default=str))
        except Exception as e:
            logger.warning(f"Cache SET_JSON failed for {key}: {e}")

    @staticmethod
    def get_json(key: str):
        """Get and deserialize a cached JSON value. Returns None on miss/error."""
        try:
            raw = redis_client.get(key)
            return json.loads(raw) if raw else None
        except Exception as e:
            logger.warning(f"Cache GET_JSON failed for {key}: {e}")
            return None
