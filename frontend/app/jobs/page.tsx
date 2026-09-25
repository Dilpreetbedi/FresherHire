"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";


type Company = {
  id: number;
  name: string;
  website: string | null;
  location: string | null;
  is_verified: boolean;
};


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
  status: string;
  created_at: string | null;
  company: Company;
};


type CandidateApplication = {
  id: number;
  status: string;
  applied_at: string | null;

  job: {
    id: number;
  };
};


export default function JobsPage() {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";


  const [
    jobs,
    setJobs,
  ] =
    useState<Job[]>([]);


  const [
    appliedJobIds,
    setAppliedJobIds,
  ] =
    useState<Set<number>>(
      new Set()
    );


  const [
    search,
    setSearch,
  ] =
    useState("");


  const [
    location,
    setLocation,
  ] =
    useState("");


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


  // =========================================================
  // LOAD JOBS
  // =========================================================

  useEffect(() => {
    async function loadJobs() {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `${apiUrl}/api/jobs`,
            {
              cache:
                "no-store",
            }
          );

        const data =
          await response.json();


        if (!response.ok) {
          throw new Error(
            data.detail ||
              "Unable to load jobs."
          );
        }


        setJobs(
          data
        );

      } catch (err) {
        console.error(
          "Jobs load error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load jobs."
        );

      } finally {
        setLoading(false);
      }
    }


    loadJobs();

  }, [
    apiUrl,
  ]);


  // =========================================================
  // LOAD CANDIDATE APPLICATIONS
  // =========================================================

  useEffect(() => {
    async function loadApplications() {
      try {
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


        // User may simply not be logged in.
        if (
          response.status === 401
        ) {
          return;
        }


        if (!response.ok) {
          return;
        }


        const data:
          CandidateApplication[] =
          await response.json();


        const ids =
          new Set<number>(
            data.map(
              (application) =>
                application.job.id
            )
          );


        setAppliedJobIds(
          ids
        );

      } catch (err) {
        console.error(
          "Applications load error:",
          err
        );
      }
    }


    loadApplications();

  }, [
    apiUrl,
  ]);


  // =========================================================
  // LOCATIONS
  // =========================================================

  const locations =
    useMemo(() => {
      return Array.from(
        new Set(
          jobs
            .map(
              (job) =>
                job.location
            )
            .filter(Boolean)
        )
      ).sort();

    }, [
      jobs,
    ]);


  // =========================================================
  // FILTERED JOBS
  // =========================================================

  const filteredJobs =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();


      return jobs.filter(
        (job) => {
          const searchText = [
            job.title,
            job.company.name,
            job.skills,
            job.location,
            job.employment_type,
            job.workplace_type,
          ]
            .join(" ")
            .toLowerCase();


          const matchesSearch =
            !query ||
            searchText.includes(
              query
            );


          const matchesLocation =
            !location ||
            job.location ===
              location;


          return (
            matchesSearch &&
            matchesLocation
          );
        }
      );

    }, [
      jobs,
      search,
      location,
    ]);


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="text-center">

          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Finding fresher jobs...
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
              href="/candidate/applications"
              className="hidden text-sm font-semibold text-slate-600 transition hover:text-blue-600 sm:block"
            >
              My Applications
            </Link>


            <Link
              href="/candidate/profile"
              className="hidden text-sm font-semibold text-slate-600 transition hover:text-blue-600 md:block"
            >
              Profile
            </Link>


            <Link
              href="/candidate/dashboard"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
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

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">

          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
            Fresher Opportunities
          </p>


          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Find jobs built for
            early-career talent.
          </h1>


          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">
            Explore verified opportunities
            designed for freshers and candidates
            with up to two years of experience.
          </p>


          {/* SEARCH */}

          <div className="mt-8 grid gap-3 md:grid-cols-[1fr_260px]">

            <input
              type="search"
              value={
                search
              }
              onChange={
                (event) =>
                  setSearch(
                    event.target.value
                  )
              }
              placeholder="Search by role, company or skill..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />


            <select
              value={
                location
              }
              onChange={
                (event) =>
                  setLocation(
                    event.target.value
                  )
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >

              <option value="">
                All locations
              </option>


              {locations.map(
                (item) => (

                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>

                )
              )}

            </select>

          </div>

        </div>

      </section>


      {/* =====================================================
          JOBS
      ===================================================== */}

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}


        <div className="mb-6 flex items-center justify-between">

          <div>

            <h2 className="text-xl font-bold text-slate-950">
              Available Jobs
            </h2>


            <p className="mt-1 text-sm text-slate-500">
              {filteredJobs.length}{" "}
              {filteredJobs.length === 1
                ? "job"
                : "jobs"}{" "}
              found
            </p>

          </div>

        </div>


        {filteredJobs.length === 0 ? (

          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
              🔎
            </div>


            <h3 className="mt-5 text-xl font-bold text-slate-950">
              No jobs found
            </h3>


            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Try another search term or
              clear the location filter.
            </p>


            <button
              type="button"
              onClick={() => {
                setSearch("");
                setLocation("");
              }}
              className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              Clear Filters
            </button>

          </div>

        ) : (

          <div className="grid gap-5 lg:grid-cols-2">

            {filteredJobs.map(
              (job) => (

                <JobCard
                  key={job.id}
                  job={job}
                  applied={
                    appliedJobIds.has(
                      job.id
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
// JOB CARD
// =========================================================

function JobCard({
  job,
  applied,
}: {
  job: Job;
  applied: boolean;
}) {
  const skills =
    job.skills
      .split(",")
      .map(
        (skill) =>
          skill.trim()
      )
      .filter(Boolean)
      .slice(0, 5);


  return (
    <article className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-7">

      <div className="flex items-start justify-between gap-4">

        <div>

          <div className="flex flex-wrap items-center gap-2">

            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {job.employment_type}
            </span>


            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {job.workplace_type}
            </span>

          </div>


          <h3 className="mt-4 text-2xl font-bold tracking-tight text-slate-950">
            {job.title}
          </h3>


          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">

            <span className="font-semibold text-slate-700">
              {job.company.name}
            </span>


            {job.company.is_verified && (
              <span className="font-semibold text-emerald-600">
                ✓ Verified
              </span>
            )}

          </div>

        </div>

      </div>


      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">

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

      </div>


      {job.salary && (
        <p className="mt-4 text-sm font-semibold text-slate-700">
          Salary: {job.salary}
        </p>
      )}


      <p className="mt-5 line-clamp-3 text-sm leading-7 text-slate-600">
        {job.description}
      </p>


      {skills.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">

          {skills.map(
            (skill) => (

              <span
                key={skill}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"
              >
                {skill}
              </span>

            )
          )}

        </div>
      )}


      <div className="mt-auto pt-7">

        <div className="flex flex-wrap items-center gap-3">

          <Link
            href={`/jobs/${job.id}`}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
          >
            View Details
          </Link>


          {applied ? (

            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-xl bg-emerald-100 px-4 py-2.5 text-sm font-semibold text-emerald-700"
            >
              ✓ Applied
            </button>

          ) : (

            <Link
              href={`/jobs/${job.id}`}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Apply Now →
            </Link>

          )}

        </div>


        <p className="mt-4 text-xs text-slate-400">
          Posted{" "}
          {formatDate(
            job.created_at
          )}
        </p>

      </div>

    </article>
  );
}


// =========================================================
// DATE
// =========================================================

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