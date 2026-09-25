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
  useParams,
  useRouter,
} from "next/navigation";


type Company = {
  id: number;
  name: string;
  website: string | null;
  location: string | null;
  company_size: string | null;
  company_type: string | null;
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


type CandidateProfile = {
  id: number;
  full_name: string;
  email: string;
  headline: string | null;
  location: string | null;
  graduation_year: number | null;
  degree: string | null;
  skills: string | null;
  projects: string | null;
  bio: string | null;
  resume_url: string | null;
  profile_completion: number;
};


type CandidateApplication = {
  id: number;
  status: string;
  cover_letter: string | null;

  job: {
    id: number;
  };
};


const MAX_COVER_LETTER_LENGTH =
  2000;


export default function JobDetailsPage() {
  const params =
    useParams();


  const router =
    useRouter();


  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";


  const rawId =
    Array.isArray(
      params.id
    )
      ? params.id[0]
      : params.id;


  const jobId =
    Number(
      rawId
    );


  const [
    job,
    setJob,
  ] =
    useState<Job | null>(
      null
    );


  const [
    candidate,
    setCandidate,
  ] =
    useState<CandidateProfile | null>(
      null
    );


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    candidateLoading,
    setCandidateLoading,
  ] =
    useState(true);


  const [
    applied,
    setApplied,
  ] =
    useState(false);


  const [
    applicationStatus,
    setApplicationStatus,
  ] =
    useState<string | null>(
      null
    );


  const [
    applying,
    setApplying,
  ] =
    useState(false);


  const [
    coverLetter,
    setCoverLetter,
  ] =
    useState("");


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


  // =========================================================
  // LOAD
  // =========================================================

  useEffect(() => {
    if (
      !Number.isInteger(
        jobId
      ) ||
      jobId <= 0
    ) {
      setError(
        "Invalid job."
      );

      setLoading(
        false
      );

      setCandidateLoading(
        false
      );

      return;
    }


    loadJob();

    loadCandidateData();

  }, [
    jobId,
  ]);


  async function loadJob() {
    try {
      setLoading(
        true
      );


      const response =
        await fetch(
          `${apiUrl}/api/jobs/${jobId}`,
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
            "Could not load this job."
        );
      }


      setJob(
        data
      );

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load this job."
      );


      setJob(
        null
      );

    } finally {
      setLoading(
        false
      );
    }
  }


  async function loadCandidateData() {
    try {
      setCandidateLoading(
        true
      );


      const profileResponse =
        await fetch(
          `${apiUrl}/api/candidate/me`,
          {
            credentials:
              "include",

            cache:
              "no-store",
          }
        );


      if (
        profileResponse.ok
      ) {
        const profile =
          await profileResponse.json();


        setCandidate(
          profile
        );
      }


      const applicationResponse =
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
        applicationResponse.ok
      ) {
        const applications:
          CandidateApplication[] =
          await applicationResponse.json();


        const current =
          applications.find(
            (application) =>
              application
              .job
              .id ===
              jobId
          );


        if (current) {
          setApplicationStatus(
            current.status
          );


          if (
            current.status ===
            "withdrawn"
          ) {
            setApplied(
              false
            );

            setCoverLetter(
              current.cover_letter ||
              ""
            );

          } else {
            setApplied(
              true
            );
          }
        }
      }

    } finally {
      setCandidateLoading(
        false
      );
    }
  }


  // =========================================================
  // SKILLS
  // =========================================================

  const requiredSkills =
    useMemo(() => {
      if (!job?.skills) {
        return [];
      }


      return parseSkills(
        job.skills
      );

    }, [
      job,
    ]);


  const candidateSkills =
    useMemo(() => {
      if (!candidate?.skills) {
        return [];
      }


      return parseSkills(
        candidate.skills
      );

    }, [
      candidate,
    ]);


  const matchData =
    useMemo(() => {
      if (
        requiredSkills.length === 0
      ) {
        return {
          score:
            null as number | null,

          matched:
            [] as string[],

          missing:
            [] as string[],
        };
      }


      const normalized =
        candidateSkills.map(
          normalizeSkill
        );


      const matched =
        requiredSkills.filter(
          (skill) =>
            normalized.includes(
              normalizeSkill(
                skill
              )
            )
        );


      const missing =
        requiredSkills.filter(
          (skill) =>
            !normalized.includes(
              normalizeSkill(
                skill
              )
            )
        );


      return {
        score:
          Math.round(
            (
              matched.length /
              requiredSkills.length
            )
            * 100
          ),

        matched,

        missing,
      };

    }, [
      requiredSkills,
      candidateSkills,
    ]);


  // =========================================================
  // READINESS
  // =========================================================

  const readinessItems =
    useMemo(() => {
      if (!candidate) {
        return [];
      }


      return [
        {
          label:
            "Basic profile completed",

          completed:
            Boolean(
              candidate.full_name &&
              candidate.email &&
              candidate.degree &&
              candidate.graduation_year &&
              candidate.location &&
              candidate.headline
            ),
        },

        {
          label:
            "Skills added",

          completed:
            Boolean(
              candidate.skills
            ),
        },

        {
          label:
            "Project added",

          completed:
            Boolean(
              candidate.projects
            ),
        },

        {
          label:
            "Resume uploaded",

          completed:
            Boolean(
              candidate.resume_url
            ),
        },

        {
          label:
            "About section completed",

          completed:
            Boolean(
              candidate.bio
            ),
        },
      ];

    }, [
      candidate,
    ]);


  const readinessPercentage =
    readinessItems.length
      ? Math.round(
          (
            readinessItems.filter(
              (item) =>
                item.completed
            ).length /
            readinessItems.length
          )
          * 100
        )
      : 0;


  // =========================================================
  // APPLY
  // =========================================================

  async function applyForJob() {
    if (
      !job ||
      applied ||
      applying
    ) {
      return;
    }


    try {
      setApplying(
        true
      );

      setError("");
      setSuccess("");


      const response =
        await fetch(
          `${apiUrl}/api/jobs/${job.id}/apply`,
          {
            method:
              "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                cover_letter:
                  coverLetter.trim()
                    ? coverLetter.trim()
                    : null,
              }),
          }
        );


      if (
        response.status === 401
      ) {
        router.push(
          "/login"
        );

        return;
      }


      const data =
        await response.json();


      if (
        response.status === 409
      ) {
        setApplied(
          true
        );

        setApplicationStatus(
          "applied"
        );

        setSuccess(
          "You have already applied to this job."
        );

        return;
      }


      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to submit application."
        );
      }


      setApplied(
        true
      );


      setApplicationStatus(
        "applied"
      );


      setCoverLetter(
        ""
      );


      setSuccess(
        data.reapplied
          ? "Application submitted again successfully."
          : "Application submitted successfully."
      );

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit application."
      );

    } finally {
      setApplying(
        false
      );
    }
  }


  // =========================================================
  // MATCH LABEL
  // =========================================================

  function matchLabel() {
    if (
      matchData.score ===
      null
    ) {
      return "Not calculated";
    }


    if (
      matchData.score >= 80
    ) {
      return "Strong Match";
    }


    if (
      matchData.score >= 50
    ) {
      return "Moderate Match";
    }


    return "Low Match";
  }


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="text-center">

          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />


          <p className="mt-4 font-semibold">
            Loading job...
          </p>

        </div>

      </main>
    );
  }


  // =========================================================
  // NOT FOUND
  // =========================================================

  if (!job) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">

        <div className="text-center">

          <h1 className="text-3xl font-bold">
            Job unavailable
          </h1>


          <p className="mt-3 text-slate-500">
            {error}
          </p>


          <Link
            href="/jobs"
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
          >
            Browse Jobs
          </Link>

        </div>

      </main>
    );
  }


  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white">

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


          <div className="flex items-center gap-4">

            <Link
              href="/jobs"
              className="text-sm font-semibold text-slate-600"
            >
              Browse Jobs
            </Link>


            <Link
              href="/candidate/applications"
              className="hidden text-sm font-semibold text-slate-600 sm:block"
            >
              Applications
            </Link>

          </div>

        </div>

      </nav>


      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">

        <Link
          href="/jobs"
          className="text-sm text-slate-500"
        >
          ← Back to Jobs
        </Link>


        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">

          <div className="flex flex-wrap gap-2">

            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {job.employment_type}
            </span>


            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {job.workplace_type}
            </span>


            {job.company.is_verified && (
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                ✓ Verified Company
              </span>
            )}

          </div>


          <h1 className="mt-5 text-4xl font-bold">
            {job.title}
          </h1>


          <p className="mt-2 font-semibold text-slate-700">
            {job.company.name}
          </p>


          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">

            <span>
              📍 {job.location}
            </span>


            <span>
              💼 {job.experience}
            </span>


            <span>
              👥 {job.openings} openings
            </span>


            {job.salary && (
              <span>
                💰 {job.salary}
              </span>
            )}

          </div>

        </section>


        <div className="mt-6 grid gap-6 lg:grid-cols-3">

          <div className="space-y-6 lg:col-span-2">

            <Section
              title="About the Role"
            >

              <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                {job.description}
              </p>

            </Section>


            <Section
              title="Required Skills"
            >

              <div className="flex flex-wrap gap-2">

                {requiredSkills.map(
                  (skill) => {
                    const matched =
                      matchData
                      .matched
                      .some(
                        (
                          candidateSkill
                        ) =>
                          normalizeSkill(
                            candidateSkill
                          ) ===
                          normalizeSkill(
                            skill
                          )
                      );


                    return (
                      <span
                        key={
                          skill
                        }
                        className={`rounded-xl border px-3 py-2 text-sm ${
                          candidate
                            ? matched
                              ? "border-green-200 bg-green-50 text-green-700"
                              : "border-red-200 bg-red-50 text-red-700"
                            : "border-blue-200 bg-blue-50 text-blue-700"
                        }`}
                      >
                        {skill}
                      </span>
                    );
                  }
                )}

              </div>

            </Section>


            {candidate && (
              <Section
                title="Your Job Match"
              >

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-3xl font-bold text-blue-600">
                      {matchData.score ===
                      null
                        ? "—"
                        : `${matchData.score}%`}
                    </p>


                    <p className="mt-1 text-sm font-semibold">
                      {matchLabel()}
                    </p>

                  </div>


                  <Link
                    href="/candidate/profile"
                    className="text-sm font-semibold text-blue-600"
                  >
                    Update Skills →
                  </Link>

                </div>


                {matchData.missing.length >
                  0 && (

                  <div className="mt-5 rounded-xl bg-amber-50 p-4">

                    <p className="text-sm font-semibold text-amber-800">
                      Missing Skills
                    </p>


                    <p className="mt-2 text-sm text-slate-600">
                      {
                        matchData
                        .missing
                        .join(", ")
                      }
                    </p>

                  </div>

                )}

              </Section>
            )}


            {job.eligibility && (
              <Section
                title="Eligibility"
              >

                <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                  {job.eligibility}
                </p>

              </Section>
            )}


            {candidate && (
              <Section
                title="Application Readiness"
              >

                <div className="flex items-center justify-between">

                  <p className="font-semibold">
                    Profile readiness
                  </p>


                  <p className="text-2xl font-bold text-blue-600">
                    {readinessPercentage}%
                  </p>

                </div>


                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">

                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{
                      width:
                        `${readinessPercentage}%`,
                    }}
                  />

                </div>


                <div className="mt-5 grid gap-3 sm:grid-cols-2">

                  {readinessItems.map(
                    (item) => (

                      <div
                        key={
                          item.label
                        }
                        className={`rounded-xl border p-4 ${
                          item.completed
                            ? "border-green-200 bg-green-50"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >

                        <span className="text-sm font-medium">
                          {item.completed
                            ? "✓ "
                            : "○ "}

                          {item.label}
                        </span>

                      </div>

                    )
                  )}

                </div>

              </Section>
            )}


            <Section
              title="About the Company"
            >

              <h3 className="font-bold">
                {job.company.name}
              </h3>


              {job.company.company_type && (
                <p className="mt-2 text-sm text-slate-500">
                  {
                    job.company
                    .company_type
                  }
                </p>
              )}


              {job.company.website && (
                <a
                  href={
                    normalizeUrl(
                      job.company
                      .website
                    )
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block text-sm font-semibold text-blue-600"
                >
                  Company Website ↗
                </a>
              )}

            </Section>

          </div>


          {/* =================================================
              APPLICATION PANEL
          ================================================= */}

          <aside>

            <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                Application
              </p>


              <h2 className="mt-2 text-xl font-bold">
                Apply for this job
              </h2>


              {!candidateLoading &&
                !candidate && (

                <div className="mt-6">

                  <p className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
                    Login as a candidate
                    to apply.
                  </p>


                  <Link
                    href="/login"
                    className="mt-4 block rounded-xl bg-blue-600 px-5 py-3 text-center font-semibold text-white"
                  >
                    Login to Apply
                  </Link>

                </div>

              )}


              {candidate &&
                applied && (

                <div className="mt-6">

                  <div className="rounded-xl bg-green-50 p-5">

                    <p className="font-semibold text-green-800">
                      ✓ Application Submitted
                    </p>


                    {applicationStatus && (
                      <p className="mt-2 text-sm capitalize text-slate-600">
                        Status:{" "}
                        {
                          applicationStatus
                        }
                      </p>
                    )}

                  </div>


                  <Link
                    href="/candidate/applications"
                    className="mt-4 block rounded-xl border px-5 py-3 text-center text-sm font-semibold"
                  >
                    View Applications
                  </Link>

                </div>

              )}


              {candidate &&
                !applied && (

                <div className="mt-6">

                  {applicationStatus ===
                    "withdrawn" && (

                    <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">

                      <p className="text-sm font-semibold text-amber-800">
                        You previously withdrew this application.
                      </p>


                      <p className="mt-1 text-xs leading-5 text-amber-700">
                        Since the job is still
                        open, you can apply again.
                      </p>

                    </div>

                  )}


                  <div className="rounded-xl bg-slate-50 p-4">

                    <div className="flex justify-between text-sm">

                      <span>
                        Job Match
                      </span>


                      <strong>
                        {matchData.score ===
                        null
                          ? "—"
                          : `${matchData.score}%`}
                      </strong>

                    </div>


                    <div className="mt-3 flex justify-between text-sm">

                      <span>
                        Profile Ready
                      </span>


                      <strong>
                        {readinessPercentage}%
                      </strong>

                    </div>

                  </div>


                  {/* COVER LETTER */}

                  <div className="mt-5">

                    <div className="flex items-center justify-between">

                      <label
                        htmlFor="coverLetter"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Cover Letter
                      </label>


                      <span className="text-xs text-slate-400">
                        Optional
                      </span>

                    </div>


                    <textarea
                      id="coverLetter"
                      value={
                        coverLetter
                      }
                      onChange={
                        (event) =>
                          setCoverLetter(
                            event
                            .target
                            .value
                          )
                      }
                      maxLength={
                        MAX_COVER_LETTER_LENGTH
                      }
                      rows={8}
                      placeholder="Tell the recruiter why you're interested in this role and why you're a good fit..."
                      className="mt-2 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />


                    <div className="mt-2 flex justify-end">

                      <span className="text-xs text-slate-400">
                        {coverLetter.length}/
                        {MAX_COVER_LETTER_LENGTH}
                      </span>

                    </div>

                  </div>


                  {error && (
                    <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                      {error}
                    </div>
                  )}


                  {success && (
                    <div className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-700">
                      ✓ {success}
                    </div>
                  )}


                  <button
                    type="button"
                    onClick={
                      applyForJob
                    }
                    disabled={
                      applying
                    }
                    className="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    {applying
                      ? "Submitting..."
                      : applicationStatus ===
                        "withdrawn"
                      ? "Apply Again →"
                      : "Apply Now →"}
                  </button>

                </div>

              )}

            </div>

          </aside>

        </div>

      </section>

    </main>
  );
}


// =========================================================
// SECTION
// =========================================================

function Section({
  title,
  children,
}: {
  title:
    string;

  children:
    ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

      <h2 className="text-2xl font-bold">
        {title}
      </h2>


      <div className="mt-5">
        {children}
      </div>

    </section>
  );
}


// =========================================================
// HELPERS
// =========================================================

function parseSkills(
  value:
    string
) {
  return value
    .split(
      /[,;\n]/
    )
    .map(
      (skill) =>
        skill.trim()
    )
    .filter(Boolean);
}


function normalizeSkill(
  skill:
    string
) {
  return skill
    .trim()
    .toLowerCase();
}


function normalizeUrl(
  value:
    string
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