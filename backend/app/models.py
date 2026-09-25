from typing import Literal

ApplicationStatus = Literal[
    "applied",
    "shortlisted",
    "interview",
    "hired",
    "rejected",
    "withdrawn",
]

JobStatus = Literal["published", "closed"]
AccountType = Literal["candidate", "recruiter"]

NOTIFICATION_TYPE_BY_STATUS = {
    "shortlisted": "application_shortlisted",
    "interview": "application_interview",
    "hired": "application_hired",
    "rejected": "application_rejected",
}

NOTIFICATION_COPY_BY_STATUS = {
    "shortlisted": (
        "You have been shortlisted!",
        "{company} shortlisted your application for {job}.",
    ),
    "interview": (
        "You moved to the interview stage",
        "{company} moved your application for {job} to the Interview stage.",
    ),
    "hired": (
        "Congratulations — you're hired!",
        "{company} marked your application for {job} as Hired.",
    ),
    "rejected": (
        "Application update",
        "{company} has decided not to move forward with your application for {job}.",
    ),
}
