"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Company = {
  id: string;
  name: string;
  website: string | null;
  company_size: string | null;
  company_type: string | null;
  location: string | null;
  is_verified: boolean;
};

type Recruiter = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  designation: string | null;
  must_change_password: boolean;
  company: Company;
};

type JobStatus = "published" | "closed";

type Job = {
  id: number;
  title: string;
  description: string;
  skills: string;
  location: string;
  employment_type: string;
  workplace_type: string;
  openings: number;
  experience: string;
  salary: string | null;
  eligibility: string | null;
  status: JobStatus;
  application_count: number;
  created_at: string | null;
};

type ApplicationStatus =
  | "applied"
  | "shortlisted"
  | "interview"
  | "hired"
  | "rejected"
  | "withdrawn";

type CandidateSummary = {
  id: string;
  full_name: string | null;
  headline: string | null;
  location: string | null;
  degree: string | null;
  graduation_year: number | null;
};

type RecruiterApplication = {
  id: number;
  status: ApplicationStatus;
  cover_letter: string | null;
  applied_at: string | null;
  candidate: CandidateSummary;
};

type DashboardApplication = RecruiterApplication & {
  job_id: number;
  job_title: string;
};

type DashboardStats = {
  published: number;
  closed: number;
  applications: number;
  openings: number;
  applied: number;
  shortlisted: number;
  interview: number;
  hired: number;
  rejected: number;
};

type DashboardSummaryResponse = {
  recruiter: Recruiter;
  total_candidates: number;
  jobs: Job[];
  recent_applications: DashboardApplication[];
  stats: DashboardStats;
};

export default function RecruiterDashboardPage() {
  const router = useRouter();

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";

  const [recruiter, setRecruiter] =
    useState<Recruiter | null>(null);

  const [jobs, setJobs] =
    useState<Job[]>([]);

  const [applications, setApplications] =
    useState<DashboardApplication[]>([]);

  const [totalCandidates, setTotalCandidates] =
    useState(0);

  const [summaryStats, setSummaryStats] =
    useState<DashboardStats>({
      published: 0,
      closed: 0,
      applications: 0,
      openings: 0,
      applied: 0,
      shortlisted: 0,
      interview: 0,
      hired: 0,
      rejected: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [actionJobId, setActionJobId] =
    useState<number | null>(null);

  // =========================================================
  // LOAD DASHBOARD
  // =========================================================

  const initialLoadStarted =
    useRef(false);

  useEffect(() => {
    if (
      initialLoadStarted.current
    ) {
      return;
    }

    initialLoadStarted.current =
      true;

    void loadDashboard();
  }, []);

  useEffect(() => {
    const refreshWhenFocused =
      () => {
        void loadDashboard();
      };

    window.addEventListener(
      "focus",
      refreshWhenFocused
    );

    return () => {
      window.removeEventListener(
        "focus",
        refreshWhenFocused
      );
    };
  }, []);

  async function readJsonSafely(response: Response) {
    return response.json().catch(() => null);
  }

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${apiUrl}/api/recruiter/dashboard-summary`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        router.replace("/recruiter/login");
        return;
      }

      if (response.status === 403) {
        router.replace("/recruiter/change-password");
        return;
      }

      const data =
        (await readJsonSafely(response)) as
          | DashboardSummaryResponse
          | { detail?: string }
          | null;

      if (!response.ok) {
        throw new Error(
          (data as { detail?: string } | null)?.detail ||
            "Unable to load recruiter dashboard."
        );
      }

      const summary =
        data as DashboardSummaryResponse;

      if (summary.recruiter.must_change_password) {
        router.replace("/recruiter/change-password");
        return;
      }

      setRecruiter(summary.recruiter);
      setJobs(Array.isArray(summary.jobs) ? summary.jobs : []);
      setApplications(
        Array.isArray(summary.recent_applications)
          ? summary.recent_applications
          : []
      );
      setTotalCandidates(
        Number(summary.total_candidates || 0)
      );
      setSummaryStats(
        summary.stats || {
          published: 0,
          closed: 0,
          applications: 0,
          openings: 0,
          applied: 0,
          shortlisted: 0,
          interview: 0,
          hired: 0,
          rejected: 0,
        }
      );
    } catch (err) {
      console.error(
        "Recruiter dashboard error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load recruiter dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // DASHBOARD METRICS
  // =========================================================

  const stats = useMemo(() => {
    const published = jobs.filter(
      (job) => job.status === "published"
    ).length;

    const closed = jobs.filter(
      (job) => job.status === "closed"
    ).length;

    const openings = jobs
      .filter((job) => job.status === "published")
      .reduce(
        (total, job) => total + job.openings,
        0
      );

    return {
      published,
      closed,
      openings,
      totalCandidates,
      applications: summaryStats.applications,
      applied: summaryStats.applied,
      shortlisted: summaryStats.shortlisted,
      interviews: summaryStats.interview,
      hired: summaryStats.hired,
      rejected: summaryStats.rejected,
    };
  }, [jobs, totalCandidates, summaryStats]);

  const recentApplications =
    useMemo(
      () =>
        applications
          .filter(
            (application) =>
              application.status !==
              "withdrawn"
          )
          .slice(0, 6),
      [applications]
    );

  const latestPublishedJob =
    useMemo(
      () =>
        jobs.find(
          (job) =>
            job.status ===
            "published"
        ) ||
        jobs[0] ||
        null,
      [jobs]
    );

  // =========================================================
  // CLOSE / REOPEN
  // =========================================================

  async function changeJobStatus(
    job: Job
  ) {
    const newStatus:
      JobStatus =
      job.status ===
      "published"
        ? "closed"
        : "published";

    const action =
      newStatus === "closed"
        ? "close"
        : "reopen";

    const confirmed =
      window.confirm(
        `Are you sure you want to ${action} "${job.title}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionJobId(
        job.id
      );

      setError("");
      setSuccess("");

      const response =
        await fetch(
          `${apiUrl}/api/recruiter/jobs/${job.id}/status`,
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
                status:
                  newStatus,
              }),
          }
        );

      if (
        response.status ===
        401
      ) {
        router.replace(
          "/recruiter/login"
        );
        return;
      }

      if (
        response.status ===
        403
      ) {
        router.replace(
          "/recruiter/change-password"
        );
        return;
      }

      const data =
        await readJsonSafely(
          response
        );

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Unable to update job."
        );
      }

      setJobs(
        (current) =>
          current.map(
            (currentJob) =>
              currentJob.id ===
              job.id
                ? {
                    ...currentJob,
                    status:
                      data.status,
                  }
                : currentJob
          )
      );

      setSuccess(
        data.message ||
          `Job ${newStatus === "closed" ? "closed" : "reopened"} successfully.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update job."
      );
    } finally {
      setActionJobId(
        null
      );
    }
  }

  // =========================================================
  // DELETE JOB
  // =========================================================

  async function deleteJob(
    job: Job
  ) {
    if (
      job.application_count >
      0
    ) {
      setError(
        "Jobs with applications cannot be deleted. Close the job instead."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${job.title}" permanently? This action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionJobId(
        job.id
      );

      setError("");
      setSuccess("");

      const response =
        await fetch(
          `${apiUrl}/api/recruiter/jobs/${job.id}`,
          {
            method:
              "DELETE",
            credentials:
              "include",
          }
        );

      if (
        response.status ===
        401
      ) {
        router.replace(
          "/recruiter/login"
        );
        return;
      }

      if (
        response.status ===
        403
      ) {
        router.replace(
          "/recruiter/change-password"
        );
        return;
      }

      const data =
        await readJsonSafely(
          response
        );

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Unable to delete job."
        );
      }

      setJobs(
        (current) =>
          current.filter(
            (currentJob) =>
              currentJob.id !==
              job.id
          )
      );

      setApplications(
        (current) =>
          current.filter(
            (application) =>
              application.job_id !==
              job.id
          )
      );

      setSuccess(
        "Job deleted successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete job."
      );
    } finally {
      setActionJobId(
        null
      );
    }
  }

  // =========================================================
  // LOGOUT
  // =========================================================

  async function logout() {
    try {
      await fetch(
        `${apiUrl}/api/recruiter/logout`,
        {
          method:
            "POST",
          credentials:
            "include",
        }
      );
    } finally {
      router.replace(
        "/recruiter/login"
      );
      router.refresh();
    }
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

          <p className="mt-4 text-sm font-semibold text-slate-500">
            Loading recruiter dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-slate-900">
      {/* =====================================================
          NAV
      ===================================================== */}

      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/recruiter/dashboard"
            className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-950"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm text-white">
              F
            </span>

            <span>
              Fresher
              <span className="text-blue-600">
                Hire
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            <a
              href="#overview"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              Overview
            </a>

            <a
              href="#pipeline"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              Pipeline
            </a>

            <a
              href="#recent-applicants"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              Applicants
            </a>

            <Link
              href="/recruiter/candidates"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              Find Candidates
            </Link>

            <a
              href="#jobs"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              Jobs
            </a>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/recruiter/jobs/new"
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              + Post Job
            </Link>

            <button
              type="button"
              onClick={logout}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        {/* =================================================
            HEADER
        ================================================= */}

        <div
          id="overview"
          className="grid gap-5 lg:grid-cols-[1fr_360px]"
        >
          <div className="rounded-[2rem] bg-slate-950 p-7 text-white shadow-xl sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-blue-300">
                Recruiter Dashboard
              </span>

              {recruiter?.company
                .is_verified && (
                <span className="rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-xs font-bold text-green-300">
                  ✓ Verified Company
                </span>
              )}
            </div>

            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
              Welcome
              {recruiter
                ? `, ${firstName(
                    recruiter.full_name
                  )}`
                : ""}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Manage your fresher hiring pipeline,
              review applicants and keep every open role
              moving from application to hire.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/recruiter/jobs/new"
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500"
              >
                Post a New Job →
              </Link>

              <Link
                href="/recruiter/candidates"
                className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 text-sm font-bold text-cyan-100 transition hover:bg-cyan-300/15"
              >
                Find Candidates
              </Link>

              <a
                href="#recent-applicants"
                className="rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15"
              >
                Review Applicants
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
              Company
            </p>

            <h2 className="mt-3 text-2xl font-black text-slate-950">
              {recruiter?.company
                .name ||
                "Your Company"}
            </h2>

            <div className="mt-5 space-y-3 text-sm">
              <InfoRow
                label="Recruiter"
                value={
                  recruiter?.full_name ||
                  "—"
                }
              />

              <InfoRow
                label="Designation"
                value={
                  recruiter?.designation ||
                  "—"
                }
              />

              <InfoRow
                label="Location"
                value={
                  recruiter?.company
                    .location ||
                  "—"
                }
              />

              <InfoRow
                label="Company Size"
                value={
                  recruiter?.company
                    .company_size ||
                  "—"
                }
              />

              <InfoRow
                label="Company Type"
                value={
                  recruiter?.company
                    .company_type ||
                  "—"
                }
              />
            </div>

            {recruiter?.company
              .website && (
              <a
                href={
                  recruiter.company
                    .website
                }
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex text-sm font-bold text-blue-600 hover:text-blue-700"
              >
                Visit company website ↗
              </a>
            )}
          </div>
        </div>

        {/* =================================================
            MESSAGES
        ================================================= */}

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <span>
                {error}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void loadDashboard();
                  }}
                  className="rounded-lg bg-red-600 px-3 py-2 text-xs font-black text-white transition hover:bg-red-700"
                >
                  Retry Dashboard
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setError("")
                  }
                  className="px-2 py-1 font-black"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mt-6 flex items-start justify-between gap-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            <span>
              ✓ {success}
            </span>

            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
              className="font-black"
            >
              ×
            </button>
          </div>
        )}

        {/* =================================================
            PRIMARY STATS
        ================================================= */}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <StatCard
            label="Total Candidates"
            value={
              stats.totalCandidates
            }
            helper="Registered freshers"
            icon="🎓"
          />

          <StatCard
            label="Published Jobs"
            value={
              stats.published
            }
            helper="Currently live"
            icon="💼"
          />

          <StatCard
            label="Total Applicants"
            value={
              stats.applications
            }
            helper="Across all jobs"
            icon="👥"
          />

          <StatCard
            label="Shortlisted"
            value={
              stats.shortlisted
            }
            helper="Moved forward"
            icon="⭐"
          />

          <StatCard
            label="Interviews"
            value={
              stats.interviews
            }
            helper="Interview stage"
            icon="📅"
          />

          <StatCard
            label="Hired"
            value={
              stats.hired
            }
            helper="Successful hires"
            icon="🎉"
          />

          <StatCard
            label="Open Positions"
            value={
              stats.openings
            }
            helper="Live openings"
            icon="🚀"
          />
        </div>

        {/* =================================================
            QUICK ACTIONS
        ================================================= */}

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <QuickAction
            eyebrow="Discover"
            title="Find freshers"
            description={`${stats.totalCandidates} registered candidate${stats.totalCandidates === 1 ? "" : "s"} available in the talent pool.`}
            href="/recruiter/candidates"
            action="Search candidates →"
          />

          <QuickAction
            eyebrow="Create"
            title="Post a new job"
            description="Publish a fresher role and start receiving applications."
            href="/recruiter/jobs/new"
            action="Create job →"
          />

          <QuickAction
            eyebrow="Manage"
            title="Review your jobs"
            description={`${stats.published} published and ${stats.closed} closed job${stats.closed === 1 ? "" : "s"}.`}
            href="#jobs"
            action="Manage jobs →"
          />

          <QuickAction
            eyebrow="Review"
            title="Check applicants"
            description={
              stats.applications > 0
                ? `${stats.applications} active application${stats.applications === 1 ? "" : "s"} across your roles.`
                : "Applications will appear here after candidates start applying."
            }
            href={
              latestPublishedJob
                ? `/recruiter/jobs/${latestPublishedJob.id}/applications`
                : "/recruiter/jobs/new"
            }
            action={
              latestPublishedJob
                ? "Open applicants →"
                : "Post first job →"
            }
          />
        </div>

        {/* =================================================
            PIPELINE + RECENT APPLICANTS
        ================================================= */}

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <section
            id="pipeline"
            className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
                Hiring Pipeline
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Application stages
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                A live view of where candidates are in your hiring process.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <PipelineRow
                label="Applied"
                value={
                  stats.applied
                }
                total={
                  stats.applications
                }
              />

              <PipelineRow
                label="Shortlisted"
                value={
                  stats.shortlisted
                }
                total={
                  stats.applications
                }
              />

              <PipelineRow
                label="Interview"
                value={
                  stats.interviews
                }
                total={
                  stats.applications
                }
              />

              <PipelineRow
                label="Hired"
                value={
                  stats.hired
                }
                total={
                  stats.applications
                }
              />

              <PipelineRow
                label="Rejected"
                value={
                  stats.rejected
                }
                total={
                  stats.applications
                }
              />
            </div>
          </section>

          <section
            id="recent-applicants"
            className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
                  Recent Applicants
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  Latest candidate activity
                </h2>
              </div>

              <p className="text-sm text-slate-500">
                {stats.applications} active
                application
                {stats.applications ===
                1
                  ? ""
                  : "s"}
              </p>
            </div>

            {recentApplications.length ===
            0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                <div className="text-3xl">
                  👤
                </div>

                <p className="mt-3 font-black text-slate-900">
                  No applicants yet
                </p>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Once candidates apply to your jobs,
                  their latest activity will appear here.
                </p>
              </div>
            ) : (
              <div className="mt-5 divide-y divide-slate-100">
                {recentApplications.map(
                  (
                    application
                  ) => (
                    <div
                      key={
                        application.id
                      }
                      className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-black text-blue-600">
                          {initials(
                            application
                              .candidate
                              .full_name
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-black text-slate-950">
                            {application
                              .candidate
                              .full_name ||
                              "Candidate"}
                          </p>

                          <p className="mt-1 truncate text-sm text-slate-500">
                            {application
                              .candidate
                              .headline ||
                              application
                                .candidate
                                .degree ||
                              "Fresher candidate"}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Applied for{" "}
                            <span className="font-semibold text-slate-600">
                              {
                                application.job_title
                              }
                            </span>{" "}
                            •{" "}
                            {formatDate(
                              application.applied_at
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <ApplicationStatusBadge
                          status={
                            application.status
                          }
                        />

                        <Link
                          href={`/recruiter/jobs/${application.job_id}/applications`}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
                        >
                          Review
                        </Link>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        </div>

        {/* =================================================
            JOBS
        ================================================= */}

        <section
          id="jobs"
          className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
                Job Management
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Your Jobs
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Manage listings, review applicants,
                close positions or reopen hiring.
              </p>
            </div>

            <Link
              href="/recruiter/jobs/new"
              className="inline-flex w-fit rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-600"
            >
              + Post New Job
            </Link>
          </div>

          {jobs.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
              <div className="text-4xl">
                💼
              </div>

              <h3 className="mt-5 text-xl font-black text-slate-950">
                No jobs posted yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Create your first fresher job listing
                and start receiving applications.
              </p>

              <Link
                href="/recruiter/jobs/new"
                className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
              >
                Post Your First Job
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {jobs.map(
                (job) => (
                  <JobCard
                    key={
                      job.id
                    }
                    job={
                      job
                    }
                    busy={
                      actionJobId ===
                      job.id
                    }
                    onStatusChange={() =>
                      changeJobStatus(
                        job
                      )
                    }
                    onDelete={() =>
                      deleteJob(
                        job
                      )
                    }
                  />
                )
              )}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

// =========================================================
// INFO ROW
// =========================================================

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <span className="text-slate-500">
        {label}
      </span>

      <span className="text-right font-bold text-slate-900">
        {value}
      </span>
    </div>
  );
}

// =========================================================
// STAT
// =========================================================

function StatCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: number;
  helper: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-slate-500">
          {label}
        </p>

        <span className="text-lg">
          {icon}
        </span>
      </div>

      <p className="mt-3 text-3xl font-black text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {helper}
      </p>
    </div>
  );
}

// =========================================================
// QUICK ACTION
// =========================================================

function QuickAction({
  eyebrow,
  title,
  description,
  href,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
        {eyebrow}
      </p>

      <h3 className="mt-2 text-lg font-black text-slate-950">
        {title}
      </h3>

      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
        {description}
      </p>

      {href.startsWith("#") ? (
        <a
          href={href}
          className="mt-4 inline-flex text-sm font-black text-blue-600 hover:text-blue-700"
        >
          {action}
        </a>
      ) : (
        <Link
          href={href}
          className="mt-4 inline-flex text-sm font-black text-blue-600 hover:text-blue-700"
        >
          {action}
        </Link>
      )}
    </div>
  );
}

// =========================================================
// PIPELINE ROW
// =========================================================

function PipelineRow({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const width =
    total > 0
      ? Math.min(
          100,
          Math.round(
            (value /
              total) *
              100
          )
        )
      : 0;

  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-slate-700">
          {label}
        </p>

        <p className="text-sm font-black text-slate-950">
          {value}
        </p>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{
            width:
              `${width}%`,
          }}
        />
      </div>
    </div>
  );
}

// =========================================================
// JOB CARD
// =========================================================

function JobCard({
  job,
  busy,
  onStatusChange,
  onDelete,
}: {
  job: Job;
  busy: boolean;
  onStatusChange: () => void;
  onDelete: () => void;
}) {
  const skills =
    job.skills
      .split(",")
      .map((skill) =>
        skill.trim()
      )
      .filter(Boolean)
      .slice(0, 6);

  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6 sm:p-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              status={
                job.status
              }
            />

            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
              {job.employment_type}
            </span>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
              {job.workplace_type}
            </span>
          </div>

          <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-950">
            {job.title}
          </h3>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
            <span>
              📍 {job.location}
            </span>

            <span>
              💼 {job.experience}
            </span>

            <span>
              👥 {job.openings}{" "}
              {job.openings === 1
                ? "opening"
                : "openings"}
            </span>

            <span>
              👤 {job.application_count}{" "}
              {job.application_count ===
              1
                ? "applicant"
                : "applicants"}
            </span>
          </div>

          {job.salary && (
            <p className="mt-3 text-sm font-bold text-slate-700">
              Salary: {job.salary}
            </p>
          )}

          <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">
            {job.description}
          </p>

          {skills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {skills.map(
                (skill) => (
                  <span
                    key={
                      skill
                    }
                    className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
                  >
                    {skill}
                  </span>
                )
              )}
            </div>
          )}

          <p className="mt-4 text-xs text-slate-400">
            Posted{" "}
            {formatDate(
              job.created_at
            )}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 lg:max-w-80 lg:justify-end">
          <Link
            href={`/recruiter/jobs/${job.id}/applications`}
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-600"
          >
            Applicants (
            {job.application_count}
            )
          </Link>

          <Link
            href={`/recruiter/jobs/${job.id}/edit`}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
          >
            Edit
          </Link>

          <button
            type="button"
            onClick={
              onStatusChange
            }
            disabled={
              busy
            }
            className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              job.status ===
              "published"
                ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
            }`}
          >
            {busy
              ? "Working..."
              : job.status ===
                "published"
              ? "Close Job"
              : "Reopen Job"}
          </button>

          <button
            type="button"
            onClick={
              onDelete
            }
            disabled={
              busy ||
              job.application_count >
                0
            }
            title={
              job.application_count >
              0
                ? "Jobs with applicants cannot be deleted. Close the job instead."
                : "Delete job"
            }
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Delete
          </button>
        </div>
      </div>

      {job.application_count >
        0 && (
        <p className="mt-5 border-t border-slate-200 pt-4 text-xs text-slate-400">
          This job cannot be deleted because candidates
          have already applied. Close it to stop new
          applications while keeping hiring history.
        </p>
      )}
    </article>
  );
}

// =========================================================
// JOB STATUS
// =========================================================

function StatusBadge({
  status,
}: {
  status: JobStatus;
}) {
  if (
    status === "published"
  ) {
    return (
      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
        ● Published
      </span>
    );
  }

  return (
    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-600">
      ● Closed
    </span>
  );
}

// =========================================================
// APPLICATION STATUS
// =========================================================

function ApplicationStatusBadge({
  status,
}: {
  status: ApplicationStatus;
}) {
  const styles: Record<
    ApplicationStatus,
    string
  > = {
    applied:
      "bg-blue-50 text-blue-700",
    shortlisted:
      "bg-violet-50 text-violet-700",
    interview:
      "bg-amber-50 text-amber-700",
    hired:
      "bg-green-50 text-green-700",
    rejected:
      "bg-red-50 text-red-700",
    withdrawn:
      "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`rounded-full px-3 py-1.5 text-xs font-black capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

// =========================================================
// HELPERS
// =========================================================

function firstName(
  value: string
) {
  const clean =
    value.trim();

  if (!clean) {
    return "Recruiter";
  }

  return (
    clean.split(/\s+/)[0] ||
    "Recruiter"
  );
}

function initials(
  value: string | null
) {
  if (!value) {
    return "C";
  }

  const parts =
    value
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);

  if (
    parts.length === 0
  ) {
    return "C";
  }

  return parts
    .map(
      (part) =>
        part[0]
          ?.toUpperCase() ||
        ""
    )
    .join("");
}

function formatDate(
  value: string | null
) {
  if (!value) {
    return "recently";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "recently";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}
