"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { requireFresher } from "../lib/auth";
import { useRouter } from "next/navigation";
import NotificationBell from "../components/NotificationBell";

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
  created_at: string;
};

type Skill = {
  skill_name: string;
  skill_level: string;
};

type Assessment = {
  skill_name: string;
  percentage: number;
};

type JobWithMatch = Job & {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  verifiedSkills: string[];
};

export default function JobsPage() {
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [userSkills, setUserSkills] = useState<Skill[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("All");
  const [jobTypeFilter, setJobTypeFilter] = useState("All");
  const [experienceFilter, setExperienceFilter] = useState("All");
  const [skillFilter, setSkillFilter] = useState("All");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const auth = await requireFresher();

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

      const [
        jobsResult,
        skillsResult,
        assessmentResult,
      ] = await Promise.all([
        supabase
          .from("jobs")
          .select("*")
          .eq("is_active", true)
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("skills")
          .select("skill_name, skill_level")
          .eq("user_id", user.id),

        supabase
          .from("assessment_results")
          .select("skill_name, percentage")
          .eq("user_id", user.id),
      ]);

      if (jobsResult.error) {
        console.error(
          "Jobs error:",
          jobsResult.error
        );

        setError(
          jobsResult.error.message ||
            "Could not load jobs."
        );

        setLoading(false);
        return;
      }

      if (skillsResult.error) {
        console.error(
          "Skills error:",
          skillsResult.error
        );
      }

      if (assessmentResult.error) {
        console.error(
          "Assessment error:",
          assessmentResult.error
        );
      }

      setJobs(
        jobsResult.data || []
      );

      setUserSkills(
        skillsResult.data || []
      );

      setAssessments(
        assessmentResult.data || []
      );

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

  function normalizeSkill(skill: string) {
    return skill.trim().toLowerCase();
  }

  function calculateMatch(job: Job): JobWithMatch {
    const requiredSkills =
      job.required_skills || [];

    if (requiredSkills.length === 0) {
      return {
        ...job,
        matchScore: 0,
        matchedSkills: [],
        missingSkills: [],
        verifiedSkills: [],
      };
    }

    const candidateSkillNames = userSkills.map(
      (skill) => normalizeSkill(skill.skill_name)
    );

    const matchedSkills = requiredSkills.filter(
      (skill) =>
        candidateSkillNames.includes(
          normalizeSkill(skill)
        )
    );

    const missingSkills = requiredSkills.filter(
      (skill) =>
        !candidateSkillNames.includes(
          normalizeSkill(skill)
        )
    );

    const bestAssessmentScores: Record<
      string,
      number
    > = {};

    assessments.forEach((assessment) => {
      const skillName = normalizeSkill(
        assessment.skill_name
      );

      const previousScore =
        bestAssessmentScores[skillName] || 0;

      if (
        assessment.percentage > previousScore
      ) {
        bestAssessmentScores[skillName] =
          assessment.percentage;
      }
    });

    const verifiedSkills = requiredSkills.filter(
      (skill) => {
        const score =
          bestAssessmentScores[
            normalizeSkill(skill)
          ];

        return score !== undefined && score >= 80;
      }
    );

    const skillCoverage =
      matchedSkills.length /
      requiredSkills.length;

    const verifiedCoverage =
      verifiedSkills.length /
      requiredSkills.length;

    const skillScore =
      skillCoverage * 80;

    const verificationScore =
      verifiedCoverage * 20;

    const finalScore = Math.round(
      skillScore + verificationScore
    );

    return {
      ...job,
      matchScore: Math.min(finalScore, 100),
      matchedSkills,
      missingSkills,
      verifiedSkills,
    };
  }

  const jobsWithMatch = useMemo(() => {
    return jobs
      .map((job) => calculateMatch(job))
      .sort(
        (a, b) =>
          b.matchScore - a.matchScore
      );
  }, [jobs, userSkills, assessments]);

  const availableLocations = useMemo(() => {
    const locations = jobs
      .map((job) => job.location)
      .filter(Boolean) as string[];

    return [
      "All",
      ...Array.from(new Set(locations)).sort(),
    ];
  }, [jobs]);

  const availableJobTypes = useMemo(() => {
    const types = jobs
      .map((job) => job.job_type)
      .filter(Boolean);

    return [
      "All",
      ...Array.from(new Set(types)).sort(),
    ];
  }, [jobs]);

  const availableExperienceLevels =
    useMemo(() => {
      const levels = jobs
        .map((job) => job.experience_level)
        .filter(Boolean);

      return [
        "All",
        ...Array.from(new Set(levels)).sort(),
      ];
    }, [jobs]);

  const availableSkills = useMemo(() => {
    const skills = jobs.flatMap(
      (job) => job.required_skills || []
    );

    return [
      "All",
      ...Array.from(new Set(skills)).sort(),
    ];
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobsWithMatch.filter((job) => {
      const searchText =
        search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        job.title
          .toLowerCase()
          .includes(searchText) ||
        job.description
          .toLowerCase()
          .includes(searchText) ||
        job.location
          ?.toLowerCase()
          .includes(searchText) ||
        job.required_skills?.some((skill) =>
          skill
            .toLowerCase()
            .includes(searchText)
        );

      const matchesLocation =
        locationFilter === "All" ||
        job.location === locationFilter;

      const matchesJobType =
        jobTypeFilter === "All" ||
        job.job_type === jobTypeFilter;

      const matchesExperience =
        experienceFilter === "All" ||
        job.experience_level ===
          experienceFilter;

      const matchesSkill =
        skillFilter === "All" ||
        job.required_skills?.some(
          (skill) =>
            normalizeSkill(skill) ===
            normalizeSkill(skillFilter)
        );

      return (
        matchesSearch &&
        matchesLocation &&
        matchesJobType &&
        matchesExperience &&
        matchesSkill
      );
    });
  }, [
    jobsWithMatch,
    search,
    locationFilter,
    jobTypeFilter,
    experienceFilter,
    skillFilter,
  ]);

  const activeFilterCount = [
    search.trim(),
    locationFilter !== "All"
      ? locationFilter
      : "",
    jobTypeFilter !== "All"
      ? jobTypeFilter
      : "",
    experienceFilter !== "All"
      ? experienceFilter
      : "",
    skillFilter !== "All"
      ? skillFilter
      : "",
  ].filter(Boolean).length;

  function clearFilters() {
    setSearch("");
    setLocationFilter("All");
    setJobTypeFilter("All");
    setExperienceFilter("All");
    setSkillFilter("All");
  }

  function getMatchStyle(score: number) {
    if (score >= 80) {
      return "border-green-200 bg-green-50 text-green-700";
    }

    if (score >= 50) {
      return "border-amber-200 bg-amber-50 text-amber-700";
    }

    return "border-slate-200 bg-slate-100 text-slate-600";
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <div className="text-center">
          <p className="font-semibold">
            Loading jobs...
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Matching opportunities to your profile
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
              href="/applications"
              className="text-sm font-medium text-slate-600 hover:text-slate-950"
            >
              My Applications
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

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              Career Opportunities
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Jobs Matched to Your Skills
            </h1>

            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              FresherHire compares your skills and verified assessments with each job&apos;s requirements.
            </p>

          </div>

          <Link
            href="/dashboard"
            className="w-fit rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            View Profile
          </Link>

        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="font-semibold text-slate-950">
                Search & Filters
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Narrow opportunities by location, role type, experience and skill.
              </p>
            </div>

            {activeFilterCount > 0 && (
              <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {activeFilterCount} active
              </span>
            )}

          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-5">

            <div className="lg:col-span-2">

              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Search
              </label>

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Job title, skill, location..."
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

            </div>

            <div>

              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Location
              </label>

              <select
                value={locationFilter}
                onChange={(e) =>
                  setLocationFilter(
                    e.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >

                {availableLocations.map(
                  (location) => (
                    <option
                      key={location}
                      value={location}
                    >
                      {location}
                    </option>
                  )
                )}

              </select>

            </div>

            <div>

              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Job Type
              </label>

              <select
                value={jobTypeFilter}
                onChange={(e) =>
                  setJobTypeFilter(
                    e.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >

                {availableJobTypes.map(
                  (type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {type}
                    </option>
                  )
                )}

              </select>

            </div>

            <div>

              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Experience
              </label>

              <select
                value={experienceFilter}
                onChange={(e) =>
                  setExperienceFilter(
                    e.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >

                {availableExperienceLevels.map(
                  (level) => (
                    <option
                      key={level}
                      value={level}
                    >
                      {level}
                    </option>
                  )
                )}

              </select>

            </div>

          </div>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">

            <div className="flex-1">

              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Required Skill
              </label>

              <select
                value={skillFilter}
                onChange={(e) =>
                  setSkillFilter(
                    e.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >

                {availableSkills.map(
                  (skill) => (
                    <option
                      key={skill}
                      value={skill}
                    >
                      {skill}
                    </option>
                  )
                )}

              </select>

            </div>

            <button
              onClick={clearFilters}
              disabled={activeFilterCount === 0}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {activeFilterCount > 0
                ? `Clear Filters (${activeFilterCount})`
                : "Clear Filters"}
            </button>

          </div>

        </div>

        {error && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <span>
                {error}
              </span>

              <button
                onClick={loadData}
                className="w-fit rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
              >
                Retry
              </button>

            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <h2 className="text-xl font-semibold text-slate-950">
              Recommended Jobs
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredJobs.length} job
              {filteredJobs.length !== 1
                ? "s"
                : ""}{" "}
              found • Best matches shown first
            </p>

          </div>

          {userSkills.length === 0 && (
            <Link
              href="/skills"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Add skills to improve matching →
            </Link>
          )}

        </div>

        {!error &&
          filteredJobs.length === 0 && (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">

              <div className="text-4xl">
                🔎
              </div>

              <h2 className="mt-5 text-xl font-semibold text-slate-950">
                No matching jobs
              </h2>

              <p className="mt-3 text-sm text-slate-500">
                {activeFilterCount > 0
                  ? "Try changing or clearing your filters."
                  : "There are no active jobs available right now."}
              </p>

              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  Clear Filters
                </button>
              )}

            </div>
          )}

        {filteredJobs.length > 0 && (
          <div className="mt-6 grid gap-6 md:grid-cols-2">

            {filteredJobs.map((job) => (

              <div
                key={job.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:p-7"
              >

                <div className="flex items-start justify-between gap-4">

                  <div className="min-w-0">

                    <h2 className="break-words text-xl font-semibold text-slate-950">
                      {job.title}
                    </h2>

                    <p className="mt-2 text-sm font-medium text-blue-600">
                      📍{" "}
                      {job.location ||
                        "Location not specified"}
                    </p>

                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold ${getMatchStyle(
                        job.matchScore
                      )}`}
                    >
                      {job.matchScore}% Match
                    </span>

                    <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                      {job.job_type}
                    </span>

                  </div>

                </div>

                <p className="mt-5 line-clamp-3 text-sm leading-6 text-slate-600">
                  {job.description}
                </p>

                <div className="mt-5">

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Required Skills
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">

                    {(job.required_skills || []).map(
                      (skill) => {

                        const matched =
                          job.matchedSkills.some(
                            (matchedSkill) =>
                              normalizeSkill(
                                matchedSkill
                              ) ===
                              normalizeSkill(skill)
                          );

                        const verified =
                          job.verifiedSkills.some(
                            (verifiedSkill) =>
                              normalizeSkill(
                                verifiedSkill
                              ) ===
                              normalizeSkill(skill)
                          );

                        return (
                          <span
                            key={skill}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                              verified
                                ? "border-green-200 bg-green-50 text-green-700"
                                : matched
                                ? "border-blue-200 bg-blue-50 text-blue-700"
                                : "border-slate-200 bg-slate-50 text-slate-600"
                            }`}
                          >
                            {verified
                              ? "✓ "
                              : matched
                              ? "• "
                              : ""}
                            {skill}
                          </span>
                        );
                      }
                    )}

                  </div>

                </div>

                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <div className="flex items-center justify-between text-xs">

                    <span className="text-slate-500">
                      Skills matched
                    </span>

                    <span className="font-semibold text-slate-900">
                      {job.matchedSkills.length}/
                      {job.required_skills.length}
                    </span>

                  </div>

                  {job.verifiedSkills.length >
                    0 && (
                    <div className="mt-2 flex items-center justify-between text-xs">

                      <span className="text-slate-500">
                        Verified skills
                      </span>

                      <span className="font-semibold text-green-700">
                        {job.verifiedSkills.length}
                      </span>

                    </div>
                  )}

                  {job.missingSkills.length >
                    0 && (
                    <div className="mt-3 border-t border-slate-200 pt-3">

                      <p className="text-xs leading-5 text-slate-500">
                        Missing:{" "}
                        <span className="text-slate-700">
                          {job.missingSkills.join(
                            ", "
                          )}
                        </span>
                      </p>

                    </div>
                  )}

                </div>

                <div className="mt-5 flex flex-wrap gap-4 text-xs text-slate-500">

                  <span>
                    🎓 {job.experience_level}
                  </span>

                  {job.salary_min !== null &&
                    job.salary_max !== null && (
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

                <Link
                  href={`/jobs/${job.id}`}
                  className="mt-7 block rounded-xl bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  View Job & Apply →
                </Link>

              </div>

            ))}

          </div>
        )}

      </section>

    </main>
  );
}
