"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { requireFresher } from "../../lib/auth";
import NotificationBell from "../../components/NotificationBell";

type Job = {
  id: number;
  title: string;
  description: string;
  required_skills: string[];
  location: string | null;
  job_type: string;
  experience_level: string;
  salary_min: number | null;
  salary_max: number | null;
};

type ReadinessItem = {
  label: string;
  completed: boolean;
  href: string;
};

type Skill = {
  skill_name: string;
  skill_level: string;
};

type Assessment = {
  skill_name: string;
  percentage: number;
};

const MAX_COVER_LETTER_LENGTH = 2000;

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const jobId = Number(params.id);

  const [job, setJob] = useState<Job | null>(null);

  const [loading, setLoading] = useState(true);

  const [readinessLoading, setReadinessLoading] =
    useState(true);

  const [matchLoading, setMatchLoading] =
    useState(true);

  const [applying, setApplying] = useState(false);

  const [applied, setApplied] = useState(false);

  const [coverLetter, setCoverLetter] = useState("");

  const [error, setError] = useState("");

  const [candidateSkills, setCandidateSkills] =
    useState<Skill[]>([]);

  const [candidateAssessments, setCandidateAssessments] =
    useState<Assessment[]>([]);

  const [readinessItems, setReadinessItems] =
    useState<ReadinessItem[]>([
      {
        label: "Basic profile completed",
        completed: false,
        href: "/dashboard",
      },
      {
        label: "Skills added",
        completed: false,
        href: "/skills",
      },
      {
        label: "Assessment completed",
        completed: false,
        href: "/assessments",
      },
      {
        label: "Project added",
        completed: false,
        href: "/projects",
      },
      {
        label: "Resume uploaded",
        completed: false,
        href: "/dashboard#resume",
      },
    ]);

  useEffect(() => {
    if (!Number.isInteger(jobId) || jobId <= 0) {
      setError("Invalid job.");
      setLoading(false);
      setReadinessLoading(false);
      setMatchLoading(false);
      return;
    }

    loadPage();
  }, [jobId]);

  async function loadPage() {
    setLoading(true);
    setError("");

    try {
      const auth = await requireFresher();

      if (!auth.allowed) {
        setLoading(false);
        setReadinessLoading(false);
        setMatchLoading(false);
        router.replace(auth.redirectTo!);
        return;
      }

      if (!auth.user) {
        setLoading(false);
        setReadinessLoading(false);
        setMatchLoading(false);
        router.replace("/login");
        return;
      }

      await Promise.all([
        loadJob(),
        checkApplication(),
        loadReadiness(),
        loadCandidateMatchData(),
      ]);
    } catch (err) {
      console.error("Job page load error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading this job."
      );

      setLoading(false);
      setReadinessLoading(false);
      setMatchLoading(false);
    }
  }

  function normalizeSkill(skill: string) {
    return skill
      .trim()
      .toLowerCase();
  }

  async function loadJob() {
    const {
      data,
      error,
    } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .eq("is_active", true)
      .single();

    if (error) {
      console.error(
        "Job error:",
        error
      );

      setError(
        "Could not find this job."
      );

      setLoading(false);

      return;
    }

    setJob(data);
    setLoading(false);
  }

  async function checkApplication() {
    const auth = await requireFresher();

    if (!auth.allowed) {
      router.replace(auth.redirectTo!);
      return;
    }

    const user = auth.user;

    if (!user) {
      router.replace("/login");
      return;
    }

    const {
      data,
      error,
    } = await supabase
      .from("applications")
      .select("id")
      .eq("job_id", jobId)
      .eq(
        "candidate_id",
        user.id
      )
      .maybeSingle();

    if (error) {
      console.error(
        "Application check error:",
        error
      );

      return;
    }

    if (data) {
      setApplied(true);
    }
  }

  async function loadReadiness() {
    setReadinessLoading(true);

    const auth = await requireFresher();

    if (!auth.allowed) {
      setReadinessLoading(false);
      router.replace(auth.redirectTo!);
      return;
    }

    const user = auth.user;

    if (!user) {
      setReadinessLoading(false);
      router.replace("/login");
      return;
    }

    const [
      profileResult,
      skillsResult,
      assessmentsResult,
      projectsResult,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select(`
          full_name,
          email,
          degree,
          graduation_year,
          location,
          preferred_role,
          resume_url
        `)
        .eq("id", user.id)
        .maybeSingle(),

      supabase
        .from("skills")
        .select("id")
        .eq(
          "user_id",
          user.id
        )
        .limit(1),

      supabase
        .from("assessment_results")
        .select("id")
        .eq(
          "user_id",
          user.id
        )
        .limit(1),

      supabase
        .from("projects")
        .select("id")
        .eq(
          "user_id",
          user.id
        )
        .limit(1),
    ]);

    if (profileResult.error) {
      console.error(
        "Readiness profile error:",
        profileResult.error
      );
    }

    if (skillsResult.error) {
      console.error(
        "Readiness skills error:",
        skillsResult.error
      );
    }

    if (assessmentsResult.error) {
      console.error(
        "Readiness assessment error:",
        assessmentsResult.error
      );
    }

    if (projectsResult.error) {
      console.error(
        "Readiness projects error:",
        projectsResult.error
      );
    }

    const profileData =
      profileResult.data;

    const basicProfileComplete =
      Boolean(
        profileData?.full_name &&
          profileData?.email &&
          profileData?.degree &&
          profileData?.graduation_year &&
          profileData?.location &&
          profileData?.preferred_role
      );

    setReadinessItems([
      {
        label:
          "Basic profile completed",
        completed:
          basicProfileComplete,
        href: "/dashboard",
      },
      {
        label:
          "Skills added",
        completed:
          Boolean(
            skillsResult.data &&
              skillsResult.data.length > 0
          ),
        href: "/skills",
      },
      {
        label:
          "Assessment completed",
        completed:
          Boolean(
            assessmentsResult.data &&
              assessmentsResult.data.length >
                0
          ),
        href: "/assessments",
      },
      {
        label:
          "Project added",
        completed:
          Boolean(
            projectsResult.data &&
              projectsResult.data.length > 0
          ),
        href: "/projects",
      },
      {
        label:
          "Resume uploaded",
        completed:
          Boolean(
            profileData?.resume_url
          ),
        href: "/dashboard#resume",
      },
    ]);

    setReadinessLoading(false);
  }

  async function loadCandidateMatchData() {
    setMatchLoading(true);

    const auth = await requireFresher();

    if (!auth.allowed) {
      setMatchLoading(false);
      router.replace(auth.redirectTo!);
      return;
    }

    const user = auth.user;

    if (!user) {
      setMatchLoading(false);
      router.replace("/login");
      return;
    }

    const [
      skillsResult,
      assessmentsResult,
    ] = await Promise.all([
      supabase
        .from("skills")
        .select(`
          skill_name,
          skill_level
        `)
        .eq(
          "user_id",
          user.id
        ),

      supabase
        .from("assessment_results")
        .select(`
          skill_name,
          percentage
        `)
        .eq(
          "user_id",
          user.id
        ),
    ]);

    if (skillsResult.error) {
      console.error(
        "Candidate skills error:",
        skillsResult.error
      );
    } else {
      setCandidateSkills(
        skillsResult.data || []
      );
    }

    if (assessmentsResult.error) {
      console.error(
        "Candidate assessments error:",
        assessmentsResult.error
      );
    } else {
      setCandidateAssessments(
        assessmentsResult.data || []
      );
    }

    setMatchLoading(false);
  }

  const matchData =
    useMemo(() => {
      if (!job) {
        return {
          matchScore: 0,
          matchedSkills: [] as string[],
          verifiedSkills: [] as string[],
          missingSkills: [] as string[],
        };
      }

      const requiredSkills =
        job.required_skills || [];

      if (
        requiredSkills.length === 0
      ) {
        return {
          matchScore: 0,
          matchedSkills: [],
          verifiedSkills: [],
          missingSkills: [],
        };
      }

      const candidateSkillNames =
        candidateSkills.map(
          (skill) =>
            normalizeSkill(
              skill.skill_name
            )
        );

      const matchedSkills =
        requiredSkills.filter(
          (skill) =>
            candidateSkillNames.includes(
              normalizeSkill(
                skill
              )
            )
        );

      const missingSkills =
        requiredSkills.filter(
          (skill) =>
            !candidateSkillNames.includes(
              normalizeSkill(
                skill
              )
            )
        );

      const bestScores: Record<
        string,
        number
      > = {};

      candidateAssessments.forEach(
        (assessment) => {
          const skillName =
            normalizeSkill(
              assessment.skill_name
            );

          const previous =
            bestScores[
              skillName
            ] || 0;

          if (
            assessment.percentage >
            previous
          ) {
            bestScores[
              skillName
            ] =
              assessment.percentage;
          }
        }
      );

      const verifiedSkills =
        requiredSkills.filter(
          (skill) => {
            const score =
              bestScores[
                normalizeSkill(
                  skill
                )
              ];

            return (
              score !== undefined &&
              score >= 80
            );
          }
        );

      const skillCoverage =
        matchedSkills.length /
        requiredSkills.length;

      const verifiedCoverage =
        verifiedSkills.length /
        requiredSkills.length;

      const matchScore =
        Math.min(
          Math.round(
            skillCoverage * 80 +
              verifiedCoverage *
                20
          ),
          100
        );

      return {
        matchScore,
        matchedSkills,
        verifiedSkills,
        missingSkills,
      };
    }, [
      job,
      candidateSkills,
      candidateAssessments,
    ]);

  const unverifiedMatchedSkills =
    matchData.matchedSkills.filter(
      (skill) =>
        !matchData.verifiedSkills.some(
          (verifiedSkill) =>
            normalizeSkill(
              verifiedSkill
            ) ===
            normalizeSkill(
              skill
            )
        )
    );

  function getMatchLabel() {
    if (
      matchData.matchScore >= 80
    ) {
      return "Strong Match";
    }

    if (
      matchData.matchScore >= 50
    ) {
      return "Moderate Match";
    }

    return "Low Match";
  }

  function getMatchStyle() {
    if (
      matchData.matchScore >= 80
    ) {
      return "border-green-200 bg-green-50 text-green-700";
    }

    if (
      matchData.matchScore >= 50
    ) {
      return "border-amber-200 bg-amber-50 text-amber-700";
    }

    return "border-red-200 bg-red-50 text-red-700";
  }

  async function applyForJob() {
    if (applying || applied) {
      return;
    }

    setError("");

    const trimmedCoverLetter =
      coverLetter.trim();

    if (
      trimmedCoverLetter.length >
      MAX_COVER_LETTER_LENGTH
    ) {
      setError(
        `Cover letter must be ${MAX_COVER_LETTER_LENGTH} characters or fewer.`
      );
      return;
    }

    setApplying(true);

    try {
      const auth =
        await requireFresher();

      if (!auth.allowed) {
        setApplying(false);
        router.replace(
          auth.redirectTo!
        );
        return;
      }

      const user = auth.user;

      if (!user) {
        setApplying(false);
        router.replace("/login");
        return;
      }

      const {
        data: activeJob,
        error: activeJobError,
      } = await supabase
        .from("jobs")
        .select("id")
        .eq("id", jobId)
        .eq("is_active", true)
        .maybeSingle();

      if (activeJobError) {
        console.error(
          "Active job check error:",
          activeJobError
        );

        setError(
          "Could not verify that this job is still open. Please try again."
        );

        setApplying(false);
        return;
      }

      if (!activeJob) {
        setError(
          "This job is no longer accepting applications."
        );

        setApplying(false);
        return;
      }

      const {
        data: existingApplication,
        error: existingApplicationError,
      } = await supabase
        .from("applications")
        .select("id")
        .eq("job_id", jobId)
        .eq(
          "candidate_id",
          user.id
        )
        .maybeSingle();

      if (existingApplicationError) {
        console.error(
          "Duplicate application check error:",
          existingApplicationError
        );

        setError(
          "Could not verify your application status. Please try again."
        );

        setApplying(false);
        return;
      }

      if (existingApplication) {
        setApplied(true);

        setError(
          "You have already applied for this job."
        );

        setApplying(false);
        return;
      }

      const { error: insertError } =
        await supabase
          .from("applications")
          .insert({
            job_id: jobId,
            candidate_id:
              user.id,
            cover_letter:
              trimmedCoverLetter ||
              null,
            status: "applied",
          });

      if (insertError) {
        console.error(
          "Application error:",
          insertError
        );

        if (
          insertError.code === "23505"
        ) {
          setApplied(true);

          setError(
            "You have already applied for this job."
          );
        } else {
          setError(
            insertError.message ||
              "Could not submit your application."
          );
        }

        setApplying(false);
        return;
      }

      setApplied(true);
      setCoverLetter("");
      setApplying(false);
    } catch (err) {
      console.error(
        "Unexpected application error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not submit your application."
      );

      setApplying(false);
    }
  }

  const completedReadinessItems =
    readinessItems.filter(
      (item) =>
        item.completed
    ).length;

  const readinessPercentage =
    Math.round(
      (completedReadinessItems /
        readinessItems.length) *
        100
    );

  function getReadinessText() {
    if (
      readinessPercentage === 100
    ) {
      return "Ready to Apply";
    }

    if (
      readinessPercentage >= 80
    ) {
      return "Almost Ready";
    }

    if (
      readinessPercentage >= 60
    ) {
      return "Good Start";
    }

    return "Profile Needs Work";
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <div className="text-center">
          <p className="font-semibold">
            Loading job...
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Preparing job details and your match
          </p>
        </div>
      </main>
    );
  }

  if (!job) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-20 text-slate-900">

        <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">

          <div className="text-4xl">
            🔎
          </div>

          <h1 className="mt-5 text-3xl font-bold text-slate-950">
            Job Not Found
          </h1>

          <p className="mt-4 leading-7 text-slate-600">
            {error ||
              "This job does not exist or is no longer active."}
          </p>

          <Link
            href="/jobs"
            className="mt-8 inline-block rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            ← Browse Jobs
          </Link>

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
              href="/applications"
              className="text-sm font-medium text-slate-600 hover:text-slate-950"
            >
              My Applications
            </Link>

            <Link
              href="/jobs"
              className="hidden text-sm font-medium text-slate-600 hover:text-slate-950 sm:block"
            >
              ← Browse Jobs
            </Link>

            <NotificationBell />

          </div>

        </div>

      </nav>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

            <div>

              <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {job.job_type}
              </span>

              <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                {job.title}
              </h1>

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">

                <span>
                  📍{" "}
                  {job.location ||
                    "Location not specified"}
                </span>

                <span>
                  💼{" "}
                  {
                    job.experience_level
                  }
                </span>

                {job.salary_min !==
                  null &&
                  job.salary_max !==
                    null && (

                    <span>
                      💰 ₹
                      {job.salary_min.toLocaleString(
                        "en-IN"
                      )}{" "}
                      – ₹
                      {job.salary_max.toLocaleString(
                        "en-IN"
                      )}
                    </span>

                  )}

              </div>

            </div>

            {!matchLoading && (
              <div className="shrink-0 sm:text-right">

                <span
                  className={`inline-block rounded-full border px-4 py-2 text-sm font-bold ${getMatchStyle()}`}
                >
                  {matchData.matchScore}% Match
                </span>

                <p className="mt-2 text-xs font-semibold text-slate-500">
                  {getMatchLabel()}
                </p>

              </div>
            )}

          </div>

        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">

          <div className="lg:col-span-2">

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">

              <h2 className="text-2xl font-bold text-slate-950">
                About the Role
              </h2>

              <p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-600">
                {
                  job.description
                }
              </p>

            </section>

            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">

              <h2 className="text-2xl font-bold text-slate-950">
                Required Skills
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Green skills are verified, blue skills are already on your profile, and red skills are currently missing.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">

                {(job.required_skills || []).map(
                  (skill) => {

                    const verified =
                      matchData.verifiedSkills.some(
                        (
                          verifiedSkill
                        ) =>
                          normalizeSkill(
                            verifiedSkill
                          ) ===
                          normalizeSkill(
                            skill
                          )
                      );

                    const matched =
                      matchData.matchedSkills.some(
                        (
                          matchedSkill
                        ) =>
                          normalizeSkill(
                            matchedSkill
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
                        className={`rounded-xl border px-4 py-2 text-sm font-medium ${
                          verified
                            ? "border-green-200 bg-green-50 text-green-700"
                            : matched
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-red-200 bg-red-50 text-red-700"
                        }`}
                      >
                        {verified
                          ? "✓ "
                          : matched
                          ? "• "
                          : "✕ "}
                        {skill}
                      </span>
                    );
                  }
                )}

              </div>

            </section>

            <section className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/70 p-6 sm:p-7">

              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

                <div>

                  <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                    Why You Match
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-slate-950">
                    {getMatchLabel()}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    FresherHire compares this job&apos;s required skills with your profile and your best assessment results.
                  </p>

                </div>

                {!matchLoading && (
                  <span
                    className={`w-fit rounded-full border px-4 py-2 text-sm font-bold ${getMatchStyle()}`}
                  >
                    {matchData.matchScore}% Match
                  </span>
                )}

              </div>

              {matchLoading ? (
                <p className="mt-6 text-sm text-slate-500">
                  Calculating your match...
                </p>
              ) : (
                <>

                  <div className="mt-6 h-2 overflow-hidden rounded-full bg-blue-100">

                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{
                        width: `${Math.min(
                          Math.max(
                            matchData.matchScore,
                            0
                          ),
                          100
                        )}%`,
                      }}
                    />

                  </div>

                  <div className="mt-6 space-y-3">

                    {matchData.verifiedSkills.map(
                      (skill) => (
                        <div
                          key={`verified-${skill}`}
                          className="flex items-start gap-3 text-sm"
                        >
                          <span className="font-bold text-green-700">
                            ✓
                          </span>

                          <p className="text-slate-700">
                            <span className="font-semibold text-green-700">
                              {skill}
                            </span>{" "}
                            matches this job and is verified through assessment.
                          </p>
                        </div>
                      )
                    )}

                    {unverifiedMatchedSkills.map(
                      (skill) => (
                        <div
                          key={`matched-${skill}`}
                          className="flex items-start gap-3 text-sm"
                        >
                          <span className="font-bold text-blue-700">
                            •
                          </span>

                          <p className="text-slate-700">
                            <span className="font-semibold text-blue-700">
                              {skill}
                            </span>{" "}
                            matches this job, but is not verified yet.
                          </p>
                        </div>
                      )
                    )}

                    {matchData.missingSkills.map(
                      (skill) => (
                        <div
                          key={`missing-${skill}`}
                          className="flex items-start gap-3 text-sm"
                        >
                          <span className="font-bold text-red-700">
                            ✕
                          </span>

                          <p className="text-slate-600">
                            <span className="font-semibold text-red-700">
                              {skill}
                            </span>{" "}
                            is required for this job but is missing from your profile.
                          </p>
                        </div>
                      )
                    )}

                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">

                    <MatchStat
                      label="Skills Matched"
                      value={`${matchData.matchedSkills.length}/${job.required_skills?.length || 0}`}
                    />

                    <MatchStat
                      label="Verified"
                      value={
                        matchData
                          .verifiedSkills
                          .length
                      }
                    />

                    <MatchStat
                      label="Missing"
                      value={
                        matchData
                          .missingSkills
                          .length
                      }
                    />

                  </div>

                  {matchData.missingSkills.length > 0 && (
                    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">

                      <p className="text-sm font-semibold text-amber-800">
                        Improve your match
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        Add or learn the missing skills:{" "}
                        <span className="font-medium text-slate-700">
                          {matchData.missingSkills.join(", ")}
                        </span>
                        .
                      </p>

                      <Link
                        href="/skills"
                        className="mt-3 inline-block text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Update My Skills →
                      </Link>

                    </div>
                  )}

                  {matchData.matchScore >= 80 && (
                    <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">

                      <p className="text-sm font-semibold text-green-800">
                        ✓ Strong profile fit
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        Your current skills cover most of this job&apos;s requirements. Review the role carefully and apply if it aligns with your interests.
                      </p>

                    </div>
                  )}

                </>
              )}

            </section>

            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">

              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

                <div>

                  <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                    Application Readiness
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-slate-950">
                    Are you ready to apply?
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    These checks do not block your application. They help you submit a stronger profile.
                  </p>

                </div>

                {!readinessLoading && (
                  <div className="shrink-0 sm:text-right">

                    <p className="text-3xl font-bold text-slate-950">
                      {readinessPercentage}%
                    </p>

                    <p className="mt-1 text-xs font-semibold text-blue-600">
                      {getReadinessText()}
                    </p>

                  </div>
                )}

              </div>

              {readinessLoading ? (
                <p className="mt-6 text-sm text-slate-500">
                  Checking your profile...
                </p>
              ) : (
                <>

                  <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-200">

                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          Math.max(
                            readinessPercentage,
                            0
                          ),
                          100
                        )}%`,
                      }}
                    />

                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">

                    {readinessItems.map(
                      (item) => (
                        <Link
                          key={
                            item.label
                          }
                          href={
                            item.href
                          }
                          className={`flex items-center justify-between rounded-xl border p-4 transition ${
                            item.completed
                              ? "border-green-200 bg-green-50"
                              : "border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-blue-50/40"
                          }`}
                        >
                          <div className="flex items-center gap-3">

                            <span
                              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                                item.completed
                                  ? "bg-green-100 text-green-700"
                                  : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              {item.completed
                                ? "✓"
                                : "○"}
                            </span>

                            <span
                              className={`text-sm font-medium ${
                                item.completed
                                  ? "text-green-800"
                                  : "text-slate-700"
                              }`}
                            >
                              {
                                item.label
                              }
                            </span>

                          </div>

                          {!item.completed && (
                            <span className="text-xs font-semibold text-blue-600">
                              Fix →
                            </span>
                          )}

                        </Link>
                      )
                    )}

                  </div>

                  {readinessPercentage < 100 && (
                    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">

                      <p className="text-sm font-semibold text-amber-800">
                        You can still apply
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        Completing the missing profile items may give recruiters more evidence when reviewing your application.
                      </p>

                    </div>
                  )}

                  {readinessPercentage === 100 && (
                    <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">

                      <p className="text-sm font-semibold text-green-800">
                        ✓ Your profile is application-ready
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        Your resume, skills, assessment, project and basic profile are all available for recruiter review according to access rules.
                      </p>

                    </div>
                  )}

                </>
              )}

            </section>

          </div>

          <div>

            <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="flex items-center justify-between gap-3">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                    Application
                  </p>

                  <h2 className="mt-2 text-xl font-bold text-slate-950">
                    Apply for this job
                  </h2>
                </div>

                {applied && (
                  <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    Applied
                  </span>
                )}

              </div>

              {!matchLoading && !applied && (
                <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <div>

                    <p className="text-xs text-slate-500">
                      Job match
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {getMatchLabel()}
                    </p>

                  </div>

                  <span
                    className={`text-lg font-bold ${
                      matchData.matchScore >= 80
                        ? "text-green-700"
                        : matchData.matchScore >= 50
                        ? "text-amber-700"
                        : "text-red-700"
                    }`}
                  >
                    {matchData.matchScore}%
                  </span>

                </div>
              )}

              {!readinessLoading &&
                !applied && (
                <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <div>

                    <p className="text-xs text-slate-500">
                      Profile readiness
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {
                        getReadinessText()
                      }
                    </p>

                  </div>

                  <span
                    className={`text-lg font-bold ${
                      readinessPercentage >=
                      80
                        ? "text-green-700"
                        : readinessPercentage >=
                          60
                        ? "text-amber-700"
                        : "text-red-700"
                    }`}
                  >
                    {
                      readinessPercentage
                    }
                    %
                  </span>

                </div>
              )}

              {applied ? (
                <div className="mt-6">

                  <div className="rounded-xl border border-green-200 bg-green-50 p-5">

                    <p className="font-semibold text-green-800">
                      ✓ Application Submitted
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Your application has been sent to the company.
                    </p>

                  </div>

                  <Link
                    href="/applications"
                    className="mt-5 block rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    View My Applications
                  </Link>

                </div>
              ) : (
                <>

                  <label className="mt-6 block text-sm font-medium text-slate-700">
                    Cover Letter
                  </label>

                  <textarea
                    value={
                      coverLetter
                    }
                    onChange={(
                      e
                    ) =>
                      setCoverLetter(
                        e.target.value
                      )
                    }
                    rows={7}
                    maxLength={
                      MAX_COVER_LETTER_LENGTH
                    }
                    placeholder="Tell the company why you're a good fit..."
                    className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />

                  <div className="mt-2 flex justify-end text-xs text-slate-400">
                    {coverLetter.length}/
                    {MAX_COVER_LETTER_LENGTH}
                  </div>

                  {error && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                      {
                        error
                      }
                    </div>
                  )}

                  {readinessPercentage <
                    100 &&
                    !readinessLoading && (
                    <p className="mt-4 text-xs leading-5 text-slate-500">
                      Your profile is{" "}
                      <span className="font-semibold text-slate-900">
                        {
                          readinessPercentage
                        }
                        % ready
                      </span>
                      . You can apply now or complete the missing items first.
                    </p>
                  )}

                  <button
                    onClick={
                      applyForJob
                    }
                    disabled={
                      applying || applied
                    }
                    className="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {applying
                      ? "Submitting..."
                      : "Apply Now →"}
                  </button>

                </>
              )}

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}

function MatchStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-semibold text-slate-950">
        {value}
      </p>

    </div>
  );
}
