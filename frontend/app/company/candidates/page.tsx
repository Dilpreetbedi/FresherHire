"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { requireCompany } from "../../lib/auth";
import NotificationBell from "../../components/NotificationBell";

type Candidate = {
  id: string;
  full_name: string;
  degree: string | null;
  graduation_year: number | null;
  location: string | null;
  preferred_role: string | null;
  has_resume: boolean;
};

type Skill = {
  user_id: string;
  skill_name: string;
  skill_level: string;
};

type Assessment = {
  user_id: string;
  skill_name: string;
  score: number;
  total_questions: number;
  percentage: number;
};

type Project = {
  id: number;
  user_id: string;
};

type CandidateWithData = Candidate & {
  skills: Skill[];
  assessments: Assessment[];
  projects: Project[];
};

const VERIFIED_THRESHOLD = 75;

export default function CandidatesPage() {
  const router = useRouter();

  const [candidates, setCandidates] =
    useState<CandidateWithData[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [shortlistedIds, setShortlistedIds] =
    useState<string[]>([]);

  const [shortlistingId, setShortlistingId] =
    useState<string | null>(null);

  const [actionError, setActionError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [skillFilter, setSkillFilter] =
    useState("All");

  const [assessmentFilter, setAssessmentFilter] =
    useState("All");

  const [roleFilter, setRoleFilter] =
    useState("All");

  const [locationFilter, setLocationFilter] =
    useState("All");

  const [graduationFilter, setGraduationFilter] =
    useState("All");

  const [scoreFilter, setScoreFilter] =
    useState("0");

  const [verifiedOnly, setVerifiedOnly] =
    useState(false);

  const [resumeOnly, setResumeOnly] =
    useState(false);

  const [projectsOnly, setProjectsOnly] =
    useState(false);

  useEffect(() => {
    loadCandidates();
  }, []);

  function normalizeValue(value: string) {
    return value
      .trim()
      .toLowerCase();
  }

  async function loadCandidates() {
    setLoading(true);
    setError("");
    setActionError("");

    try {
      const auth =
        await requireCompany();

      if (!auth.allowed) {
        setLoading(false);

        router.replace(
          auth.redirectTo!
        );

        return;
      }

      const user =
        auth.user;

      if (!user) {
        setLoading(false);
        router.replace("/login");
        return;
      }

      const {
        data: profiles,
        error: profileError,
      } = await supabase
        .from("recruiter_profiles")
        .select(`
          id,
          full_name,
          degree,
          graduation_year,
          location,
          preferred_role,
          has_resume
        `);

      if (profileError) {
        console.error(
          "Recruiter profiles error:",
          profileError
        );

        setError(
          profileError.message ||
            "Could not load candidates."
        );

        setLoading(false);

        return;
      }

      const candidateIds =
        (profiles || []).map(
          (profile) =>
            profile.id
        );

      if (
        candidateIds.length === 0
      ) {
        setCandidates([]);
        setShortlistedIds([]);
        setLoading(false);
        return;
      }

      const [
        skillsResult,
        assessmentsResult,
        projectsResult,
        shortlistsResult,
      ] = await Promise.all([
        supabase
          .from("skills")
          .select(`
            user_id,
            skill_name,
            skill_level
          `)
          .in(
            "user_id",
            candidateIds
          ),

        supabase
          .from("assessment_results")
          .select(`
            user_id,
            skill_name,
            score,
            total_questions,
            percentage
          `)
          .in(
            "user_id",
            candidateIds
          ),

        supabase
          .from("projects")
          .select(`
            id,
            user_id
          `)
          .in(
            "user_id",
            candidateIds
          ),

        supabase
          .from("shortlists")
          .select("candidate_id")
          .eq(
            "company_id",
            user.id
          ),
      ]);

      if (skillsResult.error) {
        console.error(
          "Skills error:",
          skillsResult.error
        );
      }

      if (assessmentsResult.error) {
        console.error(
          "Assessments error:",
          assessmentsResult.error
        );
      }

      if (projectsResult.error) {
        console.error(
          "Projects error:",
          projectsResult.error
        );
      }

      if (shortlistsResult.error) {
        console.error(
          "Shortlist error:",
          shortlistsResult.error
        );
      }

      const loadedSkills =
        skillsResult.data || [];

      const loadedAssessments =
        assessmentsResult.data || [];

      const loadedProjects =
        projectsResult.data || [];

      setShortlistedIds(
        (
          shortlistsResult.data ||
          []
        ).map(
          (item) =>
            item.candidate_id
        )
      );

      const skillsByUser =
        new Map<
          string,
          Skill[]
        >();

      loadedSkills.forEach(
        (skill) => {
          const existing =
            skillsByUser.get(
              skill.user_id
            ) || [];

          existing.push(skill);

          skillsByUser.set(
            skill.user_id,
            existing
          );
        }
      );

      const assessmentsByUser =
        new Map<
          string,
          Assessment[]
        >();

      loadedAssessments.forEach(
        (assessment) => {
          const existing =
            assessmentsByUser.get(
              assessment.user_id
            ) || [];

          existing.push(
            assessment
          );

          assessmentsByUser.set(
            assessment.user_id,
            existing
          );
        }
      );

      const projectsByUser =
        new Map<
          string,
          Project[]
        >();

      loadedProjects.forEach(
        (project) => {
          const existing =
            projectsByUser.get(
              project.user_id
            ) || [];

          existing.push(
            project
          );

          projectsByUser.set(
            project.user_id,
            existing
          );
        }
      );

      const formatted =
        (profiles || []).map(
          (profile) => ({
            ...profile,

            skills:
              skillsByUser.get(
                profile.id
              ) || [],

            assessments:
              assessmentsByUser.get(
                profile.id
              ) || [],

            projects:
              projectsByUser.get(
                profile.id
              ) || [],
          })
        );

      setCandidates(formatted);
      setLoading(false);
    } catch (err) {
      console.error(
        "Load candidates error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading candidates."
      );

      setLoading(false);
    }
  }

  function getBestAssessments(
    candidate: CandidateWithData
  ) {
    const map = new Map<
      string,
      Assessment
    >();

    candidate.assessments.forEach(
      (assessment) => {
        const key =
          normalizeValue(
            assessment.skill_name
          );

        const existing =
          map.get(key);

        if (
          !existing ||
          assessment.percentage >
            existing.percentage
        ) {
          map.set(
            key,
            assessment
          );
        }
      }
    );

    return Array.from(
      map.values()
    ).sort(
      (a, b) =>
        b.percentage -
        a.percentage
    );
  }

  function getBestScore(
    candidate: CandidateWithData
  ) {
    const bestAssessments =
      getBestAssessments(candidate);

    if (
      bestAssessments.length === 0
    ) {
      return 0;
    }

    return Math.max(
      ...bestAssessments.map(
        (assessment) =>
          assessment.percentage
      )
    );
  }

  function hasVerifiedAssessment(
    candidate: CandidateWithData
  ) {
    return getBestAssessments(
      candidate
    ).some(
      (assessment) =>
        assessment.percentage >=
        VERIFIED_THRESHOLD
    );
  }

  function getAssessmentResult(
    candidate: CandidateWithData,
    assessmentName: string
  ) {
    return getBestAssessments(
      candidate
    ).find(
      (assessment) =>
        normalizeValue(
          assessment.skill_name
        ) ===
        normalizeValue(
          assessmentName
        )
    );
  }

  const availableSkills =
    useMemo(() => {
      const values =
        candidates.flatMap(
          (candidate) =>
            candidate.skills.map(
              (skill) =>
                skill.skill_name
            )
        );

      return [
        "All",
        ...Array.from(
          new Set(values)
        ).sort(),
      ];
    }, [candidates]);

  const availableAssessments =
    useMemo(() => {
      const values =
        candidates.flatMap(
          (candidate) =>
            getBestAssessments(
              candidate
            ).map(
              (assessment) =>
                assessment.skill_name
            )
        );

      return [
        "All",
        ...Array.from(
          new Set(values)
        ).sort(),
      ];
    }, [candidates]);

  const availableRoles =
    useMemo(() => {
      const values =
        candidates
          .map(
            (candidate) =>
              candidate.preferred_role
          )
          .filter(
            (value): value is string =>
              Boolean(value)
          );

      return [
        "All",
        ...Array.from(
          new Set(values)
        ).sort(),
      ];
    }, [candidates]);

  const availableLocations =
    useMemo(() => {
      const values =
        candidates
          .map(
            (candidate) =>
              candidate.location
          )
          .filter(
            (value): value is string =>
              Boolean(value)
          );

      return [
        "All",
        ...Array.from(
          new Set(values)
        ).sort(),
      ];
    }, [candidates]);

  const availableGraduationYears =
    useMemo(() => {
      const values =
        candidates
          .map(
            (candidate) =>
              candidate.graduation_year
          )
          .filter(
            (value): value is number =>
              typeof value === "number"
          );

      return [
        "All",
        ...Array.from(
          new Set(values)
        )
          .sort(
            (a, b) =>
              b - a
          )
          .map(String),
      ];
    }, [candidates]);

  const filteredCandidates =
    useMemo(() => {
      return candidates
        .filter(
          (candidate) => {
            const bestAssessments =
              getBestAssessments(
                candidate
              );

            const searchText =
              search
                .trim()
                .toLowerCase();

            const searchMatch =
              !searchText ||
              candidate.full_name
                ?.toLowerCase()
                .includes(
                  searchText
                ) ||
              candidate.preferred_role
                ?.toLowerCase()
                .includes(
                  searchText
                ) ||
              candidate.location
                ?.toLowerCase()
                .includes(
                  searchText
                ) ||
              candidate.degree
                ?.toLowerCase()
                .includes(
                  searchText
                ) ||
              candidate.skills.some(
                (skill) =>
                  skill.skill_name
                    .toLowerCase()
                    .includes(
                      searchText
                    )
              ) ||
              bestAssessments.some(
                (assessment) =>
                  assessment.skill_name
                    .toLowerCase()
                    .includes(
                      searchText
                    )
              );

            const skillMatch =
              skillFilter ===
                "All" ||
              candidate.skills.some(
                (skill) =>
                  normalizeValue(
                    skill.skill_name
                  ) ===
                  normalizeValue(
                    skillFilter
                  )
              );

            const assessmentMatch =
              assessmentFilter ===
                "All" ||
              bestAssessments.some(
                (assessment) =>
                  normalizeValue(
                    assessment.skill_name
                  ) ===
                  normalizeValue(
                    assessmentFilter
                  )
              );

            const verifiedMatch =
              !verifiedOnly ||
              (
                assessmentFilter !== "All"
                  ? Boolean(
                      getAssessmentResult(
                        candidate,
                        assessmentFilter
                      )?.percentage >=
                        VERIFIED_THRESHOLD
                    )
                  : hasVerifiedAssessment(
                      candidate
                    )
              );

            const roleMatch =
              roleFilter ===
                "All" ||
              candidate.preferred_role ===
                roleFilter;

            const locationMatch =
              locationFilter ===
                "All" ||
              candidate.location ===
                locationFilter;

            const graduationMatch =
              graduationFilter ===
                "All" ||
              String(
                candidate.graduation_year
              ) ===
                graduationFilter;

            const bestScore =
              getBestScore(
                candidate
              );

            const scoreMatch =
              bestScore >=
              Number(
                scoreFilter
              );

            const resumeMatch =
              !resumeOnly ||
              candidate.has_resume;

            const projectMatch =
              !projectsOnly ||
              candidate.projects.length >
                0;

            return (
              searchMatch &&
              skillMatch &&
              assessmentMatch &&
              verifiedMatch &&
              roleMatch &&
              locationMatch &&
              graduationMatch &&
              scoreMatch &&
              resumeMatch &&
              projectMatch
            );
          }
        )
        .sort(
          (a, b) =>
            getBestScore(b) -
            getBestScore(a)
        );
    }, [
      candidates,
      search,
      skillFilter,
      assessmentFilter,
      roleFilter,
      locationFilter,
      graduationFilter,
      scoreFilter,
      verifiedOnly,
      resumeOnly,
      projectsOnly,
    ]);

  const activeFilterCount = [
    search.trim(),
    skillFilter !== "All"
      ? skillFilter
      : "",
    assessmentFilter !== "All"
      ? assessmentFilter
      : "",
    roleFilter !== "All"
      ? roleFilter
      : "",
    locationFilter !== "All"
      ? locationFilter
      : "",
    graduationFilter !== "All"
      ? graduationFilter
      : "",
    scoreFilter !== "0"
      ? scoreFilter
      : "",
    verifiedOnly
      ? "verified"
      : "",
    resumeOnly
      ? "resume"
      : "",
    projectsOnly
      ? "projects"
      : "",
  ].filter(Boolean).length;

  function clearFilters() {
    setActionError("");
    setSearch("");
    setSkillFilter("All");
    setAssessmentFilter("All");
    setRoleFilter("All");
    setLocationFilter("All");
    setGraduationFilter("All");
    setScoreFilter("0");
    setVerifiedOnly(false);
    setResumeOnly(false);
    setProjectsOnly(false);
  }

  async function shortlistCandidate(
    candidateId: string
  ) {
    if (shortlistingId) {
      return;
    }

    if (
      shortlistedIds.includes(
        candidateId
      )
    ) {
      return;
    }

    setShortlistingId(
      candidateId
    );

    setActionError("");

    try {
      const auth =
        await requireCompany();

      if (!auth.allowed) {
        setShortlistingId(null);

        router.replace(
          auth.redirectTo!
        );

        return;
      }

      const user =
        auth.user;

      if (!user) {
        setShortlistingId(null);

        router.replace("/login");

        return;
      }

      const {
        data: insertedShortlist,
        error: shortlistError,
      } = await supabase
        .from("shortlists")
        .insert({
          company_id:
            user.id,

          candidate_id:
            candidateId,
        })
        .select(
          "candidate_id"
        )
        .maybeSingle();

      if (shortlistError) {
        if (
          shortlistError.code ===
          "23505"
        ) {
          setShortlistedIds(
            (current) => [
              ...new Set([
                ...current,
                candidateId,
              ]),
            ]
          );
        } else {
          console.error(
            "Shortlist error:",
            shortlistError
          );

          setActionError(
            shortlistError.message ||
              "Could not shortlist candidate."
          );
        }

        setShortlistingId(null);

        return;
      }

      if (!insertedShortlist) {
        setActionError(
          "Could not confirm the shortlist update. Please try again."
        );

        setShortlistingId(null);
        return;
      }

      setShortlistedIds(
        (current) => [
          ...new Set([
            ...current,
            candidateId,
          ]),
        ]
      );
    } catch (err) {
      console.error(
        "Shortlist candidate error:",
        err
      );

      setActionError(
        err instanceof Error
          ? err.message
          : "Could not shortlist candidate."
      );
    }

    setShortlistingId(null);
  }

  async function removeShortlist(
    candidateId: string
  ) {
    if (shortlistingId) {
      return;
    }

    setShortlistingId(
      candidateId
    );

    setActionError("");

    try {
      const auth =
        await requireCompany();

      if (!auth.allowed) {
        setShortlistingId(null);

        router.replace(
          auth.redirectTo!
        );

        return;
      }

      const user =
        auth.user;

      if (!user) {
        setShortlistingId(null);

        router.replace("/login");

        return;
      }

      const {
        data: deletedShortlist,
        error: removeError,
      } = await supabase
        .from("shortlists")
        .delete()
        .eq(
          "company_id",
          user.id
        )
        .eq(
          "candidate_id",
          candidateId
        )
        .select(
          "candidate_id"
        )
        .maybeSingle();

      if (removeError) {
        console.error(
          "Remove shortlist error:",
          removeError
        );

        setActionError(
          removeError.message ||
            "Could not remove candidate from shortlist."
        );

        setShortlistingId(null);

        return;
      }

      if (!deletedShortlist) {
        setActionError(
          "Candidate was not found in your shortlist."
        );

        setShortlistingId(null);
        return;
      }

      setShortlistedIds(
        (current) =>
          current.filter(
            (id) =>
              id !==
              candidateId
          )
      );
    } catch (err) {
      console.error(
        "Remove shortlist error:",
        err
      );

      setActionError(
        err instanceof Error
          ? err.message
          : "Could not remove candidate from shortlist."
      );
    }

    setShortlistingId(null);
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
              href="/company/shortlisted"
              className="text-sm font-semibold text-slate-600 hover:text-slate-950"
            >
              Shortlisted
            </Link>

            <Link
              href="/company/dashboard"
              className="hidden text-sm font-medium text-slate-600 hover:text-slate-950 sm:block"
            >
              ← Dashboard
            </Link>

            <NotificationBell />

          </div>

        </div>

      </nav>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">

        <div>

          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
            Talent Search
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Find Freshers
          </h1>

          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            Discover entry-level candidates across technical and non-technical roles using skills, verified assessments, work samples, education and profile evidence.
          </p>

        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

          <div className="flex items-center justify-between gap-4">

            <div>

              <h2 className="font-semibold text-slate-950">
                Candidate Filters
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Filter by role, skills, assessment evidence and profile details.
              </p>

            </div>

            <button
              onClick={
                clearFilters
              }
              className="shrink-0 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              {activeFilterCount > 0
                ? `Clear All (${activeFilterCount})`
                : "Clear All"}
            </button>

          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">

            <div className="lg:col-span-2">

              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Search
              </label>

              <input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Name, role, skill, assessment, degree, location..."
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

            </div>

            <div>

              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Skill
              </label>

              <select
                value={
                  skillFilter
                }
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
                      key={
                        skill
                      }
                      value={
                        skill
                      }
                    >
                      {skill}
                    </option>
                  )
                )}

              </select>

            </div>

            <div>

              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Assessment
              </label>

              <select
                value={
                  assessmentFilter
                }
                onChange={(e) =>
                  setAssessmentFilter(
                    e.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >

                {availableAssessments.map(
                  (assessment) => (
                    <option
                      key={
                        assessment
                      }
                      value={
                        assessment
                      }
                    >
                      {assessment}
                    </option>
                  )
                )}

              </select>

            </div>

            <div>

              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Minimum Assessment Score
              </label>

              <select
                value={
                  scoreFilter
                }
                onChange={(e) =>
                  setScoreFilter(
                    e.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >

                <option value="0">
                  Any Score
                </option>

                <option value="60">
                  60%+
                </option>

                <option value="75">
                  75%+ Verified
                </option>

                <option value="80">
                  80%+
                </option>

                <option value="90">
                  90%+
                </option>

                <option value="100">
                  100%
                </option>

              </select>

            </div>

            <div>

              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Preferred Role
              </label>

              <select
                value={
                  roleFilter
                }
                onChange={(e) =>
                  setRoleFilter(
                    e.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >

                {availableRoles.map(
                  (role) => (
                    <option
                      key={
                        role
                      }
                      value={
                        role
                      }
                    >
                      {role}
                    </option>
                  )
                )}

              </select>

            </div>

            <div>

              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Location
              </label>

              <select
                value={
                  locationFilter
                }
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
                      key={
                        location
                      }
                      value={
                        location
                      }
                    >
                      {location}
                    </option>
                  )
                )}

              </select>

            </div>

            <div>

              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Graduation Year
              </label>

              <select
                value={
                  graduationFilter
                }
                onChange={(e) =>
                  setGraduationFilter(
                    e.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >

                {availableGraduationYears.map(
                  (year) => (
                    <option
                      key={
                        year
                      }
                      value={
                        year
                      }
                    >
                      {year}
                    </option>
                  )
                )}

              </select>

            </div>

          </div>

          <div className="mt-5 flex flex-wrap gap-3">

            <FilterToggle
              active={
                verifiedOnly
              }
              onClick={() =>
                setVerifiedOnly(
                  !verifiedOnly
                )
              }
              label={
                assessmentFilter ===
                "All"
                  ? "✓ Has Verified Assessment"
                  : `✓ ${assessmentFilter} Verified`
              }
            />

            <FilterToggle
              active={
                resumeOnly
              }
              onClick={() =>
                setResumeOnly(
                  !resumeOnly
                )
              }
              label="📄 Has Resume"
            />

            <FilterToggle
              active={
                projectsOnly
              }
              onClick={() =>
                setProjectsOnly(
                  !projectsOnly
                )
              }
              label="📁 Has Work Samples"
            />

          </div>

        </div>

        {error && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

              <span>
                {error}
              </span>

              <button
                onClick={
                  loadCandidates
                }
                className="w-fit rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
              >
                Retry
              </button>

            </div>

          </div>
        )}

        {actionError && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {actionError}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">

          <div>

            <h2 className="text-xl font-semibold text-slate-950">
              Candidates
            </h2>

            <p className="mt-1 text-sm text-slate-500">

              {filteredCandidates.length}{" "}
              candidate
              {filteredCandidates.length !==
              1
                ? "s"
                : ""}{" "}
              found

              {activeFilterCount > 0 &&
                ` • ${activeFilterCount} filter${activeFilterCount !== 1 ? "s" : ""} active`}

              {!loading &&
                filteredCandidates.length >
                  1 &&
                " • Highest assessment scores first"}

            </p>

          </div>

        </div>

        {loading && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-600 shadow-sm">
            Loading candidates...
          </div>
        )}

        {!loading &&
          !error &&
          filteredCandidates.length ===
            0 && (

            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">

              <div className="text-4xl">
                🔎
              </div>

              <h3 className="mt-5 text-lg font-semibold text-slate-950">
                No candidates found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {activeFilterCount > 0
                  ? "Try changing or clearing your filters."
                  : "No fresher profiles are available yet."}
              </p>

              {activeFilterCount > 0 && (
                <button
                  onClick={
                    clearFilters
                  }
                  className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  Clear Filters
                </button>
              )}

            </div>
          )}

        {!loading &&
          filteredCandidates.length >
            0 && (

            <div className="mt-6 grid gap-5">

              {filteredCandidates.map(
                (candidate) => {
                  const bestScore =
                    getBestScore(
                      candidate
                    );

                  const bestAssessments =
                    getBestAssessments(
                      candidate
                    );

                  const verifiedCount =
                    bestAssessments.filter(
                      (assessment) =>
                        assessment.percentage >=
                        VERIFIED_THRESHOLD
                    ).length;

                  const shortlisted =
                    shortlistedIds.includes(
                      candidate.id
                    );

                  return (
                    <article
                      key={
                        candidate.id
                      }
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:p-6"
                    >

                      <div className="flex flex-col justify-between gap-6 md:flex-row">

                        <div className="flex gap-5">

                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">

                            {(candidate.full_name ||
                              "C")
                              .charAt(0)
                              .toUpperCase()}

                          </div>

                          <div className="min-w-0">

                            <h3 className="break-words text-xl font-semibold text-slate-950">
                              {candidate.full_name}
                            </h3>

                            <p className="mt-1 text-sm font-medium text-blue-600">
                              {candidate.preferred_role ||
                                "Entry-Level Candidate"}
                            </p>

                            <p className="mt-2 text-sm text-slate-500">

                              {candidate.degree ||
                                "Qualification not provided"}

                              {candidate.graduation_year
                                ? ` • ${candidate.graduation_year}`
                                : ""}

                              {candidate.location
                                ? ` • ${candidate.location}`
                                : ""}

                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">

                              {candidate.has_resume && (
                                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                                  📄 Resume Available
                                </span>
                              )}

                              {candidate.projects.length >
                                0 && (
                                <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
                                  📁{" "}
                                  {candidate.projects.length}{" "}
                                  Work Sample
                                  {candidate.projects.length !==
                                  1
                                    ? "s"
                                    : ""}
                                </span>
                              )}

                              {verifiedCount >
                                0 && (
                                <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                                  ✓{" "}
                                  {verifiedCount}{" "}
                                  Verified Assessment
                                  {verifiedCount !==
                                  1
                                    ? "s"
                                    : ""}
                                </span>
                              )}

                            </div>

                          </div>

                        </div>

                        <div className="h-fit rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 text-center">

                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Best Assessment
                          </p>

                          <p
                            className={`mt-1 text-3xl font-bold ${
                              bestScore >=
                              VERIFIED_THRESHOLD
                                ? "text-green-700"
                                : bestScore >=
                                  60
                                ? "text-amber-700"
                                : "text-slate-950"
                            }`}
                          >
                            {bestAssessments.length > 0
                              ? `${bestScore}%`
                              : "—"}
                          </p>

                          {bestScore >=
                            VERIFIED_THRESHOLD && (
                            <p className="mt-1 text-xs font-semibold text-green-700">
                              ✓ Verified
                            </p>
                          )}

                          {bestAssessments.length ===
                            0 && (
                            <p className="mt-1 text-xs text-slate-500">
                              Not attempted
                            </p>
                          )}

                        </div>

                      </div>

                      <div className="mt-6">

                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Skills
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">

                          {candidate.skills.length ===
                          0 ? (

                            <span className="text-sm text-slate-500">
                              No skills added
                            </span>

                          ) : (

                            candidate.skills.map(
                              (
                                skill,
                                index
                              ) => (
                                <span
                                  key={`${candidate.id}-skill-${index}-${skill.skill_name}`}
                                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700"
                                >
                                  {skill.skill_name}

                                  <span className="ml-2 text-slate-500">
                                    {skill.skill_level}
                                  </span>

                                </span>
                              )
                            )
                          )}

                        </div>

                      </div>

                      {bestAssessments.length >
                        0 && (

                        <div className="mt-5">

                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Verified Skills & Assessments
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">

                            {bestAssessments.map(
                              (
                                assessment
                              ) => {

                                const verified =
                                  assessment.percentage >=
                                  VERIFIED_THRESHOLD;

                                return (
                                  <span
                                    key={`${candidate.id}-${assessment.skill_name}`}
                                    className={`rounded-lg border px-3 py-2 text-xs ${
                                      verified
                                        ? "border-green-200 bg-green-50"
                                        : "border-slate-200 bg-slate-50"
                                    }`}
                                  >

                                    <span className="text-slate-700">
                                      {assessment.skill_name}
                                    </span>

                                    <span
                                      className={`ml-2 font-semibold ${
                                        verified
                                          ? "text-green-700"
                                          : "text-slate-600"
                                      }`}
                                    >
                                      {assessment.percentage}%
                                    </span>

                                    {verified && (
                                      <span className="ml-2 font-semibold text-green-700">
                                        ✓
                                      </span>
                                    )}

                                  </span>
                                );
                              }
                            )}

                          </div>

                        </div>
                      )}

                      <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row">

                        <Link
                          href={`/company/candidates/${candidate.id}`}
                          className="rounded-xl bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                        >
                          View Profile →
                        </Link>

                        {shortlisted ? (

                          <button
                            onClick={() =>
                              removeShortlist(
                                candidate.id
                              )
                            }
                            disabled={
                              shortlistingId !==
                              null
                            }
                            className="rounded-xl border border-green-200 bg-green-50 px-5 py-3 text-sm font-semibold text-green-700 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {shortlistingId ===
                            candidate.id
                              ? "Updating..."
                              : "✓ Shortlisted"}
                          </button>

                        ) : (

                          <button
                            onClick={() =>
                              shortlistCandidate(
                                candidate.id
                              )
                            }
                            disabled={
                              shortlistingId !==
                              null
                            }
                            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {shortlistingId ===
                            candidate.id
                              ? "Adding..."
                              : "☆ Shortlist"}
                          </button>

                        )}

                      </div>

                    </article>
                  );
                }
              )}

            </div>
          )}

      </section>

    </main>
  );
}

function FilterToggle({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
        active
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}
