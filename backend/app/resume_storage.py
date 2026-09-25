import os
from pathlib import Path
from uuid import uuid4

from dotenv import load_dotenv

from .database import get_supabase_admin

ENV_FILE = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(ENV_FILE, override=True)

SUPABASE_RESUME_BUCKET = os.getenv("SUPABASE_RESUME_BUCKET", "resumes").strip()
RESUME_SIGNED_URL_SECONDS = int(os.getenv("RESUME_SIGNED_URL_SECONDS", "900"))


def create_resume_path(candidate_id: str) -> str:
    return f"candidates/{candidate_id}/{uuid4().hex}.pdf"


def _is_external_url(value: str) -> bool:
    return value.startswith("https://") or value.startswith("http://")


def _is_legacy_local(value: str) -> bool:
    return value.startswith("/uploads/")


def upload_resume_bytes(candidate_id: str, content: bytes) -> str:
    path = create_resume_path(candidate_id)
    get_supabase_admin().storage.from_(SUPABASE_RESUME_BUCKET).upload(
        path,
        content,
        file_options={
            "content-type": "application/pdf",
            "cache-control": "3600",
            "upsert": "false",
        },
    )
    return path


def delete_resume_object(storage_path: str | None) -> None:
    if not storage_path or _is_external_url(storage_path) or _is_legacy_local(storage_path):
        return
    get_supabase_admin().storage.from_(SUPABASE_RESUME_BUCKET).remove([storage_path])


def create_resume_signed_url(storage_path: str | None) -> str | None:
    if not storage_path:
        return None
    if _is_external_url(storage_path):
        return storage_path
    if _is_legacy_local(storage_path):
        return None

    result = get_supabase_admin().storage.from_(SUPABASE_RESUME_BUCKET).create_signed_url(
        storage_path,
        RESUME_SIGNED_URL_SECONDS,
    )

    if isinstance(result, dict):
        return result.get("signedURL") or result.get("signedUrl") or result.get("signed_url")

    return getattr(result, "signed_url", None)
