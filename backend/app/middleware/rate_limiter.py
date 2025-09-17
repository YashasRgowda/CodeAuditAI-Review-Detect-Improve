from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import time
from collections import defaultdict

class RateLimiter:
    def __init__(self):
        self.requests = defaultdict(list)
    
    def is_allowed(self, key: str, limit: int = 100, window: int = 3600) -> bool:
        """Check if request is allowed based on rate limit"""
        now = time.time()
        
        # Clean old requests outside the window
        self.requests[key] = [req_time for req_time in self.requests[key] if req_time > now - window]
        
        # Check if limit exceeded
        if len(self.requests[key]) >= limit:
            return False
        
        # Add current request
        self.requests[key].append(now)
        return True

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, calls_per_hour: int = 1000):
        super().__init__(app)
        self.rate_limiter = RateLimiter()
        self.calls_per_hour = calls_per_hour
    
    async def dispatch(self, request: Request, call_next):
        # Get client IP
        client_ip = request.client.host
        
        # Skip rate limiting for health checks
        if request.url.path in ["/", "/health", "/docs"]:
            return await call_next(request)
        
        # Check rate limit
        if not self.rate_limiter.is_allowed(client_ip, self.calls_per_hour, 3600):
            raise HTTPException(
                status_code=429, 
                detail=f"Rate limit exceeded. Maximum {self.calls_per_hour} requests per hour."
            )
        
        response = await call_next(request)
        return response

# Global rate limiter instance
rate_limiter = RateLimiter()