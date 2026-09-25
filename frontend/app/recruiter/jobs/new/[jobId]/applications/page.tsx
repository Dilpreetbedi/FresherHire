"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";


type ApplicationStatus =
  | "applied"
  | "shortlisted"
  | "interview"
  | "hired"
  | "rejected";


type Candidate = {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  headline: string | null;
  location: string | null;
  graduation_year: number | null;
  degree: string | null;
  skills: string | null;
  education: string | null;
  internships: string | null;
  projects: string | null;
  experience: string | null;
  bio: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  resume_url: string | null;
  profile_completion: number;
};


type Application = {
  id: number;
  status: ApplicationStatus;
  cover_letter: string | null;
  applied_at: string | null;
  candidate: Candidate;
};


type JobInfo = {
  id: number;
  title: string;
  location: string;
  employment_type: string;
  workplace_type: string;
  openings: number;
  status: string;
};


export default function RecruiterApplicationsPage() {
  const params = useParams();
  const router = useRouter();

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";

  const rawJobId =
    Array.isArray(
      params.jobId
    )
      ? params.jobId[0]
      : params.jobId;

  const jobId =
    Number(rawJobId);

  const [
    job,
    setJob,
  ] =
    useState<JobInfo | null>(
      null
    );

  const [
    applications,
    setApplications,
  ] =
    useState<Application[]>(
      []
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    updatingId,
    setUpdatingId,
  ] =
    useState<number | null>(
      null
    );


  useEffect(() => {
    if (
      !Number.isInteger(jobId) ||
      jobId <= 0
    ) {
      setError(
        "Invalid job."
      );

      setLoading(
        false
      );

      return;
    }

    loadApplications();

  }, [jobId]);


  async function loadApplications() {
    try {
      setLoading(
        true
      );

      setError("");

      const response =
        await fetch(
          `${apiUrl}/api/recruiter/jobs/${jobId}/applications`,
          {
            credentials:
              "include",

            cache:
              "no-store",
          }
        );

      if (
        response.status === 401
      ) {
        router.replace(
          "/recruiter/login"
        );

        return;
      }

      const data =
        await response.json();

      if (
        response.status === 403 &&
        data.detail ===
          "Please change your temporary password first."
      ) {
        router.replace(
          "/recruiter/change-password"
        );

        return;
      }

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to load applications."
        );
      }

      setJob(
        data.job
      );

      setApplications(
        data.applications || []
      );

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load applications."
      );

    } finally {
      setLoading(
        false
      );
    }
  }


  async function updateStatus(
    applicationId: number,
    status: ApplicationStatus
  ) {
    try {
      setUpdatingId(
        applicationId
      );

      setError("");

      const response =
        await fetch(
          `${apiUrl}/api/recruiter/applications/${applicationId}/status`,
          {
            method:
              "PATCH",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                status,
              }),
          }
        );

      if (
        response.status === 401
      ) {
        router.replace(
          "/recruiter/login"
        );

        return;
      }

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to update status."
        );
      }

      setApplications(
        (current) =>
          current.map(
            (application) =>
              application.id ===
              applicationId
                ? {
                    ...application,
                    status:
                      data.status,
                  }
                : application
          )
      );

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update status."
      );

    } finally {
      setUpdatingId(
        null
      );
    }
  }


  const stats =
    useMemo(() => {
      return {
        total:
          applications.length,

        applied:
          applications.filter(
            (item) =>
              item.status ===
              "applied"
          ).length,

        shortlisted:
          applications.filter(
            (item) =>
              item.status ===
              "shortlisted"
          ).length,

        interview:
          applications.filter(
            (item) =>
              item.status ===
              "interview"
          ).length,

        hired:
          applications.filter(
            (item) =>
              item.status ===
              "hired"
          ).length,

        rejected:
          applications.filter(
            (item) =>
              item.status ===
              "rejected"
          ).length,
      };

    }, [
      applications,
    ]);


  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="text-center">

          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading applicants...
          </p>

        </div>

      </main>
    );
  }


  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      <nav className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">

          <Link
            href="/"
            className="text-2xl font-bold"
          >
            Fresher
            <span className="text-blue-600">
              Hire
            </span>
          </Link>

          <Link
            href="/recruiter/dashboard"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold"
          >
            Recruiter Dashboard
          </Link>

        </div>

      </nav>


      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">

        <Link
          href="/recruiter/dashboard"
          className="text-sm text-slate-500"
        >
          ← Back to Dashboard
        </Link>


        {job && (
          <div className="mt-6">

            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              Applicants
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              {job.title}
            </h1>

            <p className="mt-3 text-sm text-slate-500">
              {job.location}
              {" • "}
              {job.workplace_type}
              {" • "}
              {job.employment_type}
              {" • "}
              {job.openings} openings
            </p>

          </div>
        )}


        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}


        <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">

          <Stat
            label="Total"
            value={stats.total}
          />

          <Stat
            label="Applied"
            value={stats.applied}
          />

          <Stat
            label="Shortlisted"
            value={stats.shortlisted}
          />

          <Stat
            label="Interview"
            value={stats.interview}
          />

          <Stat
            label="Hired"
            value={stats.hired}
          />

          <Stat
            label="Rejected"
            value={stats.rejected}
          />

        </div>


        {applications.length === 0 ? (

          <div className="mt-8 rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center">

            <h2 className="text-xl font-bold">
              No applications yet
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Candidates who apply
              for this job will appear here.
            </p>

          </div>

        ) : (

          <div className="mt-8 space-y-6">

            {applications.map(
              (application) => (

                <ApplicantCard
                  key={
                    application.id
                  }
                  application={
                    application
                  }
                  apiUrl={
                    apiUrl
                  }
                  updating={
                    updatingId ===
                    application.id
                  }
                  onStatusChange={
                    (status) =>
                      updateStatus(
                        application.id,
                        status
                      )
                  }
                />

              )
            )}

          </div>

        )}

      </section>

    </main>
  );
}


function ApplicantCard({
  application,
  apiUrl,
  updating,
  onStatusChange,
}: {
  application: Application;
  apiUrl: string;
  updating: boolean;

  onStatusChange:
    (
      status: ApplicationStatus
    ) => void;
}) {
  const candidate =
    application.candidate;

  const skills =
    candidate.skills
      ?.split(",")
      .map(
        (skill) =>
          skill.trim()
      )
      .filter(Boolean) ||
    [];


  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

        <div className="flex gap-4">

          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-lg font-bold text-blue-700">
            {getInitials(
              candidate.full_name
            )}
          </div>

          <div>

            <div className="flex flex-wrap items-center gap-3">

              <h2 className="text-xl font-bold">
                {candidate.full_name}
              </h2>

              <StatusBadge
                status={
                  application.status
                }
              />

            </div>

            {candidate.headline && (
              <p className="mt-1 text-sm font-medium text-slate-600">
                {candidate.headline}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">

              <span>
                ✉ {candidate.email}
              </span>

              {candidate.phone && (
                <span>
                  ☎ {candidate.phone}
                </span>
              )}

              {candidate.location && (
                <span>
                  📍 {candidate.location}
                </span>
              )}

            </div>

          </div>

        </div>


        <div className="min-w-48">

          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Hiring Status
          </label>

          <select
            value={
              application.status
            }
            disabled={
              updating
            }
            onChange={
              (event) =>
                onStatusChange(
                  event.target.value
                  as ApplicationStatus
                )
            }
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
          >

            <option value="applied">
              Applied
            </option>

            <option value="shortlisted">
              Shortlisted
            </option>

            <option value="interview">
              Interview
            </option>

            <option value="hired">
              Hired
            </option>

            <option value="rejected">
              Rejected
            </option>

          </select>

        </div>

      </div>


      <div className="mt-6 grid gap-4 md:grid-cols-3">

        <InfoBox
          label="Degree"
          value={
            candidate.degree ||
            "Not provided"
          }
        />

        <InfoBox
          label="Graduation"
          value={
            candidate.graduation_year
              ? String(
                  candidate.graduation_year
                )
              : "Not provided"
          }
        />

        <InfoBox
          label="Profile Completion"
          value={
            `${candidate.profile_completion}%`
          }
        />

      </div>


      {skills.length > 0 && (
        <div className="mt-6">

          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Skills
          </p>

          <div className="mt-3 flex flex-wrap gap-2">

            {skills.map(
              (skill) => (

                <span
                  key={skill}
                  className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700"
                >
                  {skill}
                </span>

              )
            )}

          </div>

        </div>
      )}


      {application.cover_letter && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">

          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Cover Letter
          </p>

          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
            {application.cover_letter}
          </p>

        </div>
      )}


      {candidate.bio && (
        <div className="mt-6">

          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            About Candidate
          </p>

          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
            {candidate.bio}
          </p>

        </div>
      )}


      {candidate.education && (
        <DetailSection
          title="Education"
          value={
            candidate.education
          }
        />
      )}


      {candidate.internships && (
        <DetailSection
          title="Internships"
          value={
            candidate.internships
          }
        />
      )}


      {candidate.projects && (
        <DetailSection
          title="Projects"
          value={
            candidate.projects
          }
        />
      )}


      {candidate.experience && (
        <DetailSection
          title="Experience"
          value={
            candidate.experience
          }
        />
      )}


      <div className="mt-6 flex flex-wrap gap-3">

        {candidate.resume_url && (
          <a
            href={
              candidate.resume_url
                .startsWith("http")
                ? candidate.resume_url
                : `${apiUrl}${candidate.resume_url}`
            }
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
          >
            View Resume ↗
          </a>
        )}


        {candidate.linkedin_url && (
          <a
            href={
              normalizeUrl(
                candidate.linkedin_url
              )
            }
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border px-4 py-2.5 text-sm font-semibold"
          >
            LinkedIn ↗
          </a>
        )}


        {candidate.github_url && (
          <a
            href={
              normalizeUrl(
                candidate.github_url
              )
            }
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border px-4 py-2.5 text-sm font-semibold"
          >
            GitHub ↗
          </a>
        )}


        {candidate.portfolio_url && (
          <a
            href={
              normalizeUrl(
                candidate.portfolio_url
              )
            }
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border px-4 py-2.5 text-sm font-semibold"
          >
            Portfolio ↗
          </a>
        )}

      </div>


      <p className="mt-5 text-xs text-slate-400">
        Applied{" "}
        {formatDate(
          application.applied_at
        )}
      </p>

    </article>
  );
}


function Stat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold">
        {value}
      </p>

    </div>
  );
}


function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">

      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold">
        {value}
      </p>

    </div>
  );
}


function DetailSection({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="mt-6 border-t border-slate-100 pt-6">

      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
        {title}
      </p>

      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
        {value}
      </p>

    </div>
  );
}


function StatusBadge({
  status,
}: {
  status: ApplicationStatus;
}) {
  const styles:
    Record<
      ApplicationStatus,
      string
    > = {
      applied:
        "bg-amber-50 text-amber-700",

      shortlisted:
        "bg-blue-50 text-blue-700",

      interview:
        "bg-purple-50 text-purple-700",

      hired:
        "bg-green-50 text-green-700",

      rejected:
        "bg-red-50 text-red-700",
    };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}


function getInitials(
  value: string
) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (part) =>
        part[0]
          ?.toUpperCase()
    )
    .join("");
}


function formatDate(
  value: string | null
) {
  if (!value) {
    return "recently";
  }

  return new Date(
    value
  ).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}


function normalizeUrl(
  value: string
) {
  if (
    value.startsWith(
      "http://"
    ) ||
    value.startsWith(
      "https://"
    )
  ) {
    return value;
  }

  return `https://${value}`;
}