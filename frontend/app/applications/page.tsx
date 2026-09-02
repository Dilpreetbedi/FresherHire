"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { requireFresher } from "../lib/auth";
import NotificationBell from "../components/NotificationBell";

type ApplicationStatus =
  | "applied"
  | "shortlisted"
  | "rejected"
  | "hired";

type Application = {
  id: number;
  job_id: number;
  status: ApplicationStatus;
  cover_letter: string | null;
  created_at: string;
  jobs: {
    title: string;
    location: string | null;
    job_type: string;
    experience_level: string;
  } | null;
};

export default function ApplicationsPage() {
  const router = useRouter();

  const [applications, setApplications] =
    useState<Application[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<"all" | ApplicationStatus>("all");

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    setLoading(true);
    setError("");

    try {
      const auth =
        await requireFresher();

      if (!auth.allowed) {
        setLoading(false);
        router.replace(
          auth.redirectTo!
        );
        return;
      }

      const user = auth.user;

      if (!user) {
        setLoading(false);
        router.replace("/login");
        return;
      }

      const {
        data,
        error: applicationsError,
      } = await supabase
        .from("applications")
        .select(`
          id,
          job_id,
          status,
          cover_letter,
          created_at,
          jobs (
            title,
            location,
            job_type,
            experience_level
          )
        `)
        .eq(
          "candidate_id",
          user.id
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (applicationsError) {
        console.error(
          "Applications error:",
          applicationsError
        );

        setError(
          applicationsError.message ||
            "Could not load your applications."
        );

        setLoading(false);
        return;
      }

      setApplications(
        (data || []) as unknown as Application[]
      );

      setLoading(false);
    } catch (err) {
      console.error(
        "Unexpected applications load error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading your applications."
      );

      setLoading(false);
    }
  }

  const filteredApplications =
    useMemo(() => {
      if (statusFilter === "all") {
        return applications;
      }

      return applications.filter(
        (application) =>
          application.status ===
          statusFilter
      );
    }, [
      applications,
      statusFilter,
    ]);

  const statusCounts =
    useMemo(() => {
      return {
        all: applications.length,
        applied:
          applications.filter(
            (application) =>
              application.status ===
              "applied"
          ).length,
        shortlisted:
          applications.filter(
            (application) =>
              application.status ===
              "shortlisted"
          ).length,
        hired:
          applications.filter(
            (application) =>
              application.status ===
              "hired"
          ).length,
        rejected:
          applications.filter(
            (application) =>
              application.status ===
              "rejected"
          ).length,
      };
    }, [applications]);

  function getStatusStyle(
    status: ApplicationStatus
  ) {
    switch (status) {
      case "shortlisted":
        return "border-amber-200 bg-amber-50 text-amber-700";

      case "rejected":
        return "border-red-200 bg-red-50 text-red-700";

      case "hired":
        return "border-green-200 bg-green-50 text-green-700";

      default:
        return "border-blue-200 bg-blue-50 text-blue-700";
    }
  }

  function getStatusMessageStyle(
    status: ApplicationStatus
  ) {
    switch (status) {
      case "shortlisted":
        return "border-amber-200 bg-amber-50 text-amber-800";

      case "rejected":
        return "border-red-200 bg-red-50 text-red-800";

      case "hired":
        return "border-green-200 bg-green-50 text-green-800";

      default:
        return "border-blue-200 bg-blue-50 text-blue-800";
    }
  }

  function getStatusMessage(
    status: ApplicationStatus
  ) {
    switch (status) {
      case "shortlisted":
        return "Great news — the company has shortlisted your application.";

      case "hired":
        return "Congratulations — this application has been marked as hired.";

      case "rejected":
        return "This application was not selected.";

      default:
        return "Your application has been submitted and is awaiting review.";
    }
  }

  function formatStatus(
    status: string
  ) {
    return (
      status.charAt(0).toUpperCase() +
      status.slice(1)
    );
  }

  function formatDate(
    date: string
  ) {
    return new Date(
      date
    ).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <div className="text-center">
          <p className="font-semibold">
            Loading applications...
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Fetching your application history
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">

          <Link
            href="/dashboard"
            className="text-2xl font-bold tracking-tight text-slate-950"
          >
            Fresher
            <span className="text-blue-600">
              Hire
            </span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-5">

            <Link
              href="/jobs"
              className="text-sm font-medium text-slate-600 hover:text-slate-950"
            >
              Find Jobs
            </Link>

            <Link
              href="/dashboard"
              className="hidden text-sm font-medium text-slate-600 hover:text-slate-950 sm:block"
            >
              Dashboard
            </Link>

            <NotificationBell />

          </div>

        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">

        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">

          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              Career Dashboard
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              My Applications
            </h1>

            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              Track the jobs you&apos;ve applied for and monitor changes to your application status.
            </p>
          </div>

          {applications.length > 0 && (
            <Link
              href="/jobs"
              className="w-fit rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              + Find More Jobs
            </Link>
          )}

        </div>

        {error && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <span>
                {error}
              </span>

              <button
                onClick={
                  loadApplications
                }
                className="w-fit rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {!error &&
          applications.length >
            0 && (
            <>
              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

                <StatusSummary
                  label="All"
                  value={
                    statusCounts.all
                  }
                  active={
                    statusFilter ===
                    "all"
                  }
                  onClick={() =>
                    setStatusFilter(
                      "all"
                    )
                  }
                />

                <StatusSummary
                  label="Applied"
                  value={
                    statusCounts.applied
                  }
                  active={
                    statusFilter ===
                    "applied"
                  }
                  onClick={() =>
                    setStatusFilter(
                      "applied"
                    )
                  }
                />

                <StatusSummary
                  label="Shortlisted"
                  value={
                    statusCounts.shortlisted
                  }
                  active={
                    statusFilter ===
                    "shortlisted"
                  }
                  onClick={() =>
                    setStatusFilter(
                      "shortlisted"
                    )
                  }
                />

                <StatusSummary
                  label="Hired"
                  value={
                    statusCounts.hired
                  }
                  active={
                    statusFilter ===
                    "hired"
                  }
                  onClick={() =>
                    setStatusFilter(
                      "hired"
                    )
                  }
                />

                <StatusSummary
                  label="Rejected"
                  value={
                    statusCounts.rejected
                  }
                  active={
                    statusFilter ===
                    "rejected"
                  }
                  onClick={() =>
                    setStatusFilter(
                      "rejected"
                    )
                  }
                />

              </div>

              <div className="mt-8 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">
                    Application History
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {
                      filteredApplications.length
                    }{" "}
                    application
                    {filteredApplications.length !==
                    1
                      ? "s"
                      : ""}{" "}
                    shown
                  </p>
                </div>

                {statusFilter !==
                  "all" && (
                  <button
                    onClick={() =>
                      setStatusFilter(
                        "all"
                      )
                    }
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </>
          )}

        {!error &&
          applications.length ===
            0 && (

          <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm sm:p-12">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-2xl">
              💼
            </div>

            <h2 className="mt-6 text-xl font-semibold text-slate-950">
              No applications yet
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
              You haven&apos;t applied to any jobs yet. Start exploring opportunities and apply to roles that match your skills.
            </p>

            <Link
              href="/jobs"
              className="mt-7 inline-block rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Browse Jobs →
            </Link>

          </div>
        )}

        {!error &&
          applications.length >
            0 &&
          filteredApplications.length ===
            0 && (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">

              <h2 className="text-xl font-semibold text-slate-950">
                No applications with this status
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Choose another status to view your applications.
              </p>

              <button
                onClick={() =>
                  setStatusFilter(
                    "all"
                  )
                }
                className="mt-5 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Show All Applications
              </button>

            </div>
          )}

        {filteredApplications.length >
          0 && (

          <div className="mt-6 space-y-5">

            {filteredApplications.map(
              (application) => {

                const job =
                  application.jobs;

                return (
                  <div
                    key={
                      application.id
                    }
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:p-6"
                  >

                    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">

                      <div className="min-w-0">

                        <h2 className="break-words text-xl font-semibold text-slate-950">
                          {job?.title ||
                            "Job"}
                        </h2>

                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">

                          <span>
                            📍{" "}
                            {job?.location ||
                              "Location not specified"}
                          </span>

                          <span>
                            💼{" "}
                            {job?.job_type ||
                              "Not specified"}
                          </span>

                          <span>
                            🎓{" "}
                            {job?.experience_level ||
                              "Not specified"}
                          </span>

                        </div>

                        <p className="mt-3 text-xs text-slate-400">
                          Applied on{" "}
                          {formatDate(
                            application.created_at
                          )}
                        </p>

                      </div>

                      <span
                        className={`w-fit shrink-0 rounded-full border px-4 py-2 text-xs font-semibold ${getStatusStyle(
                          application.status
                        )}`}
                      >
                        {formatStatus(
                          application.status
                        )}
                      </span>

                    </div>

                    <div
                      className={`mt-5 rounded-xl border p-4 text-sm leading-6 ${getStatusMessageStyle(
                        application.status
                      )}`}
                    >
                      {getStatusMessage(
                        application.status
                      )}
                    </div>

                    {application.cover_letter && (

                      <details className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5">

                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">
                          View Cover Letter
                        </summary>

                        <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                          {
                            application.cover_letter
                          }
                        </p>

                      </details>
                    )}

                    <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row">

                      <Link
                        href={`/jobs/${application.job_id}`}
                        className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-center text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                      >
                        View Job →
                      </Link>

                      <Link
                        href="/notifications"
                        className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-center text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                      >
                        Notifications
                      </Link>

                    </div>

                  </div>
                );
              }
            )}

          </div>
        )}

      </section>

    </main>
  );
}

function StatusSummary({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-4 text-left shadow-sm transition ${
        active
          ? "border-blue-200 bg-blue-50"
          : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/30"
      }`}
    >
      <p
        className={`text-xs font-medium uppercase tracking-wide ${
          active
            ? "text-blue-700"
            : "text-slate-500"
        }`}
      >
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-950">
        {value}
      </p>
    </button>
  );
}
