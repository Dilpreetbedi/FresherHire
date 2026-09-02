"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { requireCompany } from "../../lib/auth";
import { useRouter } from "next/navigation";
import NotificationBell from "../../components/NotificationBell";

type Job = {
  id: number;
  title: string;
  description: string;
  required_skills: string[];
  location: string;
  job_type: string;
  experience_level: string;
  salary_min: number | null;
  salary_max: number | null;
  is_active: boolean;
  created_at: string;
};

export default function MyJobsPage() {
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [updatingJobId, setUpdatingJobId] =
    useState<number | null>(null);

  const [deletingJobId, setDeletingJobId] =
    useState<number | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    setLoading(true);
    setError("");

    try {
      const auth = await requireCompany();

      if (!auth.allowed) {
        setLoading(false);
        router.replace(auth.redirectTo!);
        return;
      }

      const user = auth.user;

      if (!user) {
        setLoading(false);
        router.replace("/login");
        return;
      }

      const { data, error: jobsError } = await supabase
        .from("jobs")
        .select("*")
        .eq("company_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (jobsError) {
        console.error(jobsError);
        setError(jobsError.message);
        setLoading(false);
        return;
      }

      setJobs(data || []);
      setLoading(false);
    } catch (err) {
      console.error(
        "Unexpected jobs load error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading jobs."
      );

      setLoading(false);
    }
  }

  async function toggleJob(job: Job) {
    if (
      updatingJobId === job.id ||
      deletingJobId === job.id
    ) {
      return;
    }

    setUpdatingJobId(job.id);
    setError("");

    try {
      const auth =
        await requireCompany();

      if (!auth.allowed) {
        setUpdatingJobId(null);
        router.replace(
          auth.redirectTo!
        );
        return;
      }

      const user = auth.user;

      if (!user) {
        setUpdatingJobId(null);
        router.replace("/login");
        return;
      }

      const nextActiveState =
        !job.is_active;

      const {
        data: updatedJob,
        error: updateError,
      } = await supabase
        .from("jobs")
        .update({
          is_active:
            nextActiveState,
        })
        .eq("id", job.id)
        .eq(
          "company_id",
          user.id
        )
        .select("id, is_active")
        .maybeSingle();

      if (updateError) {
        console.error(
          "Job update error:",
          updateError
        );

        setError(
          updateError.message ||
            "Could not update job."
        );

        setUpdatingJobId(null);
        return;
      }

      if (!updatedJob) {
        setError(
          "Job not found or you no longer have permission to update it."
        );

        setUpdatingJobId(null);
        return;
      }

      setJobs((current) =>
        current.map((item) =>
          item.id === job.id
            ? {
                ...item,
                is_active:
                  updatedJob.is_active,
              }
            : item
        )
      );
    } catch (err) {
      console.error(
        "Unexpected job update error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not update job."
      );
    }

    setUpdatingJobId(null);
  }

  async function deleteJob(
    job: Job
  ) {
    if (
      deletingJobId === job.id ||
      updatingJobId === job.id
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${job.title}"? This will permanently remove the job and its related applications.`
      );

    if (!confirmed) {
      return;
    }

    setDeletingJobId(job.id);
    setError("");

    try {
      const auth =
        await requireCompany();

      if (!auth.allowed) {
        setDeletingJobId(null);
        router.replace(
          auth.redirectTo!
        );
        return;
      }

      const user = auth.user;

      if (!user) {
        setDeletingJobId(null);
        router.replace("/login");
        return;
      }

      const {
        data: deletedJob,
        error: deleteError,
      } = await supabase
        .from("jobs")
        .delete()
        .eq("id", job.id)
        .eq(
          "company_id",
          user.id
        )
        .select("id")
        .maybeSingle();

      if (deleteError) {
        console.error(
          "Job delete error:",
          deleteError
        );

        setError(
          deleteError.message ||
            "Could not delete job."
        );

        setDeletingJobId(null);
        return;
      }

      if (!deletedJob) {
        setError(
          "Job not found or you no longer have permission to delete it."
        );

        setDeletingJobId(null);
        return;
      }

      setJobs((current) =>
        current.filter(
          (item) =>
            item.id !== job.id
        )
      );
    } catch (err) {
      console.error(
        "Unexpected job delete error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not delete job."
      );
    }

    setDeletingJobId(null);
  }

  function formatSalary(
    min: number | null,
    max: number | null
  ) {
    if (!min && !max) {
      return "Salary not specified";
    }

    if (min && max) {
      return `₹${min.toLocaleString("en-IN")} – ₹${max.toLocaleString(
        "en-IN"
      )}`;
    }

    if (min) {
      return `From ₹${min.toLocaleString("en-IN")}`;
    }

    return `Up to ₹${max!.toLocaleString("en-IN")}`;
  }

  const activeJobs =
    jobs.filter(
      (job) => job.is_active
    ).length;

  const closedJobs =
    jobs.length - activeJobs;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <div className="text-center">
          <p className="text-lg font-semibold">
            Loading your jobs...
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Please wait
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
            href="/company/dashboard"
            className="text-2xl font-bold tracking-tight text-slate-950"
          >
            Fresher
            <span className="text-blue-600">
              Hire
            </span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-5">

            <Link
              href="/company/candidates"
              className="hidden text-sm font-medium text-slate-600 hover:text-slate-950 sm:block"
            >
              Find Freshers
            </Link>

            <Link
              href="/company/shortlisted"
              className="hidden text-sm font-medium text-slate-600 hover:text-slate-950 md:block"
            >
              Shortlisted
            </Link>

            <Link
              href="/company/dashboard"
              className="hidden text-sm font-medium text-slate-600 hover:text-slate-950 md:block"
            >
              Dashboard
            </Link>

            <NotificationBell />

          </div>

        </div>

      </nav>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">

        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">

          <div>

            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              Company Hiring
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              My Jobs
            </h1>

            <p className="mt-3 leading-7 text-slate-600">
              Manage the roles your company has posted and review applicants for each opportunity.
            </p>

          </div>

          <Link
            href="/company/jobs/create"
            className="inline-flex w-fit items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            + Post a Job
          </Link>

        </div>

        {error && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

              <span>
                {error}
              </span>

              <button
                onClick={loadJobs}
                className="w-fit rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
              >
                Retry
              </button>

            </div>

          </div>
        )}

        {!error && jobs.length > 0 && (

          <div className="mt-8 grid gap-4 sm:grid-cols-3">

            <JobStat
              label="Total Jobs"
              value={jobs.length}
            />

            <JobStat
              label="Active"
              value={activeJobs}
              tone="success"
            />

            <JobStat
              label="Closed"
              value={closedJobs}
            />

          </div>

        )}

        {!error && jobs.length === 0 && (

          <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-2xl font-semibold text-blue-600">
              +
            </div>

            <h2 className="mt-5 text-xl font-semibold text-slate-950">
              No jobs posted yet
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
              Create your first job and start finding talented freshers.
            </p>

            <Link
              href="/company/jobs/create"
              className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Post Your First Job →
            </Link>

          </div>

        )}

        {jobs.length > 0 && (

          <div className="mt-8 space-y-5">

            {jobs.map((job) => (

              <article
                key={job.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:p-6"
              >

                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

                  <div className="min-w-0">

                    <div className="flex flex-wrap items-center gap-3">

                      <h2 className="break-words text-2xl font-semibold text-slate-950">
                        {job.title}
                      </h2>

                      {job.is_active ? (

                        <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                          Active
                        </span>

                      ) : (

                        <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          Closed
                        </span>

                      )}

                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      Posted{" "}
                      {new Date(
                        job.created_at
                      ).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </p>

                  </div>

                  <div className="flex flex-wrap gap-3">

                    <button
                      onClick={() =>
                        toggleJob(job)
                      }
                      disabled={
                        updatingJobId ===
                          job.id ||
                        deletingJobId ===
                          job.id
                      }
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updatingJobId ===
                      job.id
                        ? "Updating..."
                        : job.is_active
                        ? "Close Job"
                        : "Activate Job"}
                    </button>

                    <button
                      onClick={() =>
                        deleteJob(job)
                      }
                      disabled={
                        deletingJobId ===
                          job.id ||
                        updatingJobId ===
                          job.id
                      }
                      className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingJobId ===
                      job.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>

                  </div>

                </div>

                <div className="mt-6 flex flex-wrap gap-3">

                  <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    📍 {job.location || "Remote"}
                  </span>

                  <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    💼 {job.job_type}
                  </span>

                  <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    🎓 {job.experience_level}
                  </span>

                  <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    💰{" "}
                    {formatSalary(
                      job.salary_min,
                      job.salary_max
                    )}
                  </span>

                </div>

                <div className="mt-6">

                  <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">
                    {job.description}
                  </p>

                </div>

                {job.required_skills &&
                  job.required_skills.length > 0 && (

                    <div className="mt-6">

                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Required Skills
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">

                        {job.required_skills.map(
                          (skill) => (

                            <span
                              key={skill}
                              className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700"
                            >
                              {skill}
                            </span>

                          )
                        )}

                      </div>

                    </div>

                  )}

                {!job.is_active && (

                  <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">

                    <p className="text-sm font-semibold text-amber-800">
                      This job is closed
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      Candidates can no longer apply until you activate it again.
                    </p>

                  </div>

                )}

                <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">

                  <p className="text-xs text-slate-500">
                    Review candidate applications and update their hiring status.
                  </p>

                  <Link
                    href={`/company/jobs/${job.id}/applicants`}
                    className="w-fit text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View Applicants →
                  </Link>

                </div>

              </article>

            ))}

          </div>

        )}

      </section>

    </main>
  );
}

function JobStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "success";
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        tone === "success"
          ? "border-green-200 bg-green-50"
          : "border-slate-200 bg-white"
      }`}
    >

      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 text-3xl font-bold ${
          tone === "success"
            ? "text-green-800"
            : "text-slate-950"
        }`}
      >
        {value}
      </p>

    </div>
  );
}
