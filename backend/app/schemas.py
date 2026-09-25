from datetime import date
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


# =========================================================
# RECRUITER LEAD
# =========================================================

class RecruiterLeadCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    work_email: EmailStr
    phone: str = Field(min_length=5, max_length=50)
    designation: str = Field(min_length=2, max_length=150)
    company_name: str = Field(min_length=2, max_length=255)
    company_website: str | None = Field(default=None, max_length=500)
    company_size: str = Field(min_length=1, max_length=100)
    company_type: str = Field(min_length=1, max_length=100)
    roles: str = Field(min_length=2)
    openings: int = Field(ge=1, le=10000)
    location: str = Field(min_length=1, max_length=255)
    job_type: str = Field(min_length=1, max_length=100)
    experience: str = Field(min_length=1, max_length=100)
    skills: str | None = None
    requirements: str | None = None


class RecruiterLeadStatusUpdate(BaseModel):
    status: Literal[
        "new",
        "contacted",
        "qualified",
        "approved",
        "rejected",
    ]


# =========================================================
# ADMIN
# =========================================================

class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=200)


# =========================================================
# RECRUITER AUTH
# =========================================================

class RecruiterLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=200)


class RecruiterPasswordChange(BaseModel):
    current_password: str = Field(min_length=6, max_length=200)
    new_password: str = Field(min_length=8, max_length=200)


# =========================================================
# PASSWORD RESET
# =========================================================

class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    account_type: Literal["candidate", "recruiter"]


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=20, max_length=500)
    account_type: Literal["candidate", "recruiter"]
    new_password: str = Field(min_length=8, max_length=200)


# =========================================================
# JOBS
# =========================================================

class JobCreate(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    description: str = Field(min_length=20)
    skills: str = Field(min_length=2)
    location: str = Field(min_length=2, max_length=255)
    employment_type: Literal["Full-time", "Internship", "Contract"]
    workplace_type: Literal["On-site", "Hybrid", "Remote"]
    openings: int = Field(ge=1, le=1000)
    experience: Literal["Fresher", "0-1 years", "0-2 years", "1-2 years"]
    salary: str | None = Field(default=None, max_length=150)
    eligibility: str | None = None


class JobUpdate(JobCreate):
    pass


class JobStatusUpdate(BaseModel):
    status: Literal["published", "closed"]


# =========================================================
# CANDIDATE AUTH + BASIC PROFILE
# =========================================================

class CandidateSignupRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(min_length=8, max_length=200)
    graduation_year: int = Field(ge=2020, le=2035)
    degree: str = Field(min_length=2, max_length=255)
    location: str = Field(min_length=2, max_length=255)
    preferred_role: str = Field(min_length=2, max_length=255)
    phone: str | None = Field(default=None, max_length=50)


class CandidateLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=200)


class CandidateProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=150)
    headline: str | None = Field(default=None, max_length=220)
    phone: str | None = Field(default=None, max_length=50)
    location: str | None = Field(default=None, max_length=255)
    graduation_year: int | None = Field(default=None, ge=2020, le=2035)
    degree: str | None = Field(default=None, max_length=255)
    bio: str | None = Field(default=None, max_length=5000)
    linkedin_url: str | None = Field(default=None, max_length=500)
    github_url: str | None = Field(default=None, max_length=500)
    portfolio_url: str | None = Field(default=None, max_length=500)

    # Kept for compatibility with older frontend builds. The new profile
    # editor uses the normalized tables below instead.
    skills: str | None = None
    education: str | None = None
    internships: str | None = None
    projects: str | None = None
    experience: str | None = None


# =========================================================
# STRUCTURED PROFILE: SKILLS
# =========================================================

SkillLevel = Literal["Beginner", "Intermediate", "Advanced"]


class SkillCreate(BaseModel):
    skill_name: str = Field(min_length=1, max_length=100)
    skill_level: SkillLevel = "Intermediate"


class SkillUpdate(SkillCreate):
    pass


# =========================================================
# STRUCTURED PROFILE: EDUCATION
# =========================================================

EducationLevel = Literal[
    "10th",
    "12th",
    "diploma",
    "bachelors",
    "masters",
    "doctorate",
    "other",
]

ScoreType = Literal[
    "percentage",
    "cgpa_10",
    "cgpa_4",
    "grade",
    "other",
]


class EducationCreate(BaseModel):
    education_level: EducationLevel
    institution_name: str = Field(min_length=2, max_length=255)
    board_or_university: str | None = Field(default=None, max_length=255)
    degree_or_course: str | None = Field(default=None, max_length=255)
    specialization: str | None = Field(default=None, max_length=255)
    start_year: int | None = Field(default=None, ge=1950, le=2100)
    end_year: int | None = Field(default=None, ge=1950, le=2100)
    score_type: ScoreType | None = None
    score_value: float | None = None
    location: str | None = Field(default=None, max_length=255)
    is_current: bool = False


class EducationUpdate(EducationCreate):
    pass


# =========================================================
# STRUCTURED PROFILE: EMPLOYMENT / INTERNSHIPS
# =========================================================

EmploymentType = Literal[
    "full_time",
    "internship",
    "part_time",
    "contract",
    "freelance",
    "apprenticeship",
    "other",
]

WorkMode = Literal["onsite", "hybrid", "remote"]


class EmploymentCreate(BaseModel):
    employment_type: EmploymentType
    company_name: str = Field(min_length=2, max_length=255)
    role_title: str = Field(min_length=2, max_length=255)
    location: str | None = Field(default=None, max_length=255)
    work_mode: WorkMode | None = None
    start_date: date
    end_date: date | None = None
    is_current: bool = False
    description: str | None = Field(default=None, max_length=5000)
    skills_used: str | None = Field(default=None, max_length=1000)


class EmploymentUpdate(EmploymentCreate):
    pass


# =========================================================
# STRUCTURED PROFILE: PROJECTS
# =========================================================

class ProjectCreate(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    technologies: str | None = Field(default=None, max_length=1000)
    github_url: str | None = Field(default=None, max_length=500)
    live_url: str | None = Field(default=None, max_length=500)


class ProjectUpdate(ProjectCreate):
    pass


# =========================================================
# APPLICATIONS
# =========================================================

class JobApplicationCreate(BaseModel):
    cover_letter: str | None = Field(default=None, max_length=2000)


class ApplicationStatusUpdate(BaseModel):
    status: Literal[
        "applied",
        "shortlisted",
        "interview",
        "hired",
        "rejected",
    ]
