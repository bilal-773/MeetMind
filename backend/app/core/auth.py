"""Auth middleware — verify Supabase JWT."""
from fastapi import Header, HTTPException
from supabase import create_client, Client
from app.config import settings

import time

_supabase_admin: Client = None
_token_cache = {}
CACHE_TTL_SECONDS = 120


def get_supabase_admin() -> Client:
    """Returns a Supabase client using the service/anon key (no user context)."""
    global _supabase_admin
    if _supabase_admin is None:
        key = settings.supabase_service_key or settings.supabase_anon_key
        _supabase_admin = create_client(settings.supabase_url, key)
        # Increase storage client timeout to prevent read timeout on large files
        try:
            _supabase_admin.storage._client.timeout = 180.0
        except Exception:
            pass
    return _supabase_admin


def get_supabase(token: str = None) -> Client:
    """
    Returns a Supabase client.
    If token is provided, creates a user-scoped client with the JWT applied
    to both PostgREST (for RLS) and Storage.
    """
    if token:
        # Create a fresh client for each user-scoped request
        client = create_client(settings.supabase_url, settings.supabase_anon_key)
        # Apply JWT to PostgREST (for database RLS)
        client.postgrest.auth(token)
        # Apply JWT to Storage — supabase-py 2.x uses _storage internally
        try:
            # The storage client uses httpx under the hood; patch its headers
            client.storage._client.headers["Authorization"] = f"Bearer {token}"
            client.storage._client.timeout = 180.0
        except Exception:
            pass
        # Also try setting via session headers attribute for older builds
        try:
            client.storage.session.headers["Authorization"] = f"Bearer {token}"
            client.storage.session.timeout = 180.0
        except Exception:
            pass
        return client

    return get_supabase_admin()



async def verify_token(authorization: str = Header(None)) -> dict:
    """
    FastAPI dependency: verifies Bearer JWT from Supabase Auth.
    Returns the decoded user dict on success.
    Uses in-memory caching to avoid database verification on every request.
    Raises HTTP 401 on failure.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.split(" ", 1)[1]
    
    # Check cache
    now = time.time()
    if token in _token_cache:
        user_dict, expire_time = _token_cache[token]
        if now < expire_time:
            return user_dict
        else:
            del _token_cache[token]

    try:
        supabase = get_supabase_admin()
        response = supabase.auth.get_user(token)
        if not response or not response.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        user_dict = {"id": response.user.id, "email": response.user.email, "token": token}
        _token_cache[token] = (user_dict, now + CACHE_TTL_SECONDS)
        return user_dict
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
