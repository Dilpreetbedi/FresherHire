import hashlib
import hmac
import os
import secrets
import smtplib
import time
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage

import httpx

from fastapi import Body, Depends, FastAPI, File, HTTPException, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .auth import (
    ADMIN_COOKIE_NAME,
    COOKIE_SECURE,
    create_admin_token,
    clear_supabase_session_cookies,
    get_current_admin,
    get_current_candidate_id,
    get_current_recruiter_id,
    set_supabase_session_cookies,
    verify_admin_credentials,
)
from .database import get_supabase_admin, new_supabase_auth_client
from .models import NOTIFICATION_COPY_BY_STATUS, NOTIFICATION_TYPE_BY_STATUS
from .resume_storage import create_resume_signed_url, delete_resume_object, upload_resume_bytes
from .schemas import (
    AdminLoginRequest,
    ApplicationStatusUpdate,
    CandidateLoginRequest,
    CandidateProfileUpdate,
    CandidateSignupRequest,
    EducationCreate,
    EducationUpdate,
    EmploymentCreate,
    EmploymentUpdate,
    ForgotPasswordRequest,
    JobApplicationCreate,
    JobCreate,
    JobStatusUpdate,
    JobUpdate,
    RecruiterLeadCreate,
    RecruiterLeadStatusUpdate,
    RecruiterLoginRequest,
    RecruiterPasswordChange,
    ResetPasswordRequest,
    SkillCreate,
    SkillUpdate,
    ProjectCreate,
    ProjectUpdate,
)

app = FastAPI(title="FresherHire API", version="2.0.0")

APP_ENV = os.getenv("APP_ENV", "development").lower()
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
MAX_RESUME_SIZE = 5 * 1024 * 1024
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")

# Current live-mode test pricing from the existing FresherHire routes.
# Razorpay amounts are in paise: 100 paise = ₹1.
RECRUITER_PAYMENT_PLANS = {
    "starter": {
        "amount": 100,
        "name": "Starter",
    },
    "pro": {
        "amount": 100,
        "name": "Pro",
    },
}

allowed_origins = [
    "https://fresherrhiree.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def first_row(result):
    data = getattr(result, "data", None) or []
    return data[0] if data else None


def execute_read_with_retry(operation, attempts: int = 3):
    """
    Retry read-only Supabase/PostgREST operations when the upstream
    connection or Cloudflare edge fails transiently.

    This helper is intentionally used only for SELECT-style reads.
    """
    last_error = None

    for attempt in range(attempts):
        try:
            return operation()
        except Exception as exc:
            last_error = exc

            if attempt >= attempts - 1:
                break

            time.sleep(0.20 * (attempt + 1))

    raise last_error


def fetch_rows_in_batches(
    table_name: str,
    select_fields: str,
    filter_column: str,
    values: list[str],
    batch_size: int = 25,
) -> list[dict]:
    """
    Fetch PostgREST rows using small IN() groups.

    Sending hundreds of UUIDs in one PostgREST query can create a very
    long URL and may be rejected by an upstream proxy/Cloudflare.
    """
    if not values:
        return []

    rows: list[dict] = []

    for start in range(0, len(values), batch_size):
        batch = values[start : start + batch_size]

        result = execute_read_with_retry(
            lambda batch=batch: (
                get_supabase_admin()
                .table(table_name)
                .select(select_fields)
                .in_(filter_column, batch)
                .execute()
            )
        )

        rows.extend(
            getattr(
                result,
                "data",
                None,
            )
            or []
        )

    return rows


def hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def get_profile_row(candidate_id: str) -> dict:
    row = first_row(
        get_supabase_admin()
        .table("profiles")
        .select("*")
        .eq("id", candidate_id)
        .limit(1)
        .execute()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Candidate profile not found.")
    return row


def get_company_row(company_id: str) -> dict:
    row = first_row(
        get_supabase_admin()
        .table("companies")
        .select("*")
        .eq("id", company_id)
        .limit(1)
        .execute()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Company not found.")
    return row


def recruiter_has_paid_access(company: dict) -> bool:
    plan = str(
        company.get("subscription_plan")
        or "free"
    ).lower()

    status = str(
        company.get("subscription_status")
        or "inactive"
    ).lower()

    if plan not in {"starter", "pro"}:
        return False

    if status != "active":
        return False

    expires_at = company.get(
        "subscription_expires_at"
    )

    if not expires_at:
        return False

    try:
        if isinstance(
            expires_at,
            datetime,
        ):
            expiry = expires_at
        else:
            expiry = datetime.fromisoformat(
                str(expires_at).replace(
                    "Z",
                    "+00:00",
                )
            )

        if expiry.tzinfo is None:
            expiry = expiry.replace(
                tzinfo=timezone.utc
            )

        return (
            expiry
            > datetime.now(
                timezone.utc
            )
        )
    except (
        TypeError,
        ValueError,
    ):
        return False


def normalize_skills(value: str | None) -> list[str]:
    if not value:
        return []
    cleaned = value.replace("\n", ",").replace(";", ",")
    output: list[str] = []
    seen: set[str] = set()
    for part in cleaned.split(","):
        skill = part.strip()
        key = skill.lower()
        if skill and key not in seen:
            output.append(skill)
            seen.add(key)
    return output


def salary_display(job: dict) -> str | None:
    if job.get("salary_text"):
        return job["salary_text"]
    salary_min = job.get("salary_min")
    salary_max = job.get("salary_max")
    if salary_min is not None and salary_max is not None:
        return f"{salary_min} - {salary_max}"
    if salary_min is not None:
        return f"From {salary_min}"
    if salary_max is not None:
        return f"Up to {salary_max}"
    return None


def serialize_job(job: dict, company: dict | None = None) -> dict:
    payload = {
        "id": job["id"],
        "title": job.get("title"),
        "description": job.get("description"),
        "skills": ", ".join(job.get("required_skills") or []),
        "location": job.get("location") or "",
        "employment_type": job.get("job_type") or "Full-time",
        "workplace_type": job.get("workplace_type") or "On-site",
        "openings": job.get("openings") or 1,
        "experience": job.get("experience_level") or "Fresher",
        "salary": salary_display(job),
        "eligibility": job.get("eligibility"),
        "status": "published" if job.get("is_active") else "closed",
        "created_at": job.get("created_at"),
    }
    if company is not None:
        payload["company"] = {
            "id": company.get("id"),
            "name": company.get("company_name"),
            "website": company.get("website"),
            "location": company.get("location"),
            "company_size": company.get("company_size"),
            "company_type": company.get("company_type"),
            "is_verified": bool(company.get("is_verified", True)),
        }
    return payload


def clean_optional_text(value):
    if value is None:
        return None
    if isinstance(value, str):
        value = value.strip()
        return value or None
    return value


def get_candidate_structured_sections(candidate_id: str) -> dict:
    db = get_supabase_admin()

    skill_rows = getattr(
        db.table("skills")
        .select("*")
        .eq("user_id", candidate_id)
        .order("id")
        .execute(),
        "data",
        None,
    ) or []

    education_rows = getattr(
        db.table("education_details")
        .select("*")
        .eq("user_id", candidate_id)
        .order("start_year", desc=True)
        .execute(),
        "data",
        None,
    ) or []

    employment_rows = getattr(
        db.table("employment_details")
        .select("*")
        .eq("user_id", candidate_id)
        .order("start_date", desc=True)
        .execute(),
        "data",
        None,
    ) or []

    project_rows = getattr(
        db.table("projects")
        .select("*")
        .eq("user_id", candidate_id)
        .order("created_at", desc=True)
        .execute(),
        "data",
        None,
    ) or []

    assessment_rows = getattr(
        db.table("assessment_results")
        .select("id,user_id,skill_name,score,total_questions,percentage,created_at")
        .eq("user_id", candidate_id)
        .order("created_at", desc=True)
        .execute(),
        "data",
        None,
    ) or []

    best_assessments_by_skill: dict[str, dict] = {}
    for row in assessment_rows:
        skill_name = str(row.get("skill_name") or "").strip()
        if not skill_name:
            continue
        key = skill_name.lower()
        existing = best_assessments_by_skill.get(key)
        if not existing or float(row.get("percentage") or 0) > float(existing.get("percentage") or 0):
            best_assessments_by_skill[key] = row

    best_assessment_rows = sorted(
        best_assessments_by_skill.values(),
        key=lambda row: float(row.get("percentage") or 0),
        reverse=True,
    )

    internships = [
        row
        for row in employment_rows
        if row.get("employment_type") in {"internship", "apprenticeship"}
    ]

    experience = [
        row
        for row in employment_rows
        if row.get("employment_type") not in {"internship", "apprenticeship"}
    ]

    return {
        "skill_items": skill_rows,
        "education_items": education_rows,
        "employment_items": employment_rows,
        "experience_items": experience,
        "internship_items": internships,
        "project_items": project_rows,
        "assessment_items": assessment_rows,
        "best_assessment_items": best_assessment_rows,
    }


def get_candidate_sections(candidate_id: str, profile: dict | None = None) -> dict:
    structured = get_candidate_structured_sections(candidate_id)

    skills = ", ".join(
        row.get("skill_name", "")
        for row in structured["skill_items"]
        if row.get("skill_name")
    ) or None

    education_parts: list[str] = []
    for row in structured["education_items"]:
        course = row.get("degree_or_course") or row.get("education_level") or "Education"
        institution = row.get("institution_name") or ""
        years = ""
        if row.get("start_year") or row.get("end_year"):
            years = f" ({row.get('start_year') or ''}-{row.get('end_year') or 'Present'})"
        education_parts.append(f"{course} - {institution}{years}".strip())

    internship_parts = [
        f"{row.get('role_title') or 'Intern'} at {row.get('company_name') or ''}".strip()
        for row in structured["internship_items"]
    ]

    experience_parts = [
        f"{row.get('role_title') or 'Role'} at {row.get('company_name') or ''}".strip()
        for row in structured["experience_items"]
    ]

    project_parts: list[str] = []
    for row in structured["project_items"]:
        text = row.get("title") or "Project"
        if row.get("description"):
            text += f": {row['description']}"
        project_parts.append(text)

    return {
        "skills": skills,
        "education": "\n".join(education_parts) or None,
        "internships": "\n".join(internship_parts) or None,
        "projects": "\n".join(project_parts) or None,
        "experience": "\n".join(experience_parts) or None,
        **structured,
    }


def get_candidate_payload(candidate_id: str, include_signed_resume: bool = True) -> dict:
    profile = get_profile_row(candidate_id)
    sections = get_candidate_sections(candidate_id, profile)
    resume_value = profile.get("resume_url")
    signed_resume = None

    if include_signed_resume and resume_value:
        try:
            signed_resume = create_resume_signed_url(resume_value)
        except Exception as exc:
            print("SIGNED RESUME URL ERROR:", exc)

    completion_checks = [
        bool(profile.get("full_name")),
        bool(profile.get("email")),
        bool(profile.get("resume_headline") or profile.get("preferred_role")),
        bool(profile.get("location")),
        bool(profile.get("graduation_year")),
        bool(profile.get("degree")),
        bool(sections.get("skill_items")),
        bool(sections.get("education_items")),
        bool(sections.get("employment_items")),
        bool(sections.get("project_items")),
        bool(sections.get("best_assessment_items")),
        bool(profile.get("bio")),
        bool(profile.get("linkedin_url") or profile.get("github_url") or profile.get("portfolio_url")),
        bool(resume_value),
    ]
    completion = round(sum(completion_checks) / len(completion_checks) * 100)

    return {
        "id": profile.get("id"),
        "full_name": profile.get("full_name"),
        "email": profile.get("email"),
        "phone": profile.get("phone_number"),
        "headline": profile.get("resume_headline") or profile.get("preferred_role"),
        "location": profile.get("location"),
        "graduation_year": profile.get("graduation_year"),
        "degree": profile.get("degree"),
        "skills": sections.get("skills"),
        "education": sections.get("education"),
        "internships": sections.get("internships"),
        "projects": sections.get("projects"),
        "experience": sections.get("experience"),
        "skill_items": sections.get("skill_items", []),
        "education_items": sections.get("education_items", []),
        "employment_items": sections.get("employment_items", []),
        "experience_items": sections.get("experience_items", []),
        "internship_items": sections.get("internship_items", []),
        "project_items": sections.get("project_items", []),
        "assessment_items": sections.get("assessment_items", []),
        "best_assessment_items": sections.get("best_assessment_items", []),
        "bio": profile.get("bio"),
        "linkedin_url": profile.get("linkedin_url"),
        "github_url": profile.get("github_url"),
        "portfolio_url": profile.get("portfolio_url"),
        "resume_url": signed_resume if include_signed_resume else resume_value,
        "profile_completion": completion,
        "created_at": profile.get("created_at"),
    }


def send_password_reset_email(email: str, reset_url: str) -> bool:
    if not SMTP_HOST or not SMTP_FROM_EMAIL:
        return False
    try:
        message = EmailMessage()
        message["Subject"] = "Reset your FresherHire password"
        message["From"] = SMTP_FROM_EMAIL
        message["To"] = email
        message.set_content(
            f"""Hello,

We received a request to reset your FresherHire password.

Open this link:
{reset_url}

This link expires in 30 minutes and can only be used once.

If you did not request this reset, you can ignore this email.

FresherHire"""
        )
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            if SMTP_USE_TLS:
                server.starttls()
            if SMTP_USERNAME and SMTP_PASSWORD:
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(message)
        return True
    except Exception as exc:
        print("PASSWORD RESET EMAIL ERROR:", exc)
        return False


def create_application_notification(application: dict, job: dict, company: dict, status: str) -> None:
    notification_type = NOTIFICATION_TYPE_BY_STATUS.get(status)
    copy = NOTIFICATION_COPY_BY_STATUS.get(status)
    if not notification_type or not copy:
        return
    title, message_template = copy
    get_supabase_admin().table("notifications").insert(
        {
            "user_id": application["candidate_id"],
            "type": notification_type,
            "title": title,
            "message": message_template.format(
                company=company.get("company_name") or "The company",
                job=job.get("title") or "the role",
            ),
            "link": "/candidate/applications",
            "is_read": False,
            "application_id": application["id"],
        }
    ).execute()


@app.get("/")
def root():
    return {"message": "FresherHire API is running"}


@app.get("/health")
def health():
    return {"status": "ok", "database": "supabase"}


# =========================================================
# PASSWORD RESET
# =========================================================

@app.post("/api/auth/forgot-password")
def forgot_password(data: ForgotPasswordRequest):
    db = get_supabase_admin()
    email = str(data.email).strip().lower()
    if data.account_type == "candidate":
        user_row = first_row(
            db.table("profiles").select("id,email").eq("email", email).eq("user_type", "fresher").limit(1).execute()
        )
    else:
        user_row = first_row(db.table("companies").select("id,email").eq("email", email).limit(1).execute())

    generic = "If an account exists for this email, password reset instructions have been sent."
    if not user_row:
        return {"success": True, "message": generic}

    now = now_iso()
    db.table("password_reset_tokens").update({"used_at": now}).eq("user_type", data.account_type).eq(
        "user_id", user_row["id"]
    ).is_("used_at", "null").execute()

    raw_token = secrets.token_urlsafe(32)
    db.table("password_reset_tokens").insert(
        {
            "user_type": data.account_type,
            "user_id": user_row["id"],
            "token_hash": hash_reset_token(raw_token),
            "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat(),
        }
    ).execute()

    reset_url = f"{FRONTEND_URL}/reset-password?token={raw_token}&type={data.account_type}"
    email_sent = send_password_reset_email(email, reset_url)
    result = {"success": True, "message": generic}
    if APP_ENV != "production" and not email_sent:
        result["dev_reset_url"] = reset_url
        print("FresherHire password reset link:", reset_url)
    return result


@app.post("/api/auth/reset-password")
def reset_password(data: ResetPasswordRequest):
    db = get_supabase_admin()
    row = first_row(
        db.table("password_reset_tokens")
        .select("*")
        .eq("token_hash", hash_reset_token(data.token))
        .eq("user_type", data.account_type)
        .is_("used_at", "null")
        .limit(1)
        .execute()
    )
    if not row:
        raise HTTPException(status_code=400, detail="This password reset link is invalid or has already been used.")

    expires_at = datetime.fromisoformat(str(row["expires_at"]).replace("Z", "+00:00"))
    if expires_at < datetime.now(timezone.utc):
        db.table("password_reset_tokens").update({"used_at": now_iso()}).eq("id", row["id"]).execute()
        raise HTTPException(status_code=400, detail="This password reset link has expired.")

    attributes = {"password": data.new_password}
    if data.account_type == "recruiter":
        try:
            auth_user = get_supabase_admin().auth.admin.get_user_by_id(str(row["user_id"]))
            metadata = dict(getattr(getattr(auth_user, "user", None), "user_metadata", None) or {})
            metadata["must_change_password"] = False
            attributes["user_metadata"] = metadata
        except Exception:
            pass

    get_supabase_admin().auth.admin.update_user_by_id(str(row["user_id"]), attributes)
    now = now_iso()
    db.table("password_reset_tokens").update({"used_at": now}).eq("user_type", data.account_type).eq(
        "user_id", row["user_id"]
    ).is_("used_at", "null").execute()
    return {"success": True, "message": "Password reset successfully."}


# =========================================================
# ADMIN
# =========================================================

@app.post("/api/admin/login")
def admin_login(credentials: AdminLoginRequest, response: Response):
    if not verify_admin_credentials(str(credentials.email), credentials.password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    response.set_cookie(
        ADMIN_COOKIE_NAME,
        create_admin_token(str(credentials.email)),
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="none" if COOKIE_SECURE else "lax",
        max_age=60 * 60 * 12,
        path="/",
    )
    return {"success": True, "message": "Admin login successful."}


@app.post("/api/admin/logout")
def admin_logout(response: Response):
    response.delete_cookie(ADMIN_COOKIE_NAME, path="/")
    return {"success": True}


@app.get("/api/admin/me")
def admin_me(admin_email: str = Depends(get_current_admin)):
    return {"authenticated": True, "email": admin_email, "role": "admin"}


# =========================================================
# RECRUITER LEADS
# =========================================================

@app.post("/api/recruiter-leads")
def create_recruiter_lead(lead: RecruiterLeadCreate):
    payload = {
        "full_name": lead.full_name.strip(),
        "work_email": str(lead.work_email).strip().lower(),
        "phone": lead.phone.strip(),
        "designation": lead.designation.strip(),
        "company_name": lead.company_name.strip(),
        "company_website": lead.company_website.strip() if lead.company_website else None,
        "company_size": lead.company_size.strip(),
        "company_type": lead.company_type.strip(),
        "roles": lead.roles.strip(),
        "openings": lead.openings,
        "location": lead.location.strip(),
        "job_type": lead.job_type.strip(),
        "experience": lead.experience.strip(),
        "skills": lead.skills.strip() if lead.skills else None,
        "requirements": lead.requirements.strip() if lead.requirements else None,
        "status": "new",
    }
    row = first_row(get_supabase_admin().table("recruiter_leads").insert(payload).execute())
    return {"success": True, "message": "Hiring requirement submitted successfully.", "lead_id": row["id"]}


@app.get("/api/recruiter-leads")
def get_recruiter_leads(_admin: str = Depends(get_current_admin)):
    return getattr(
        get_supabase_admin().table("recruiter_leads").select("*").order("created_at", desc=True).execute(),
        "data",
        None,
    ) or []


@app.get("/api/recruiter-leads/{lead_id}")
def get_recruiter_lead(lead_id: int, _admin: str = Depends(get_current_admin)):
    row = first_row(get_supabase_admin().table("recruiter_leads").select("*").eq("id", lead_id).limit(1).execute())
    if not row:
        raise HTTPException(status_code=404, detail="Recruiter lead not found.")
    return row


@app.patch("/api/recruiter-leads/{lead_id}/status")
def update_recruiter_lead_status(
    lead_id: int,
    status_data: RecruiterLeadStatusUpdate,
    _admin: str = Depends(get_current_admin),
):
    db = get_supabase_admin()
    lead = first_row(db.table("recruiter_leads").select("*").eq("id", lead_id).limit(1).execute())
    if not lead:
        raise HTTPException(status_code=404, detail="Recruiter lead not found.")

    temporary_password = None
    recruiter_created = False
    account_already_exists = False

    if status_data.status == "approved":
        existing = first_row(db.table("companies").select("id,email").eq("email", lead["work_email"]).limit(1).execute())
        if existing:
            account_already_exists = True
        else:
            temporary_password = secrets.token_urlsafe(10)
            created_user_id = None
            try:
                auth_response = db.auth.admin.create_user(
                    {
                        "email": lead["work_email"],
                        "password": temporary_password,
                        "email_confirm": True,
                        "user_metadata": {
                            "role": "recruiter",
                            "full_name": lead["full_name"],
                            "designation": lead.get("designation"),
                            "phone": lead.get("phone"),
                            "must_change_password": True,
                        },
                    }
                )
                user = getattr(auth_response, "user", None)
                if not user:
                    raise RuntimeError("Supabase Auth did not return a user.")
                created_user_id = str(user.id)

                db.table("profiles").upsert(
                    {
                        "id": created_user_id,
                        "full_name": lead["full_name"],
                        "email": lead["work_email"],
                        "user_type": "company",
                        "location": lead.get("location"),
                        "preferred_role": lead.get("designation"),
                    },
                    on_conflict="id",
                ).execute()

                db.table("companies").insert(
                    {
                        "id": created_user_id,
                        "company_name": lead["company_name"],
                        "email": lead["work_email"],
                        "website": lead.get("company_website"),
                        "location": lead.get("location"),
                        "company_size": lead.get("company_size"),
                        "company_type": lead.get("company_type"),
                        "is_verified": True,
                    }
                ).execute()
                recruiter_created = True
            except Exception as exc:
                if created_user_id:
                    try:
                        db.auth.admin.delete_user(created_user_id)
                    except Exception:
                        pass
                raise HTTPException(status_code=500, detail=f"Unable to create recruiter account: {exc}")

    db.table("recruiter_leads").update({"status": status_data.status}).eq("id", lead_id).execute()
    result = {
        "success": True,
        "message": "Lead status updated successfully.",
        "lead_id": lead_id,
        "status": status_data.status,
        "recruiter_created": recruiter_created,
        "account_already_exists": account_already_exists,
    }
    if temporary_password:
        result["recruiter_email"] = lead["work_email"]
        result["temporary_password"] = temporary_password
    return result


# =========================================================
# RECRUITER AUTH
# =========================================================

@app.post("/api/recruiter/login")
def recruiter_login(credentials: RecruiterLoginRequest, response: Response):
    try:
        auth_response = new_supabase_auth_client().auth.sign_in_with_password(
            {"email": str(credentials.email).strip().lower(), "password": credentials.password}
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    user = getattr(auth_response, "user", None)
    session = getattr(auth_response, "session", None)
    if not user or not session:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    company = first_row(get_supabase_admin().table("companies").select("id").eq("id", str(user.id)).limit(1).execute())
    if not company:
        raise HTTPException(status_code=403, detail="This account is not an approved recruiter account.")

    set_supabase_session_cookies(response, "recruiter", session)
    metadata = dict(getattr(user, "user_metadata", None) or {})
    return {
        "success": True,
        "message": "Recruiter login successful.",
        "must_change_password": bool(metadata.get("must_change_password", False)),
    }


@app.post("/api/recruiter/logout")
def recruiter_logout(response: Response):
    clear_supabase_session_cookies(response, "recruiter")
    return {"success": True}


@app.get("/api/recruiter/me")
def recruiter_me(
    recruiter_id: str = Depends(
        get_current_recruiter_id
    ),
):
    company = get_company_row(
        recruiter_id
    )

    auth_response = (
        get_supabase_admin()
        .auth.admin.get_user_by_id(
            recruiter_id
        )
    )

    user = getattr(
        auth_response,
        "user",
        None,
    )

    metadata = (
        dict(
            getattr(
                user,
                "user_metadata",
                None,
            )
            or {}
        )
        if user
        else {}
    )

    paid_access = (
        recruiter_has_paid_access(
            company
        )
    )

    return {
        "id": recruiter_id,
        "full_name": (
            metadata.get("full_name")
            or company.get(
                "company_name"
            )
        ),
        "email": company.get(
            "email"
        ),
        "phone": metadata.get(
            "phone"
        ),
        "designation": metadata.get(
            "designation"
        ),
        "must_change_password": bool(
            metadata.get(
                "must_change_password",
                False,
            )
        ),
        "company": {
            "id": company.get("id"),
            "name": company.get(
                "company_name"
            ),
            "website": company.get(
                "website"
            ),
            "company_size": company.get(
                "company_size"
            ),
            "company_type": company.get(
                "company_type"
            ),
            "location": company.get(
                "location"
            ),
            "is_verified": bool(
                company.get(
                    "is_verified",
                    True,
                )
            ),
            "subscription_plan": (
                company.get(
                    "subscription_plan"
                )
                or "free"
            ),
            "subscription_status": (
                company.get(
                    "subscription_status"
                )
                or "inactive"
            ),
            "subscription_expires_at": (
                company.get(
                    "subscription_expires_at"
                )
            ),
            "contact_access": (
                paid_access
            ),
        },
    }


@app.post("/api/recruiter/change-password")
def recruiter_change_password(data: RecruiterPasswordChange, recruiter_id: str = Depends(get_current_recruiter_id)):
    company = get_company_row(recruiter_id)
    try:
        new_supabase_auth_client().auth.sign_in_with_password(
            {"email": company["email"], "password": data.current_password}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Current password is incorrect.")

    auth_response = get_supabase_admin().auth.admin.get_user_by_id(recruiter_id)
    user = getattr(auth_response, "user", None)
    metadata = dict(getattr(user, "user_metadata", None) or {}) if user else {}
    metadata["must_change_password"] = False
    get_supabase_admin().auth.admin.update_user_by_id(
        recruiter_id,
        {"password": data.new_password, "user_metadata": metadata},
    )
    return {"success": True, "message": "Password changed successfully."}


# =========================================================
# RECRUITER PAYMENTS
# =========================================================

@app.post(
    "/api/recruiter/payments/create-order"
)
def create_recruiter_payment_order(
    data: dict = Body(...),
    recruiter_id: str = Depends(
        get_current_recruiter_id
    ),
):
    if (
        not RAZORPAY_KEY_ID
        or not RAZORPAY_KEY_SECRET
    ):
        raise HTTPException(
            status_code=500,
            detail=(
                "Razorpay is not configured "
                "on the FastAPI backend."
            ),
        )

    requested_plan = str(
        data.get("plan") or ""
    ).strip().lower()

    if (
        requested_plan
        not in RECRUITER_PAYMENT_PLANS
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid recruiter plan."
            ),
        )

    company = get_company_row(
        recruiter_id
    )

    selected_plan = (
        RECRUITER_PAYMENT_PLANS[
            requested_plan
        ]
    )

    receipt = (
        f"fh_{int(datetime.now(timezone.utc).timestamp() * 1000)}_"
        f"{recruiter_id[:6]}"
    )[:40]

    order_payload = {
        "amount": selected_plan[
            "amount"
        ],
        "currency": "INR",
        "receipt": receipt,
        "notes": {
            "company_id": recruiter_id,
            "plan": requested_plan,
            "plan_name": (
                selected_plan["name"]
            ),
        },
    }

    try:
        with httpx.Client(
            timeout=20.0,
        ) as client:
            response = client.post(
                (
                    "https://api.razorpay.com"
                    "/v1/orders"
                ),
                auth=(
                    RAZORPAY_KEY_ID,
                    RAZORPAY_KEY_SECRET,
                ),
                json=order_payload,
            )

        if response.status_code >= 400:
            print(
                "RAZORPAY CREATE ORDER ERROR:",
                response.status_code,
                response.text,
            )
            raise HTTPException(
                status_code=502,
                detail=(
                    "Could not create "
                    "Razorpay order."
                ),
            )

        order = response.json()

        return {
            "orderId": order.get("id"),
            "amount": order.get(
                "amount"
            ),
            "currency": order.get(
                "currency"
            ),
            "plan": requested_plan,
            "planName": (
                selected_plan["name"]
            ),
            "keyId": RAZORPAY_KEY_ID,
            "companyName": (
                company.get(
                    "company_name"
                )
                or ""
            ),
            "companyEmail": (
                company.get("email")
                or ""
            ),
        }

    except HTTPException:
        raise
    except Exception as exc:
        print(
            "RAZORPAY CREATE ORDER ERROR:",
            exc,
        )
        raise HTTPException(
            status_code=502,
            detail=(
                "Could not create "
                "Razorpay order."
            ),
        )


@app.post(
    "/api/recruiter/payments/verify"
)
def verify_recruiter_payment(
    data: dict = Body(...),
    recruiter_id: str = Depends(
        get_current_recruiter_id
    ),
):
    if (
        not RAZORPAY_KEY_ID
        or not RAZORPAY_KEY_SECRET
    ):
        raise HTTPException(
            status_code=500,
            detail=(
                "Razorpay is not configured "
                "on the FastAPI backend."
            ),
        )

    razorpay_order_id = str(
        data.get(
            "razorpay_order_id"
        )
        or ""
    ).strip()

    razorpay_payment_id = str(
        data.get(
            "razorpay_payment_id"
        )
        or ""
    ).strip()

    razorpay_signature = str(
        data.get(
            "razorpay_signature"
        )
        or ""
    ).strip()

    if (
        not razorpay_order_id
        or not razorpay_payment_id
        or not razorpay_signature
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Missing Razorpay payment "
                "verification fields."
            ),
        )

    expected_signature = hmac.new(
        RAZORPAY_KEY_SECRET.encode(
            "utf-8"
        ),
        (
            f"{razorpay_order_id}|"
            f"{razorpay_payment_id}"
        ).encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(
        expected_signature,
        razorpay_signature,
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid Razorpay "
                "payment signature."
            ),
        )

    try:
        with httpx.Client(
            timeout=20.0,
        ) as client:
            order_response = client.get(
                (
                    "https://api.razorpay.com"
                    f"/v1/orders/"
                    f"{razorpay_order_id}"
                ),
                auth=(
                    RAZORPAY_KEY_ID,
                    RAZORPAY_KEY_SECRET,
                ),
            )

            payment_response = client.get(
                (
                    "https://api.razorpay.com"
                    f"/v1/payments/"
                    f"{razorpay_payment_id}"
                ),
                auth=(
                    RAZORPAY_KEY_ID,
                    RAZORPAY_KEY_SECRET,
                ),
            )

        if (
            order_response.status_code
            >= 400
            or payment_response.status_code
            >= 400
        ):
            print(
                "RAZORPAY VERIFY FETCH ERROR:",
                order_response.status_code,
                payment_response.status_code,
            )
            raise HTTPException(
                status_code=502,
                detail=(
                    "Could not verify payment "
                    "with Razorpay."
                ),
            )

        order = order_response.json()
        payment = (
            payment_response.json()
        )

    except HTTPException:
        raise
    except Exception as exc:
        print(
            "RAZORPAY VERIFY FETCH ERROR:",
            exc,
        )
        raise HTTPException(
            status_code=502,
            detail=(
                "Could not verify payment "
                "with Razorpay."
            ),
        )

    if (
        payment.get("order_id")
        != razorpay_order_id
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Payment does not belong "
                "to this order."
            ),
        )

    notes = order.get("notes") or {}

    company_id = str(
        notes.get("company_id")
        or ""
    )

    plan = str(
        notes.get("plan")
        or ""
    ).lower()

    if company_id != recruiter_id:
        raise HTTPException(
            status_code=403,
            detail=(
                "This Razorpay order "
                "belongs to another "
                "recruiter account."
            ),
        )

    if (
        plan
        not in RECRUITER_PAYMENT_PLANS
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid plan stored "
                "on Razorpay order."
            ),
        )

    selected_plan = (
        RECRUITER_PAYMENT_PLANS[
            plan
        ]
    )

    if (
        int(order.get("amount") or 0)
        != selected_plan["amount"]
        or int(
            payment.get("amount") or 0
        )
        != selected_plan["amount"]
        or order.get("currency")
        != "INR"
        or payment.get("currency")
        != "INR"
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Payment amount or currency "
                "does not match the "
                "selected plan."
            ),
        )

    payment_status = str(
        payment.get("status")
        or ""
    )

    if payment_status != "captured":
        return {
            "verified": True,
            "captured": False,
            "paymentStatus": (
                payment_status
            ),
            "plan": plan,
            "message": (
                "Payment is authentic but "
                "has not been captured yet."
            ),
        }

    # Subscription activation remains handled by the
    # existing Razorpay payment.captured webhook.
    return {
        "verified": True,
        "captured": True,
        "paymentStatus": (
            payment_status
        ),
        "paymentId": (
            razorpay_payment_id
        ),
        "orderId": razorpay_order_id,
        "plan": plan,
        "planName": (
            selected_plan["name"]
        ),
        "amount": (
            selected_plan["amount"]
        ),
        "message": (
            "Payment verified successfully. "
            "Subscription activation will be "
            "confirmed by the existing "
            "Razorpay webhook."
        ),
    }


# =========================================================
# RECRUITER DASHBOARD SUMMARY
# =========================================================

@app.get("/api/recruiter/dashboard-summary")
def get_recruiter_dashboard_summary(
    recruiter_id: str = Depends(get_current_recruiter_id),
):
    db = get_supabase_admin()

    # -----------------------------------------------------
    # COMPANY / RECRUITER
    # -----------------------------------------------------
    company_result = execute_read_with_retry(
        lambda: (
            get_supabase_admin()
            .table("companies")
            .select("*")
            .eq("id", recruiter_id)
            .limit(1)
            .execute()
        )
    )

    company = first_row(company_result)

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Recruiter company profile not found.",
        )

    recruiter_profile = None

    try:
        recruiter_profile_result = execute_read_with_retry(
            lambda: (
                get_supabase_admin()
                .table("profiles")
                .select(
                    "id,full_name,email,phone_number,"
                    "preferred_role"
                )
                .eq("id", recruiter_id)
                .limit(1)
                .execute()
            )
        )
        recruiter_profile = first_row(
            recruiter_profile_result
        )
    except Exception as exc:
        print(
            "DASHBOARD RECRUITER PROFILE WARNING:",
            exc,
        )

    metadata = {}

    # Auth metadata is useful for designation / must-change-password,
    # but a temporary GoTrue failure should not make the whole
    # recruiter dashboard unusable.
    try:
        auth_response = db.auth.admin.get_user_by_id(
            recruiter_id
        )
        user = getattr(
            auth_response,
            "user",
            None,
        )
        metadata = (
            dict(
                getattr(
                    user,
                    "user_metadata",
                    None,
                )
                or {}
            )
            if user
            else {}
        )
    except Exception as exc:
        print(
            "DASHBOARD AUTH METADATA WARNING:",
            exc,
        )

    recruiter = {
        "id": recruiter_id,
        "full_name": (
            metadata.get("full_name")
            or (
                recruiter_profile.get("full_name")
                if recruiter_profile
                else None
            )
            or company.get("company_name")
        ),
        "email": (
            company.get("email")
            or (
                recruiter_profile.get("email")
                if recruiter_profile
                else None
            )
        ),
        "phone": (
            metadata.get("phone")
            or (
                recruiter_profile.get("phone_number")
                if recruiter_profile
                else None
            )
        ),
        "designation": (
            metadata.get("designation")
            or (
                recruiter_profile.get("preferred_role")
                if recruiter_profile
                else None
            )
        ),
        "must_change_password": bool(
            metadata.get(
                "must_change_password",
                False,
            )
        ),
        "company": {
            "id": company.get("id"),
            "name": company.get("company_name"),
            "website": company.get("website"),
            "company_size": company.get("company_size"),
            "company_type": company.get("company_type"),
            "location": company.get("location"),
            "is_verified": bool(
                company.get(
                    "is_verified",
                    True,
                )
            ),
        },
    }

    # -----------------------------------------------------
    # TOTAL REGISTERED CANDIDATES
    # -----------------------------------------------------
    candidate_rows = []

    try:
        candidate_result = execute_read_with_retry(
            lambda: (
                get_supabase_admin()
                .table("profiles")
                .select("id")
                .eq("user_type", "fresher")
                .execute()
            )
        )
        candidate_rows = getattr(
            candidate_result,
            "data",
            None,
        ) or []
    except Exception as exc:
        print(
            "DASHBOARD CANDIDATE COUNT WARNING:",
            exc,
        )

    # -----------------------------------------------------
    # RECRUITER JOBS
    # -----------------------------------------------------
    jobs = []

    try:
        jobs_result = execute_read_with_retry(
            lambda: (
                get_supabase_admin()
                .table("jobs")
                .select("*")
                .eq(
                    "company_id",
                    recruiter_id,
                )
                .order(
                    "created_at",
                    desc=True,
                )
                .execute()
            )
        )
        jobs = getattr(
            jobs_result,
            "data",
            None,
        ) or []
    except Exception as exc:
        print(
            "DASHBOARD JOBS WARNING:",
            exc,
        )

    job_ids = [
        int(job["id"])
        for job in jobs
        if job.get("id") is not None
    ]

    # -----------------------------------------------------
    # APPLICATIONS
    # -----------------------------------------------------
    applications = []

    if job_ids:
        try:
            app_result = execute_read_with_retry(
                lambda: (
                    get_supabase_admin()
                    .table("applications")
                    .select("*")
                    .in_(
                        "job_id",
                        job_ids,
                    )
                    .neq(
                        "status",
                        "withdrawn",
                    )
                    .order(
                        "created_at",
                        desc=True,
                    )
                    .execute()
                )
            )
            applications = getattr(
                app_result,
                "data",
                None,
            ) or []
        except Exception as exc:
            print(
                "DASHBOARD APPLICATIONS WARNING:",
                exc,
            )

    applications_by_job: dict[int, int] = {}

    for application in applications:
        job_id = int(
            application["job_id"]
        )
        applications_by_job[
            job_id
        ] = (
            applications_by_job.get(
                job_id,
                0,
            )
            + 1
        )

    serialized_jobs = []
    job_title_by_id: dict[int, str] = {}

    for job in jobs:
        job_id = int(job["id"])
        item = serialize_job(job)
        item["application_count"] = (
            applications_by_job.get(
                job_id,
                0,
            )
        )
        serialized_jobs.append(item)
        job_title_by_id[job_id] = (
            job.get("title")
            or "Job"
        )

    # -----------------------------------------------------
    # RECENT APPLICANT PROFILE SUMMARIES
    # -----------------------------------------------------
    recent_candidate_ids = list(
        dict.fromkeys(
            str(
                application.get(
                    "candidate_id"
                )
            )
            for application in applications[:8]
            if application.get(
                "candidate_id"
            )
        )
    )

    profile_by_id: dict[str, dict] = {}

    if recent_candidate_ids:
        try:
            recent_profile_rows = (
                fetch_rows_in_batches(
                    "profiles",
                    (
                        "id,full_name,resume_headline,"
                        "preferred_role,location,degree,"
                        "graduation_year"
                    ),
                    "id",
                    recent_candidate_ids,
                    batch_size=20,
                )
            )

            profile_by_id = {
                str(row["id"]): row
                for row in recent_profile_rows
            }
        except Exception as exc:
            print(
                "DASHBOARD RECENT PROFILE WARNING:",
                exc,
            )

    recent_applications = []

    for application in applications[:8]:
        candidate_id = str(
            application.get(
                "candidate_id"
            )
            or ""
        )

        profile = profile_by_id.get(
            candidate_id,
            {},
        )

        job_id = int(
            application["job_id"]
        )

        recent_applications.append(
            {
                "id": application["id"],
                "status": application.get(
                    "status"
                ),
                "cover_letter": application.get(
                    "cover_letter"
                ),
                "applied_at": application.get(
                    "created_at"
                ),
                "job_id": job_id,
                "job_title": (
                    job_title_by_id.get(
                        job_id,
                        "Job",
                    )
                ),
                "candidate": {
                    "id": candidate_id,
                    "full_name": profile.get(
                        "full_name"
                    ),
                    "headline": (
                        profile.get(
                            "resume_headline"
                        )
                        or profile.get(
                            "preferred_role"
                        )
                    ),
                    "location": profile.get(
                        "location"
                    ),
                    "degree": profile.get(
                        "degree"
                    ),
                    "graduation_year": profile.get(
                        "graduation_year"
                    ),
                },
            }
        )

    status_counts = {
        "applied": 0,
        "shortlisted": 0,
        "interview": 0,
        "hired": 0,
        "rejected": 0,
    }

    for application in applications:
        status = application.get(
            "status"
        )

        if status in status_counts:
            status_counts[
                status
            ] += 1

    published_jobs = sum(
        1
        for job in jobs
        if job.get("is_active")
    )

    closed_jobs = (
        len(jobs)
        - published_jobs
    )

    open_positions = sum(
        int(
            job.get("openings")
            or 1
        )
        for job in jobs
        if job.get("is_active")
    )

    return {
        "recruiter": recruiter,
        "total_candidates": len(
            candidate_rows
        ),
        "jobs": serialized_jobs,
        "recent_applications":
            recent_applications,
        "stats": {
            "published":
                published_jobs,
            "closed":
                closed_jobs,
            "applications":
                len(applications),
            "openings":
                open_positions,
            **status_counts,
        },
    }


# =========================================================
# RECRUITER TALENT POOL
# =========================================================

@app.get("/api/recruiter/candidates/count")
def get_recruiter_candidate_count(
    _recruiter_id: str = Depends(get_current_recruiter_id),
):
    rows = getattr(
        get_supabase_admin()
        .table("profiles")
        .select("id")
        .eq("user_type", "fresher")
        .execute(),
        "data",
        None,
    ) or []

    return {
        "total_candidates": len(rows),
    }


@app.get("/api/recruiter/candidates")
def get_recruiter_candidates(
    q: str | None = None,
    location: str | None = None,
    role: str | None = None,
    skill: str | None = None,
    graduation_year: int | None = None,
    page: int = 1,
    page_size: int = 20,
    _recruiter_id: str = Depends(get_current_recruiter_id),
):
    """
    Fast recruiter talent-pool endpoint.

    Important design:
    - Load lightweight fresher profile rows first.
    - Apply profile-based filters in memory.
    - Enrich ONLY the requested page with skills/projects/etc.
    - Skill filtering is handled only when the recruiter explicitly
      supplies a skill filter.
    """

    page = max(1, page)
    page_size = max(1, min(page_size, 50))

    profile_result = execute_read_with_retry(
        lambda: (
            get_supabase_admin()
            .table("profiles")
            .select(
                "id,full_name,graduation_year,degree,"
                "location,preferred_role,resume_headline,"
                "resume_url,bio,created_at"
            )
            .eq("user_type", "fresher")
            .order("created_at", desc=True)
            .execute()
        )
    )

    profiles = getattr(
        profile_result,
        "data",
        None,
    ) or []

    total_candidates = len(profiles)

    query_text = (q or "").strip().lower()
    location_text = (location or "").strip().lower()
    role_text = (role or "").strip().lower()
    skill_text = (skill or "").strip().lower()

    filtered_profiles: list[dict] = []

    for profile in profiles:
        headline = (
            profile.get("resume_headline")
            or profile.get("preferred_role")
            or ""
        )

        searchable = " ".join(
            [
                str(profile.get("full_name") or ""),
                str(headline),
                str(profile.get("degree") or ""),
                str(profile.get("location") or ""),
            ]
        ).lower()

        if query_text and query_text not in searchable:
            continue

        if (
            location_text
            and location_text
            not in str(profile.get("location") or "").lower()
        ):
            continue

        if (
            role_text
            and role_text not in str(headline).lower()
        ):
            continue

        if (
            graduation_year is not None
            and profile.get("graduation_year") != graduation_year
        ):
            continue

        filtered_profiles.append(profile)

    # Only explicit skill filtering needs skill rows for the full
    # profile-filtered result set. Normal browsing never pays this cost.
    if skill_text and filtered_profiles:
        all_filtered_ids = [
            str(profile["id"])
            for profile in filtered_profiles
            if profile.get("id")
        ]

        try:
            skill_filter_rows = fetch_rows_in_batches(
                "skills",
                "user_id,skill_name",
                "user_id",
                all_filtered_ids,
                batch_size=20,
            )
        except Exception as exc:
            print(
                "CANDIDATE SKILL FILTER WARNING:",
                exc,
            )
            skill_filter_rows = []

        matching_candidate_ids: set[str] = set()

        for row in skill_filter_rows:
            skill_name = str(
                row.get("skill_name") or ""
            ).lower()

            if skill_text in skill_name:
                matching_candidate_ids.add(
                    str(row.get("user_id"))
                )

        filtered_profiles = [
            profile
            for profile in filtered_profiles
            if str(profile.get("id"))
            in matching_candidate_ids
        ]

    filtered_count = len(filtered_profiles)

    total_pages = (
        max(
            1,
            (filtered_count + page_size - 1)
            // page_size,
        )
        if filtered_count
        else 1
    )

    if page > total_pages:
        page = total_pages

    start_index = (page - 1) * page_size
    end_index = start_index + page_size

    page_profiles = filtered_profiles[
        start_index:end_index
    ]

    page_candidate_ids = [
        str(profile["id"])
        for profile in page_profiles
        if profile.get("id")
    ]

    if not page_candidate_ids:
        return {
            "total_candidates": total_candidates,
            "filtered_count": filtered_count,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "candidates": [],
        }

    # Enrich only the visible page.
    def safe_related_rows(
        table_name: str,
        select_fields: str,
    ) -> list[dict]:
        try:
            return fetch_rows_in_batches(
                table_name,
                select_fields,
                "user_id",
                page_candidate_ids,
                batch_size=20,
            )
        except Exception as exc:
            print(
                f"CANDIDATE {table_name.upper()} WARNING:",
                exc,
            )
            return []

    skill_rows = safe_related_rows(
        "skills",
        "id,user_id,skill_name,skill_level",
    )

    education_rows = safe_related_rows(
        "education_details",
        "id,user_id",
    )

    employment_rows = safe_related_rows(
        "employment_details",
        "id,user_id,employment_type",
    )

    project_rows = safe_related_rows(
        "projects",
        "id,user_id",
    )

    assessment_rows = safe_related_rows(
        "assessment_results",
        (
            "id,user_id,skill_name,score,total_questions,"
            "percentage,created_at"
        ),
    )

    def group_by_user(
        rows: list[dict],
    ) -> dict[str, list[dict]]:
        grouped: dict[str, list[dict]] = {}

        for row in rows:
            user_id = str(
                row.get("user_id") or ""
            )

            if not user_id:
                continue

            grouped.setdefault(
                user_id,
                [],
            ).append(row)

        return grouped

    skills_by_user = group_by_user(skill_rows)
    education_by_user = group_by_user(
        education_rows
    )
    employment_by_user = group_by_user(
        employment_rows
    )
    projects_by_user = group_by_user(
        project_rows
    )
    assessments_by_user = group_by_user(
        assessment_rows
    )

    output = []

    for profile in page_profiles:
        candidate_id = str(profile["id"])

        candidate_skills = skills_by_user.get(
            candidate_id,
            [],
        )

        candidate_education = (
            education_by_user.get(
                candidate_id,
                [],
            )
        )

        candidate_employment = (
            employment_by_user.get(
                candidate_id,
                [],
            )
        )

        candidate_projects = (
            projects_by_user.get(
                candidate_id,
                [],
            )
        )

        candidate_assessments = (
            assessments_by_user.get(
                candidate_id,
                [],
            )
        )

        skill_names = [
            str(
                row.get("skill_name") or ""
            ).strip()
            for row in candidate_skills
            if str(
                row.get("skill_name") or ""
            ).strip()
        ]

        best_by_skill: dict[str, dict] = {}

        for assessment in candidate_assessments:
            assessment_skill = str(
                assessment.get(
                    "skill_name"
                )
                or ""
            ).strip()

            if not assessment_skill:
                continue

            key = assessment_skill.lower()
            existing = best_by_skill.get(key)

            if (
                not existing
                or float(
                    assessment.get(
                        "percentage"
                    )
                    or 0
                )
                > float(
                    existing.get(
                        "percentage"
                    )
                    or 0
                )
            ):
                best_by_skill[key] = (
                    assessment
                )

        best_assessments = sorted(
            best_by_skill.values(),
            key=lambda row: float(
                row.get("percentage") or 0
            ),
            reverse=True,
        )

        internships = [
            row
            for row in candidate_employment
            if row.get("employment_type")
            in {
                "internship",
                "apprenticeship",
            }
        ]

        experience = [
            row
            for row in candidate_employment
            if row.get("employment_type")
            not in {
                "internship",
                "apprenticeship",
            }
        ]

        headline = (
            profile.get("resume_headline")
            or profile.get("preferred_role")
            or ""
        )

        completion_checks = [
            bool(profile.get("full_name")),
            bool(headline),
            bool(profile.get("location")),
            bool(profile.get("graduation_year")),
            bool(profile.get("degree")),
            bool(candidate_skills),
            bool(candidate_education),
            bool(candidate_employment),
            bool(candidate_projects),
            bool(best_assessments),
            bool(profile.get("bio")),
            bool(profile.get("resume_url")),
        ]

        profile_completion = round(
            sum(completion_checks)
            / len(completion_checks)
            * 100
        )

        output.append(
            {
                "id": candidate_id,
                "full_name": profile.get(
                    "full_name"
                ),
                "headline": headline or None,
                "location": profile.get(
                    "location"
                ),
                "graduation_year": profile.get(
                    "graduation_year"
                ),
                "degree": profile.get(
                    "degree"
                ),
                "skills": skill_names,
                "skill_items": candidate_skills,
                "best_assessment_items":
                    best_assessments[:5],
                "profile_completion":
                    profile_completion,
                "resume_available": bool(
                    profile.get("resume_url")
                ),
                "project_count": len(
                    candidate_projects
                ),
                "internship_count": len(
                    internships
                ),
                "experience_count": len(
                    experience
                ),
                "created_at": profile.get(
                    "created_at"
                ),
            }
        )

    return {
        "total_candidates": total_candidates,
        "filtered_count": filtered_count,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "candidates": output,
    }

@app.get("/api/recruiter/candidates/{candidate_id}")
def get_recruiter_candidate(
    candidate_id: str,
    recruiter_id: str = Depends(
        get_current_recruiter_id
    ),
):
    profile = get_profile_row(
        candidate_id
    )

    if (
        profile.get("user_type")
        != "fresher"
    ):
        raise HTTPException(
            status_code=404,
            detail="Candidate not found.",
        )

    company = get_company_row(
        recruiter_id
    )

    contact_access = (
        recruiter_has_paid_access(
            company
        )
    )

    payload = get_candidate_payload(
        candidate_id,
        include_signed_resume=(
            contact_access
        ),
    )

    payload[
        "resume_available"
    ] = bool(
        profile.get("resume_url")
    )

    payload[
        "contact_access"
    ] = contact_access

    payload[
        "subscription_plan"
    ] = (
        company.get(
            "subscription_plan"
        )
        or "free"
    )

    payload[
        "subscription_status"
    ] = (
        company.get(
            "subscription_status"
        )
        or "inactive"
    )

    payload[
        "subscription_expires_at"
    ] = company.get(
        "subscription_expires_at"
    )

    if not contact_access:
        payload["email"] = None
        payload["phone"] = None
        payload["resume_url"] = None

    return payload


# =========================================================
# RECRUITER JOBS
# =========================================================

@app.post("/api/recruiter/jobs")
def create_job(job: JobCreate, recruiter_id: str = Depends(get_current_recruiter_id)):
    payload = {
        "company_id": recruiter_id,
        "title": job.title.strip(),
        "description": job.description.strip(),
        "required_skills": normalize_skills(job.skills),
        "location": job.location.strip(),
        "job_type": job.employment_type,
        "experience_level": job.experience,
        "salary_text": job.salary.strip() if job.salary and job.salary.strip() else None,
        "is_active": True,
        "workplace_type": job.workplace_type,
        "openings": job.openings,
        "eligibility": job.eligibility.strip() if job.eligibility and job.eligibility.strip() else None,
    }
    row = first_row(get_supabase_admin().table("jobs").insert(payload).execute())
    return {"success": True, "message": "Job published successfully.", "job_id": row["id"]}


@app.get("/api/recruiter/jobs")
def get_recruiter_jobs(recruiter_id: str = Depends(get_current_recruiter_id)):
    db = get_supabase_admin()
    jobs = getattr(db.table("jobs").select("*").eq("company_id", recruiter_id).order("created_at", desc=True).execute(), "data", None) or []
    output = []
    for job in jobs:
        item = serialize_job(job)
        apps = getattr(db.table("applications").select("id,status").eq("job_id", job["id"]).execute(), "data", None) or []
        item["application_count"] = sum(app.get("status") != "withdrawn" for app in apps)
        output.append(item)
    return output


@app.get("/api/recruiter/jobs/{job_id}")
def get_recruiter_job(job_id: int, recruiter_id: str = Depends(get_current_recruiter_id)):
    db = get_supabase_admin()
    job = first_row(db.table("jobs").select("*").eq("id", job_id).eq("company_id", recruiter_id).limit(1).execute())
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    item = serialize_job(job)
    apps = getattr(db.table("applications").select("id,status").eq("job_id", job_id).execute(), "data", None) or []
    item["application_count"] = sum(app.get("status") != "withdrawn" for app in apps)
    return item


@app.patch("/api/recruiter/jobs/{job_id}")
def update_recruiter_job(job_id: int, data: JobUpdate, recruiter_id: str = Depends(get_current_recruiter_id)):
    db = get_supabase_admin()
    job = first_row(db.table("jobs").select("id").eq("id", job_id).eq("company_id", recruiter_id).limit(1).execute())
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    db.table("jobs").update(
        {
            "title": data.title.strip(),
            "description": data.description.strip(),
            "required_skills": normalize_skills(data.skills),
            "location": data.location.strip(),
            "job_type": data.employment_type,
            "experience_level": data.experience,
            "salary_text": data.salary.strip() if data.salary and data.salary.strip() else None,
            "workplace_type": data.workplace_type,
            "openings": data.openings,
            "eligibility": data.eligibility.strip() if data.eligibility and data.eligibility.strip() else None,
        }
    ).eq("id", job_id).execute()
    return {"success": True, "message": "Job updated successfully.", "job_id": job_id}


@app.patch("/api/recruiter/jobs/{job_id}/status")
def update_job_status(job_id: int, data: JobStatusUpdate, recruiter_id: str = Depends(get_current_recruiter_id)):
    db = get_supabase_admin()
    job = first_row(db.table("jobs").select("id").eq("id", job_id).eq("company_id", recruiter_id).limit(1).execute())
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    active = data.status == "published"
    db.table("jobs").update({"is_active": active}).eq("id", job_id).execute()
    return {
        "success": True,
        "message": "Job reopened successfully." if active else "Job closed successfully.",
        "job_id": job_id,
        "status": data.status,
    }


@app.delete("/api/recruiter/jobs/{job_id}")
def delete_recruiter_job(job_id: int, recruiter_id: str = Depends(get_current_recruiter_id)):
    db = get_supabase_admin()
    job = first_row(db.table("jobs").select("id").eq("id", job_id).eq("company_id", recruiter_id).limit(1).execute())
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    apps = getattr(db.table("applications").select("id").eq("job_id", job_id).limit(1).execute(), "data", None) or []
    if apps:
        raise HTTPException(status_code=409, detail="This job has application history and cannot be deleted. Close the job instead.")
    db.table("jobs").delete().eq("id", job_id).execute()
    return {"success": True, "message": "Job deleted successfully."}


@app.get("/api/recruiter/jobs/{job_id}/applications")
def get_job_applications(job_id: int, recruiter_id: str = Depends(get_current_recruiter_id)):
    db = get_supabase_admin()
    job = first_row(db.table("jobs").select("*").eq("id", job_id).eq("company_id", recruiter_id).limit(1).execute())
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    apps = getattr(db.table("applications").select("*").eq("job_id", job_id).neq("status", "withdrawn").order("created_at", desc=True).execute(), "data", None) or []
    output = []
    for application in apps:
        candidate = get_candidate_payload(str(application["candidate_id"]), include_signed_resume=True)
        output.append(
            {
                "id": application["id"],
                "status": application["status"],
                "cover_letter": application.get("cover_letter"),
                "applied_at": application.get("created_at"),
                "candidate": candidate,
            }
        )
    job_payload = serialize_job(job)
    return {
        "job": {
            "id": job_payload["id"],
            "title": job_payload["title"],
            "location": job_payload["location"],
            "employment_type": job_payload["employment_type"],
            "workplace_type": job_payload["workplace_type"],
            "openings": job_payload["openings"],
            "status": job_payload["status"],
        },
        "applications": output,
    }


@app.patch("/api/recruiter/applications/{application_id}/status")
def update_application_status(
    application_id: int,
    data: ApplicationStatusUpdate,
    recruiter_id: str = Depends(get_current_recruiter_id),
):
    db = get_supabase_admin()
    application = first_row(db.table("applications").select("*").eq("id", application_id).limit(1).execute())
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")
    job = first_row(db.table("jobs").select("*").eq("id", application["job_id"]).limit(1).execute())
    if not job or str(job["company_id"]) != recruiter_id:
        raise HTTPException(status_code=403, detail="You do not have permission to update this application.")
    if application["status"] == "withdrawn":
        raise HTTPException(status_code=409, detail="Candidate withdrew this application.")
    if application["status"] == data.status:
        return {"success": True, "message": "Application status is unchanged.", "application_id": application_id, "status": data.status}

    db.table("applications").update({"status": data.status}).eq("id", application_id).execute()
    if data.status in NOTIFICATION_TYPE_BY_STATUS:
        company = get_company_row(recruiter_id)
        create_application_notification(application, job, company, data.status)
    return {"success": True, "message": "Application status updated successfully.", "application_id": application_id, "status": data.status}


# =========================================================
# CANDIDATE AUTH + PROFILE
# =========================================================

@app.post("/api/candidate/signup")
def candidate_signup(data: CandidateSignupRequest, response: Response):
    db = get_supabase_admin()
    email = str(data.email).strip().lower()
    created_user_id = None
    try:
        auth_response = db.auth.admin.create_user(
            {
                "email": email,
                "password": data.password,
                "email_confirm": True,
                "user_metadata": {"role": "candidate", "full_name": data.full_name.strip()},
            }
        )
        user = getattr(auth_response, "user", None)
        if not user:
            raise RuntimeError("Supabase Auth did not return a user.")
        created_user_id = str(user.id)
        db.table("profiles").upsert(
            {
                "id": created_user_id,
                "full_name": data.full_name.strip(),
                "email": email,
                "user_type": "fresher",
                "graduation_year": data.graduation_year,
                "degree": data.degree.strip(),
                "location": data.location.strip(),
                "preferred_role": data.preferred_role.strip(),
                "resume_headline": data.preferred_role.strip(),
                "phone_number": data.phone.strip() if data.phone else None,
            },
            on_conflict="id",
        ).execute()

        signed_in = new_supabase_auth_client().auth.sign_in_with_password({"email": email, "password": data.password})
        set_supabase_session_cookies(response, "candidate", signed_in.session)
        candidate = get_candidate_payload(created_user_id)
        return {
            "success": True,
            "message": "Candidate account created successfully.",
            "candidate_id": created_user_id,
            "profile_completion": candidate["profile_completion"],
        }
    except HTTPException:
        raise
    except Exception as exc:
        if created_user_id:
            try:
                db.auth.admin.delete_user(created_user_id)
            except Exception:
                pass
        message = str(exc).lower()
        if "already" in message or "registered" in message or "exists" in message:
            raise HTTPException(status_code=409, detail="An account with this email already exists.")
        raise HTTPException(status_code=500, detail=f"Unable to create candidate account: {exc}")


@app.post("/api/candidate/login")
def candidate_login(data: CandidateLoginRequest, response: Response):
    try:
        auth_response = new_supabase_auth_client().auth.sign_in_with_password(
            {"email": str(data.email).strip().lower(), "password": data.password}
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    user = getattr(auth_response, "user", None)
    session = getattr(auth_response, "session", None)
    if not user or not session:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    profile = first_row(
        get_supabase_admin().table("profiles").select("id,user_type").eq("id", str(user.id)).eq("user_type", "fresher").limit(1).execute()
    )
    if not profile:
        raise HTTPException(status_code=403, detail="This account is not a candidate account.")
    set_supabase_session_cookies(response, "candidate", session)
    return {"success": True, "message": "Candidate login successful."}


@app.post("/api/candidate/logout")
def candidate_logout(response: Response):
    clear_supabase_session_cookies(response, "candidate")
    return {"success": True}


@app.get("/api/candidate/me")
def candidate_me(candidate_id: str = Depends(get_current_candidate_id)):
    return get_candidate_payload(candidate_id)


@app.patch("/api/candidate/profile")
def update_candidate_profile(data: CandidateProfileUpdate, candidate_id: str = Depends(get_current_candidate_id)):
    db = get_supabase_admin()
    changes = data.model_dump(exclude_unset=True)

    profile_update = {}
    direct_map = {
        "full_name": "full_name",
        "headline": "resume_headline",
        "phone": "phone_number",
        "location": "location",
        "graduation_year": "graduation_year",
        "degree": "degree",
        "bio": "bio",
        "linkedin_url": "linkedin_url",
        "github_url": "github_url",
        "portfolio_url": "portfolio_url",
    }

    for source, target in direct_map.items():
        if source in changes:
            profile_update[target] = clean_optional_text(changes[source])

    if profile_update:
        db.table("profiles").update(profile_update).eq("id", candidate_id).execute()

    # Compatibility for older frontend builds that still send a comma-separated
    # `skills` field. The new profile editor uses dedicated skill CRUD endpoints.
    if "skills" in changes and changes.get("skills") is not None:
        new_skills = normalize_skills(changes.get("skills"))
        existing_rows = getattr(
            db.table("skills").select("*").eq("user_id", candidate_id).execute(),
            "data",
            None,
        ) or []
        existing_levels = {
            str(row.get("skill_name", "")).strip().lower(): row.get("skill_level") or "Intermediate"
            for row in existing_rows
        }
        db.table("skills").delete().eq("user_id", candidate_id).execute()
        if new_skills:
            db.table("skills").insert(
                [
                    {
                        "user_id": candidate_id,
                        "skill_name": skill,
                        "skill_level": existing_levels.get(skill.lower(), "Intermediate"),
                    }
                    for skill in new_skills
                ]
            ).execute()

    candidate = get_candidate_payload(candidate_id)
    return {
        "success": True,
        "message": "Candidate profile updated successfully.",
        "profile_completion": candidate["profile_completion"],
        "candidate": candidate,
    }


@app.get("/api/candidate/profile/full")
def get_candidate_full_profile(candidate_id: str = Depends(get_current_candidate_id)):
    return get_candidate_payload(candidate_id, include_signed_resume=True)


# =========================================================
# CANDIDATE SKILLS
# =========================================================

@app.post("/api/candidate/skills")
def create_candidate_skill(data: SkillCreate, candidate_id: str = Depends(get_current_candidate_id)):
    db = get_supabase_admin()
    name = data.skill_name.strip()

    existing = getattr(
        db.table("skills")
        .select("id")
        .eq("user_id", candidate_id)
        .ilike("skill_name", name)
        .limit(1)
        .execute(),
        "data",
        None,
    ) or []
    if existing:
        raise HTTPException(status_code=409, detail="This skill is already in your profile.")

    row = first_row(
        db.table("skills").insert(
            {
                "user_id": candidate_id,
                "skill_name": name,
                "skill_level": data.skill_level,
            }
        ).execute()
    )
    return {"success": True, "skill": row}


@app.patch("/api/candidate/skills/{skill_id}")
def update_candidate_skill(
    skill_id: int,
    data: SkillUpdate,
    candidate_id: str = Depends(get_current_candidate_id),
):
    db = get_supabase_admin()
    row = first_row(
        db.table("skills").select("id").eq("id", skill_id).eq("user_id", candidate_id).limit(1).execute()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Skill not found.")

    updated = first_row(
        db.table("skills")
        .update({"skill_name": data.skill_name.strip(), "skill_level": data.skill_level})
        .eq("id", skill_id)
        .eq("user_id", candidate_id)
        .execute()
    )
    return {"success": True, "skill": updated}


@app.delete("/api/candidate/skills/{skill_id}")
def delete_candidate_skill(skill_id: int, candidate_id: str = Depends(get_current_candidate_id)):
    db = get_supabase_admin()
    row = first_row(
        db.table("skills").select("id").eq("id", skill_id).eq("user_id", candidate_id).limit(1).execute()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Skill not found.")
    db.table("skills").delete().eq("id", skill_id).eq("user_id", candidate_id).execute()
    return {"success": True, "message": "Skill removed successfully."}


# =========================================================
# CANDIDATE EDUCATION
# =========================================================

@app.post("/api/candidate/education")
def create_candidate_education(data: EducationCreate, candidate_id: str = Depends(get_current_candidate_id)):
    payload = data.model_dump(mode="json")
    payload["user_id"] = candidate_id
    for key, value in list(payload.items()):
        payload[key] = clean_optional_text(value)
    row = first_row(get_supabase_admin().table("education_details").insert(payload).execute())
    return {"success": True, "education": row}


@app.patch("/api/candidate/education/{education_id}")
def update_candidate_education(
    education_id: int,
    data: EducationUpdate,
    candidate_id: str = Depends(get_current_candidate_id),
):
    db = get_supabase_admin()
    existing = first_row(
        db.table("education_details").select("id").eq("id", education_id).eq("user_id", candidate_id).limit(1).execute()
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Education entry not found.")

    payload = data.model_dump(mode="json")
    for key, value in list(payload.items()):
        payload[key] = clean_optional_text(value)
    row = first_row(
        db.table("education_details")
        .update(payload)
        .eq("id", education_id)
        .eq("user_id", candidate_id)
        .execute()
    )
    return {"success": True, "education": row}


@app.delete("/api/candidate/education/{education_id}")
def delete_candidate_education(education_id: int, candidate_id: str = Depends(get_current_candidate_id)):
    db = get_supabase_admin()
    existing = first_row(
        db.table("education_details").select("id").eq("id", education_id).eq("user_id", candidate_id).limit(1).execute()
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Education entry not found.")
    db.table("education_details").delete().eq("id", education_id).eq("user_id", candidate_id).execute()
    return {"success": True, "message": "Education entry removed successfully."}


# =========================================================
# CANDIDATE EXPERIENCE + INTERNSHIPS
# =========================================================

@app.post("/api/candidate/employment")
def create_candidate_employment(data: EmploymentCreate, candidate_id: str = Depends(get_current_candidate_id)):
    payload = data.model_dump(mode="json")
    payload["user_id"] = candidate_id
    if payload.get("is_current"):
        payload["end_date"] = None
    for key, value in list(payload.items()):
        payload[key] = clean_optional_text(value)
    row = first_row(get_supabase_admin().table("employment_details").insert(payload).execute())
    return {"success": True, "employment": row}


@app.patch("/api/candidate/employment/{employment_id}")
def update_candidate_employment(
    employment_id: int,
    data: EmploymentUpdate,
    candidate_id: str = Depends(get_current_candidate_id),
):
    db = get_supabase_admin()
    existing = first_row(
        db.table("employment_details").select("id").eq("id", employment_id).eq("user_id", candidate_id).limit(1).execute()
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Experience entry not found.")

    payload = data.model_dump(mode="json")
    if payload.get("is_current"):
        payload["end_date"] = None
    for key, value in list(payload.items()):
        payload[key] = clean_optional_text(value)
    row = first_row(
        db.table("employment_details")
        .update(payload)
        .eq("id", employment_id)
        .eq("user_id", candidate_id)
        .execute()
    )
    return {"success": True, "employment": row}


@app.delete("/api/candidate/employment/{employment_id}")
def delete_candidate_employment(employment_id: int, candidate_id: str = Depends(get_current_candidate_id)):
    db = get_supabase_admin()
    existing = first_row(
        db.table("employment_details").select("id").eq("id", employment_id).eq("user_id", candidate_id).limit(1).execute()
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Experience entry not found.")
    db.table("employment_details").delete().eq("id", employment_id).eq("user_id", candidate_id).execute()
    return {"success": True, "message": "Experience entry removed successfully."}


# =========================================================
# CANDIDATE PROJECTS
# =========================================================

@app.post("/api/candidate/projects")
def create_candidate_project(data: ProjectCreate, candidate_id: str = Depends(get_current_candidate_id)):
    payload = data.model_dump()
    payload["user_id"] = candidate_id
    for key, value in list(payload.items()):
        payload[key] = clean_optional_text(value)
    row = first_row(get_supabase_admin().table("projects").insert(payload).execute())
    return {"success": True, "project": row}


@app.patch("/api/candidate/projects/{project_id}")
def update_candidate_project(
    project_id: int,
    data: ProjectUpdate,
    candidate_id: str = Depends(get_current_candidate_id),
):
    db = get_supabase_admin()
    existing = first_row(
        db.table("projects").select("id").eq("id", project_id).eq("user_id", candidate_id).limit(1).execute()
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found.")

    payload = data.model_dump()
    for key, value in list(payload.items()):
        payload[key] = clean_optional_text(value)
    row = first_row(
        db.table("projects")
        .update(payload)
        .eq("id", project_id)
        .eq("user_id", candidate_id)
        .execute()
    )
    return {"success": True, "project": row}


@app.delete("/api/candidate/projects/{project_id}")
def delete_candidate_project(project_id: int, candidate_id: str = Depends(get_current_candidate_id)):
    db = get_supabase_admin()
    existing = first_row(
        db.table("projects").select("id").eq("id", project_id).eq("user_id", candidate_id).limit(1).execute()
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found.")
    db.table("projects").delete().eq("id", project_id).eq("user_id", candidate_id).execute()
    return {"success": True, "message": "Project removed successfully."}


@app.post("/api/candidate/resume")
async def upload_candidate_resume(
    resume: UploadFile = File(...),
    candidate_id: str = Depends(get_current_candidate_id),
):
    filename = resume.filename or ""
    if not filename.lower().endswith(".pdf"):
        await resume.close()
        raise HTTPException(status_code=400, detail="Only PDF resumes are allowed.")
    try:
        content = await resume.read(MAX_RESUME_SIZE + 1)
        if not content:
            raise HTTPException(status_code=400, detail="Uploaded resume is empty.")
        if len(content) > MAX_RESUME_SIZE:
            raise HTTPException(status_code=400, detail="Resume must be smaller than 5 MB.")
        if not content.startswith(b"%PDF"):
            raise HTTPException(status_code=400, detail="The uploaded file is not a valid PDF.")

        db = get_supabase_admin()
        profile = get_profile_row(candidate_id)
        old_path = profile.get("resume_url")
        new_path = upload_resume_bytes(candidate_id, content)
        try:
            db.table("profiles").update({"resume_url": new_path}).eq("id", candidate_id).execute()
        except Exception:
            try:
                delete_resume_object(new_path)
            except Exception:
                pass
            raise
        if old_path and old_path != new_path:
            try:
                delete_resume_object(old_path)
            except Exception as exc:
                print("OLD RESUME DELETE ERROR:", exc)
        candidate = get_candidate_payload(candidate_id)
        return {
            "success": True,
            "message": "Resume uploaded successfully.",
            "resume_url": candidate["resume_url"],
            "profile_completion": candidate["profile_completion"],
        }
    finally:
        await resume.close()


@app.delete("/api/candidate/resume")
def delete_candidate_resume(candidate_id: str = Depends(get_current_candidate_id)):
    db = get_supabase_admin()
    profile = get_profile_row(candidate_id)
    old_path = profile.get("resume_url")
    db.table("profiles").update({"resume_url": None}).eq("id", candidate_id).execute()
    if old_path:
        try:
            delete_resume_object(old_path)
        except Exception as exc:
            print("RESUME DELETE ERROR:", exc)
    candidate = get_candidate_payload(candidate_id)
    return {
        "success": True,
        "message": "Resume removed successfully.",
        "profile_completion": candidate["profile_completion"],
    }


# =========================================================
# PUBLIC JOBS + APPLICATIONS
# =========================================================

@app.get("/api/jobs")
def get_public_jobs():
    db = get_supabase_admin()
    jobs = getattr(db.table("jobs").select("*").eq("is_active", True).order("created_at", desc=True).execute(), "data", None) or []
    company_cache: dict[str, dict] = {}
    output = []
    for job in jobs:
        company_id = str(job["company_id"])
        if company_id not in company_cache:
            company_cache[company_id] = get_company_row(company_id)
        output.append(serialize_job(job, company_cache[company_id]))
    return output


@app.get("/api/jobs/{job_id}")
def get_public_job(job_id: int):
    db = get_supabase_admin()
    job = first_row(db.table("jobs").select("*").eq("id", job_id).eq("is_active", True).limit(1).execute())
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or no longer available.")
    return serialize_job(job, get_company_row(str(job["company_id"])))


@app.post("/api/jobs/{job_id}/apply")
def apply_to_job(
    job_id: int,
    data: JobApplicationCreate | None = None,
    candidate_id: str = Depends(get_current_candidate_id),
):
    db = get_supabase_admin()
    job = first_row(db.table("jobs").select("*").eq("id", job_id).eq("is_active", True).limit(1).execute())
    if not job:
        raise HTTPException(status_code=404, detail="Job is closed or unavailable.")

    cover_letter = data.cover_letter.strip() if data and data.cover_letter and data.cover_letter.strip() else None
    existing = first_row(
        db.table("applications").select("*").eq("job_id", job_id).eq("candidate_id", candidate_id).limit(1).execute()
    )
    if existing:
        if existing.get("status") == "withdrawn":
            db.table("applications").update(
                {"status": "applied", "cover_letter": cover_letter, "created_at": now_iso()}
            ).eq("id", existing["id"]).execute()
            return {
                "success": True,
                "message": "Application submitted successfully.",
                "application_id": existing["id"],
                "status": "applied",
                "reapplied": True,
            }
        raise HTTPException(status_code=409, detail="You have already applied to this job.")

    row = first_row(
        db.table("applications").insert(
            {"job_id": job_id, "candidate_id": candidate_id, "status": "applied", "cover_letter": cover_letter}
        ).execute()
    )
    return {
        "success": True,
        "message": "Application submitted successfully.",
        "application_id": row["id"],
        "status": "applied",
        "reapplied": False,
    }


@app.get("/api/candidate/applications")
def get_candidate_applications(candidate_id: str = Depends(get_current_candidate_id)):
    db = get_supabase_admin()
    apps = getattr(db.table("applications").select("*").eq("candidate_id", candidate_id).order("created_at", desc=True).execute(), "data", None) or []
    output = []
    job_cache: dict[int, dict] = {}
    company_cache: dict[str, dict] = {}
    for application in apps:
        job_id = int(application["job_id"])
        if job_id not in job_cache:
            job = first_row(db.table("jobs").select("*").eq("id", job_id).limit(1).execute())
            if not job:
                continue
            job_cache[job_id] = job
        job = job_cache[job_id]
        company_id = str(job["company_id"])
        if company_id not in company_cache:
            company_cache[company_id] = get_company_row(company_id)
        company = company_cache[company_id]
        output.append(
            {
                "id": application["id"],
                "status": application["status"],
                "cover_letter": application.get("cover_letter"),
                "applied_at": application.get("created_at"),
                "job": {
                    "id": job["id"],
                    "title": job.get("title"),
                    "location": job.get("location") or "",
                    "employment_type": job.get("job_type") or "Full-time",
                    "workplace_type": job.get("workplace_type") or "On-site",
                    "job_status": "published" if job.get("is_active") else "closed",
                    "company": {
                        "id": company.get("id"),
                        "name": company.get("company_name"),
                        "is_verified": bool(company.get("is_verified", True)),
                    },
                },
            }
        )
    return output


@app.patch("/api/candidate/applications/{application_id}/withdraw")
def withdraw_application(application_id: int, candidate_id: str = Depends(get_current_candidate_id)):
    db = get_supabase_admin()
    application = first_row(
        db.table("applications").select("*").eq("id", application_id).eq("candidate_id", candidate_id).limit(1).execute()
    )
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")
    if application["status"] == "withdrawn":
        return {"success": True, "message": "Application is already withdrawn.", "status": "withdrawn"}
    if application["status"] in {"hired", "rejected"}:
        raise HTTPException(status_code=409, detail="This application has reached a final decision and cannot be withdrawn.")
    db.table("applications").update({"status": "withdrawn"}).eq("id", application_id).execute()
    return {"success": True, "message": "Application withdrawn successfully.", "status": "withdrawn"}


# =========================================================
# CANDIDATE NOTIFICATIONS
# =========================================================

@app.get("/api/candidate/notifications")
def get_candidate_notifications(candidate_id: str = Depends(get_current_candidate_id)):
    db = get_supabase_admin()
    rows = getattr(
        db.table("notifications").select("*").eq("user_id", candidate_id).order("created_at", desc=True).limit(100).execute(),
        "data",
        None,
    ) or []
    type_map = {
        "new_application": "applied",
        "application_shortlisted": "shortlisted",
        "application_interview": "interview",
        "application_hired": "hired",
        "application_rejected": "rejected",
    }
    output = []
    for row in rows:
        job_id = None
        if row.get("application_id"):
            application = first_row(
                db.table("applications")
                .select("job_id")
                .eq("id", row["application_id"])
                .limit(1)
                .execute()
            )
            if application:
                job_id = application.get("job_id")
        output.append(
            {
                "id": row["id"],
                "application_id": row.get("application_id"),
                "job_id": job_id,
                "notification_type": type_map.get(row.get("type"), "applied"),
                "title": row.get("title"),
                "message": row.get("message"),
                "is_read": row.get("is_read", False),
                "created_at": row.get("created_at"),
            }
        )
    return output


@app.get("/api/candidate/notifications/unread-count")
def get_notification_unread_count(candidate_id: str = Depends(get_current_candidate_id)):
    rows = getattr(
        get_supabase_admin().table("notifications").select("id").eq("user_id", candidate_id).eq("is_read", False).execute(),
        "data",
        None,
    ) or []
    return {"unread_count": len(rows)}


@app.patch("/api/candidate/notifications/read-all")
def mark_all_notifications_read(candidate_id: str = Depends(get_current_candidate_id)):
    get_supabase_admin().table("notifications").update({"is_read": True}).eq("user_id", candidate_id).eq("is_read", False).execute()
    return {"success": True, "message": "All notifications marked as read."}


@app.patch("/api/candidate/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int, candidate_id: str = Depends(get_current_candidate_id)):
    db = get_supabase_admin()
    row = first_row(db.table("notifications").select("id").eq("id", notification_id).eq("user_id", candidate_id).limit(1).execute())
    if not row:
        raise HTTPException(status_code=404, detail="Notification not found.")
    db.table("notifications").update({"is_read": True}).eq("id", notification_id).execute()
    return {"success": True, "notification_id": notification_id, "is_read": True}
