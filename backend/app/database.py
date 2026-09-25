import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from supabase import Client, create_client

ENV_FILE = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(ENV_FILE, override=True)

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "").strip()


def _require(name: str, value: str) -> str:
    if not value:
        raise RuntimeError(f"{name} is not configured in backend/.env")
    return value


@lru_cache(maxsize=1)
def get_supabase_admin() -> Client:
    return create_client(
        _require("SUPABASE_URL", SUPABASE_URL),
        _require("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY),
    )


def new_supabase_auth_client() -> Client:
    # New client per auth operation so one user's in-memory session is never
    # shared with another request.
    return create_client(
        _require("SUPABASE_URL", SUPABASE_URL),
        _require("SUPABASE_ANON_KEY", SUPABASE_ANON_KEY),
    )
