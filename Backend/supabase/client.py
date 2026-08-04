"""
Supabase Client — Thin wrapper for database access.
Creates a fresh client per-request via FastAPI dependency injection.
No module-level client caching to avoid stale connections.
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()


def get_supabase_client() -> Client:
    """
    Creates and returns a Supabase client.
    Uses SUPABASE_URL and SUPABASE_SERVICE_KEY from environment.
    Called per-request — not stored as a module global.
    """
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")

    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment variables.")

    return create_client(url, key)
