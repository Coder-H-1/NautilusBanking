"""
Supabase Client — Resilient wrapper for database access.
Creates or returns a Supabase client.
Handles missing environment variables and connection errors gracefully.
"""

import os
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()


def get_supabase_client() -> Optional[Client]:
    """
    Creates and returns a Supabase client.
    Supports SUPABASE_URL, NEXT_PUBLIC_SUPABASE_URL and multiple key aliases.
    Returns None gracefully if credentials are not configured or on connection failure.
    """
    url = (
        os.getenv("SUPABASE_URL")
        or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        or ""
    ).strip()

    key = (
        os.getenv("SUPABASE_SECRET_KEY")
        or os.getenv("SUPABASE_SERVICE_KEY")
        or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_PUBLISHABLE_KEY")
        or os.getenv("SUPABASE_KEY")
        or os.getenv("SUPABASE_ANON_KEY")
        or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
        or ""
    ).strip()

    if not url or not key:
        return None

    try:
        return create_client(url, key)
    except Exception as e:
        print(f"[SUPABASE CLIENT INIT ERROR]: {e}")
        return None
