import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from pathlib import Path

from dotenv import load_dotenv
from fastapi import HTTPException, Request, Response

from .database import get_supabase_admin, new_supabase_auth_client

ENV_FILE = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(ENV_FILE, override=True)

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "").strip().lower()
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")
JWT_SECRET = os.getenv("JWT_SECRET", "")
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
COOKIE_SAMESITE = os.getenv(
    "COOKIE_SAMESITE",
    "none" if COOKIE_SECURE else "lax",
).lower()

if COOKIE_SAMESITE not in {"lax", "strict", "none"}:
    raise RuntimeError("COOKIE_SAMESITE must be lax, strict, or none")
if COOKIE_SAMESITE == "none" and not COOKIE_SECURE:
    # Browsers reject SameSite=None cookies without Secure.
    raise RuntimeError("COOKIE_SAMESITE=none requires COOKIE_SECURE=true")

ADMIN_COOKIE_NAME = "fresherhire_admin"
CANDIDATE_COOKIE_NAME = "fresherhire_candidate"
CANDIDATE_REFRESH_COOKIE_NAME = "fresherhire_candidate_refresh"
RECRUITER_COOKIE_NAME = "fresherhire_recruiter"
RECRUITER_REFRESH_COOKIE_NAME = "fresherhire_recruiter_refresh"


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode().rstrip("=")


def _b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def verify_admin_credentials(email: str, password: str) -> bool:
    if not ADMIN_EMAIL or not ADMIN_PASSWORD:
        raise RuntimeError("ADMIN_EMAIL / ADMIN_PASSWORD are not configured")
    return secrets.compare_digest(email.strip().lower(), ADMIN_EMAIL) and secrets.compare_digest(
        password, ADMIN_PASSWORD
    )


def create_admin_token(email: str) -> str:
    if not JWT_SECRET:
        raise RuntimeError("JWT_SECRET is not configured")
    payload = {
        "email": email.strip().lower(),
        "exp": int(time.time()) + 60 * 60 * 12,
    }
    encoded = _b64encode(json.dumps(payload, separators=(",", ":")).encode())
    signature = hmac.new(JWT_SECRET.encode(), encoded.encode(), hashlib.sha256).digest()
    return f"{encoded}.{_b64encode(signature)}"


def get_current_admin(request: Request) -> str:
    token = request.cookies.get(ADMIN_COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Admin authentication required.")

    try:
        encoded, signature = token.split(".", 1)
        expected = hmac.new(JWT_SECRET.encode(), encoded.encode(), hashlib.sha256).digest()
        if not hmac.compare_digest(_b64decode(signature), expected):
            raise ValueError("bad signature")
        payload = json.loads(_b64decode(encoded))
        if int(payload.get("exp", 0)) < int(time.time()):
            raise ValueError("expired")
        email = str(payload.get("email", "")).lower()
        if not secrets.compare_digest(email, ADMIN_EMAIL):
            raise ValueError("wrong admin")
        return email
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired admin session.")


def _cookie_names(account_type: str) -> tuple[str, str]:
    if account_type == "candidate":
        return CANDIDATE_COOKIE_NAME, CANDIDATE_REFRESH_COOKIE_NAME
    return RECRUITER_COOKIE_NAME, RECRUITER_REFRESH_COOKIE_NAME


def set_supabase_session_cookies(response: Response, account_type: str, session) -> None:
    access_name, refresh_name = _cookie_names(account_type)
    access_token = getattr(session, "access_token", None)
    refresh_token = getattr(session, "refresh_token", None)
    expires_in = int(getattr(session, "expires_in", 3600) or 3600)

    if not access_token or not refresh_token:
        raise HTTPException(status_code=500, detail="Supabase did not return a complete session.")

    common = {
        "httponly": True,
        "secure": COOKIE_SECURE,
        "samesite": COOKIE_SAMESITE,
        "path": "/",
    }
    response.set_cookie(access_name, access_token, max_age=expires_in, **common)
    response.set_cookie(refresh_name, refresh_token, max_age=60 * 60 * 24 * 30, **common)


def clear_supabase_session_cookies(response: Response, account_type: str) -> None:
    access_name, refresh_name = _cookie_names(account_type)
    response.delete_cookie(access_name, path="/")
    response.delete_cookie(refresh_name, path="/")


def _verify_role(user_id: str, account_type: str) -> None:
    db = get_supabase_admin()
    if account_type == "candidate":
        result = (
            db.table("profiles")
            .select("id,user_type")
            .eq("id", user_id)
            .eq("user_type", "fresher")
            .limit(1)
            .execute()
        )
    else:
        result = db.table("companies").select("id").eq("id", user_id).limit(1).execute()

    if not (getattr(result, "data", None) or []):
        raise HTTPException(status_code=403, detail="This account does not have access to this area.")


def _get_current_user_id(
    request: Request,
    response: Response,
    account_type: str,
) -> str:
    access_name, refresh_name = _cookie_names(account_type)
    access_token = request.cookies.get(access_name)
    refresh_token = request.cookies.get(refresh_name)
    user = None

    if access_token:
        try:
            auth_response = get_supabase_admin().auth.get_user(access_token)
            user = getattr(auth_response, "user", None)
        except Exception:
            user = None

    if user is None and refresh_token:
        try:
            client = new_supabase_auth_client()
            refreshed = client.auth.refresh_session(refresh_token)
            session = getattr(refreshed, "session", None)
            user = getattr(refreshed, "user", None) or getattr(session, "user", None)
            if session and user:
                set_supabase_session_cookies(response, account_type, session)
        except Exception:
            user = None

    if user is None:
        raise HTTPException(status_code=401, detail="Authentication required.")

    user_id = str(user.id)
    _verify_role(user_id, account_type)
    return user_id


def get_current_candidate_id(request: Request, response: Response) -> str:
    return _get_current_user_id(request, response, "candidate")


def get_current_recruiter_id(request: Request, response: Response) -> str:
    return _get_current_user_id(request, response, "recruiter")
