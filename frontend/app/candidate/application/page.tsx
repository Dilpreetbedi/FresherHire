"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  ReactNode,
} from "react";
import {
  useRouter,
} from "next/navigation";


type ApplicationStatus =
  | "applied"
  | "shortlisted"
  | "interview"
  | "hired"
  | "rejected"
  | "withdrawn";


type JobStatus =
  | "published"
  | "closed";


type Application = {
  id: number;

  status:
    ApplicationStatus;

  cover_letter:
    string | null;

  applied_at:
    string | null;

  job: {
    id: number;

    title: string;

    location: string;

    employment_type:
      string;

    workplace_type:
      string;

    job_status:
      JobStatus;

    company: {
      id: number;

      name: string;

      is_verified:
        boolean;
    };
  };
};


export default function CandidateApplicationsPage() {
  const router =
    useRouter();


  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";


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
    success,
    setSuccess,
  ] =
    useState("");


  const [
    withdrawingId,
    setWithdrawingId,
  ] =
    useState<number | null>(
      null
    );


  // =========================================================
  // LOAD
  // =========================================================

  useEffect(() => {
    loadApplications();
  }, []);


  async function loadApplications() {
    try {
      setLoading(
        true
      );

      setError("");


      const response =
        await fetch(
          `${apiUrl}/api/candidate/applications`,
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
          "/login"
        );

        return;
      }


      const data =
        await response.json();


      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to load applications."
        );
      }


      setApplications(
        data
      );

    } catch (err) {
      console.error(
        "Applications error:",
        err
      );


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


  // =========================================================
  // STATS
  // =========================================================

  const stats =
    useMemo(() => {
      return {
        total:
          applications.length,

        active:
          applications.filter(
            (application) =>
              ![
                "hired",
                "rejected",
                "withdrawn",
              ].includes(
                application.status
              )
          ).length,

        shortlisted:
          applications.filter(
            (application) =>
              application.status ===
              "shortlisted"
          ).length,

        interview:
          applications.filter(
            (application) =>
              application.status ===
              "interview"
          ).length,

        hired:
          applications.filter(
            (application) =>
              application.status ===
              "hired"
          ).length,
      };

    }, [
      applications,
    ]);


  // =========================================================
  // WITHDRAW
  // =========================================================

  async function withdrawApplication(
    application:
      Application
  ) {
    if (
      !canWithdraw(
        application.status
      )
    ) {
      return;
    }


    const confirmed =
      window.confirm(
        `Withdraw your application for "${application.job.title}"?\n\nYou can apply again later if the job is still open.`
      );


    if (!confirmed) {
      return;
    }


    try {
      setWithdrawingId(
        application.id
      );

      setError("");
      setSuccess("");


      const response =
        await fetch(
          `${apiUrl}/api/candidate/applications/${application.id}/withdraw`,
          {
            method:
              "PATCH",

            credentials:
              "include",
          }
        );


      if (
        response.status === 401
      ) {
        router.replace(
          "/login"
        );

        return;
      }


      const data =
        await response.json();


      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to withdraw application."
        );
      }


      setApplications(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              application.id
                ? {
                    ...item,

                    status:
                      "withdrawn",
                  }
                : item
          )
      );


      setSuccess(
        `Application for "${application.job.title}" withdrawn successfully.`
      );

    } catch (err) {
      console.error(
        "Withdraw error:",
        err
      );


      setError(
        err instanceof Error
          ? err.message
          : "Unable to withdraw application."
      );

    } finally {
      setWithdrawingId(
        null
      );
    }
  }


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="text-center">

          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />


          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading your applications...
          </p>

        </div>

      </main>
    );
  }


  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">

          <Link
            href="/"
            className="text-2xl font-bold tracking-tight text-slate-950"
          >
            Fresher

            <span className="text-blue-600">
              Hire
            </span>
          </Link>


          <div className="flex items-center gap-3">

            <Link
              href="/jobs"
              className="text-sm font-semibold text-slate-600 transition hover:text-blue-600"
            >
              Browse Jobs
            </Link>


            <Link
              href="/candidate/dashboard"
              className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Dashboard
            </Link>

          </div>

        </div>

      </nav>


      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="border-b border-slate-200 bg-white">

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">

          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
            Candidate Dashboard
          </p>


          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
            My Applications
          </h1>


          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            Track every application,
            follow your hiring progress,
            and manage applications you
            no longer want to pursue.
          </p>

        </div>

      </section>


      {/* =====================================================
          CONTENT
      ===================================================== */}

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">

        {/* MESSAGES */}

        {error && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

            <span>
              {error}
            </span>


            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="font-bold"
            >
              ×
            </button>

          </div>
        )}


        {success && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">

            <span>
              ✓ {success}
            </span>


            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
              className="font-bold"
            >
              ×
            </button>

          </div>
        )}


        {/* STATS */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

          <StatCard
            label="Total"
            value={
              stats.total
            }
          />


          <StatCard
            label="Active"
            value={
              stats.active
            }
          />


          <StatCard
            label="Shortlisted"
            value={
              stats.shortlisted
            }
          />


          <StatCard
            label="Interview"
            value={
              stats.interview
            }
          />


          <StatCard
            label="Hired"
            value={
              stats.hired
            }
          />

        </div>


        <div className="mb-6 mt-10">

          <h2 className="text-xl font-bold">
            Applications
          </h2>


          <p className="mt-1 text-sm text-slate-500">
            {applications.length}{" "}
            {applications.length === 1
              ? "application"
              : "applications"}
          </p>

        </div>


        {/* EMPTY */}

        {applications.length === 0 ? (

          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-xl">
              📄
            </div>


            <h2 className="mt-5 text-xl font-bold">
              No applications yet
            </h2>


            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Browse fresher-friendly
              jobs and apply to
              opportunities matching
              your interests.
            </p>


            <Link
              href="/jobs"
              className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Browse Jobs →
            </Link>

          </div>

        ) : (

          <div className="space-y-6">

            {applications.map(
              (application) => (

                <ApplicationCard
                  key={
                    application.id
                  }
                  application={
                    application
                  }
                  withdrawing={
                    withdrawingId ===
                    application.id
                  }
                  onWithdraw={() =>
                    withdrawApplication(
                      application
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


// =========================================================
// APPLICATION CARD
// =========================================================

function ApplicationCard({
  application,
  withdrawing,
  onWithdraw,
}: {
  application:
    Application;

  withdrawing:
    boolean;

  onWithdraw:
    () => void;
}) {
  const [
    showCoverLetter,
    setShowCoverLetter,
  ] =
    useState(false);


  const jobClosed =
    application.job.job_status ===
    "closed";


  const withdrawn =
    application.status ===
    "withdrawn";


  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

      <div className="p-6 sm:p-7">

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

          <div className="min-w-0 flex-1">

            {/* COMPANY */}

            <div className="flex flex-wrap items-center gap-2">

              <p className="text-sm font-semibold text-slate-500">
                {
                  application
                    .job
                    .company
                    .name
                }
              </p>


              {application
                .job
                .company
                .is_verified && (

                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  ✓ Verified
                </span>

              )}


              {jobClosed && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  Job Closed
                </span>
              )}

            </div>


            {/* TITLE */}

            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              {
                application
                  .job
                  .title
              }
            </h2>


            {/* META */}

            <div className="mt-4 flex flex-wrap gap-2">

              <Badge>
                📍{" "}
                {
                  application
                    .job
                    .location
                }
              </Badge>


              <Badge>
                {
                  application
                    .job
                    .workplace_type
                }
              </Badge>


              <Badge>
                {
                  application
                    .job
                    .employment_type
                }
              </Badge>

            </div>


            <p className="mt-4 text-xs text-slate-400">
              Applied{" "}
              {formatDate(
                application.applied_at
              )}
            </p>

          </div>


          {/* STATUS */}

          <div className="shrink-0 lg:text-right">

            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Application Status
            </p>


            <ApplicationStatusBadge
              status={
                application.status
              }
            />

          </div>

        </div>


        {/* TIMELINE */}

        <div className="mt-7 border-t border-slate-100 pt-6">

          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Application Progress
          </p>


          <ApplicationTimeline
            status={
              application.status
            }
          />

        </div>


        {/* COVER LETTER */}

        {application.cover_letter && (
          <div className="mt-6 border-t border-slate-100 pt-6">

            <button
              type="button"
              onClick={() =>
                setShowCoverLetter(
                  (current) =>
                    !current
                )
              }
              className="flex w-full items-center justify-between text-left"
            >

              <span className="text-sm font-semibold text-slate-800">
                Your Cover Letter
              </span>


              <span className="text-sm font-semibold text-blue-600">
                {showCoverLetter
                  ? "Hide"
                  : "View"}
              </span>

            </button>


            {showCoverLetter && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">

                <p className="whitespace-pre-line text-sm leading-7 text-slate-700">
                  {
                    application
                      .cover_letter
                  }
                </p>

              </div>
            )}

          </div>
        )}


        {/* CLOSED / WITHDRAWN MESSAGE */}

        {jobClosed &&
          !withdrawn && (

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">

            <p className="text-sm font-semibold text-amber-800">
              This job is now closed.
            </p>


            <p className="mt-1 text-sm leading-6 text-amber-700">
              Your existing application
              is still saved and the
              recruiter can continue
              processing it.
            </p>

          </div>

        )}


        {withdrawn && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">

            <p className="text-sm font-semibold text-slate-700">
              Application withdrawn
            </p>


            <p className="mt-1 text-sm leading-6 text-slate-500">
              The recruiter no longer
              sees this as an active
              application.
              {!jobClosed &&
                " You can apply again while the job is still open."}
            </p>

          </div>
        )}


        {/* ACTIONS */}

        <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-6">

          {!jobClosed && (
            <Link
              href={`/jobs/${application.job.id}`}
              className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {withdrawn
                ? "View & Apply Again"
                : "View Job"}
            </Link>
          )}


          {canWithdraw(
            application.status
          ) && (

            <button
              type="button"
              onClick={
                onWithdraw
              }
              disabled={
                withdrawing
              }
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {withdrawing
                ? "Withdrawing..."
                : "Withdraw Application"}
            </button>

          )}

        </div>

      </div>

    </article>
  );
}


// =========================================================
// APPLICATION TIMELINE
// =========================================================

function ApplicationTimeline({
  status,
}: {
  status:
    ApplicationStatus;
}) {
  const stages = [
    "applied",
    "shortlisted",
    "interview",
    "hired",
  ] as const;


  const labels:
    Record<
      typeof stages[number],
      string
    > = {
      applied:
        "Applied",

      shortlisted:
        "Shortlisted",

      interview:
        "Interview",

      hired:
        "Hired",
    };


  const positiveIndex =
    stages.indexOf(
      status as
        typeof stages[number]
    );


  const isRejected =
    status ===
    "rejected";


  const isWithdrawn =
    status ===
    "withdrawn";


  return (
    <div className="mt-5">

      <div className="grid grid-cols-4 gap-2">

        {stages.map(
          (
            stage,
            index
          ) => {
            let complete =
              false;


            let current =
              false;


            if (
              positiveIndex >= 0
            ) {
              complete =
                index <=
                positiveIndex;

              current =
                index ===
                positiveIndex;
            }

            else if (
              (
                isRejected ||
                isWithdrawn
              )
              &&
              stage ===
                "applied"
            ) {
              complete =
                true;
            }


            return (
              <div
                key={
                  stage
                }
              >

                <div
                  className={`h-2 rounded-full ${
                    complete
                      ? current
                        ? "bg-blue-600"
                        : "bg-green-500"
                      : "bg-slate-200"
                  }`}
                />


                <p
                  className={`mt-2 text-xs font-medium ${
                    complete
                      ? "text-slate-800"
                      : "text-slate-400"
                  }`}
                >
                  {
                    labels[
                      stage
                    ]
                  }
                </p>

              </div>
            );
          }
        )}

      </div>


      {isRejected && (
        <div className="mt-5 rounded-xl bg-red-50 p-4">

          <p className="text-sm font-semibold text-red-700">
            Application Rejected
          </p>


          <p className="mt-1 text-xs leading-5 text-red-600">
            The recruiter has closed
            this application.
          </p>

        </div>
      )}


      {isWithdrawn && (
        <div className="mt-5 rounded-xl bg-slate-100 p-4">

          <p className="text-sm font-semibold text-slate-700">
            Application Withdrawn
          </p>


          <p className="mt-1 text-xs leading-5 text-slate-500">
            You withdrew this
            application.
          </p>

        </div>
      )}

    </div>
  );
}


// =========================================================
// STATUS BADGE
// =========================================================

function ApplicationStatusBadge({
  status,
}: {
  status:
    ApplicationStatus;
}) {
  const styles:
    Record<
      ApplicationStatus,
      string
    > = {
      applied:
        "bg-amber-100 text-amber-700",

      shortlisted:
        "bg-blue-100 text-blue-700",

      interview:
        "bg-purple-100 text-purple-700",

      hired:
        "bg-emerald-100 text-emerald-700",

      rejected:
        "bg-red-100 text-red-700",

      withdrawn:
        "bg-slate-200 text-slate-600",
    };


  const labels:
    Record<
      ApplicationStatus,
      string
    > = {
      applied:
        "Applied",

      shortlisted:
        "Shortlisted",

      interview:
        "Interview",

      hired:
        "Hired",

      rejected:
        "Rejected",

      withdrawn:
        "Withdrawn",
    };


  return (
    <span
      className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}


// =========================================================
// BADGE
// =========================================================

function Badge({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
      {children}
    </span>
  );
}


// =========================================================
// STAT
// =========================================================

function StatCard({
  label,
  value,
}: {
  label:
    string;

  value:
    number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <p className="text-sm text-slate-500">
        {label}
      </p>


      <p className="mt-2 text-3xl font-bold text-slate-950">
        {value}
      </p>

    </div>
  );
}


// =========================================================
// HELPERS
// =========================================================

function canWithdraw(
  status:
    ApplicationStatus
) {
  return [
    "applied",
    "shortlisted",
    "interview",
  ].includes(
    status
  );
}


function formatDate(
  value:
    string | null
) {
  if (!value) {
    return "recently";
  }


  const date =
    new Date(
      value
    );


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
      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",
    }
  );
}