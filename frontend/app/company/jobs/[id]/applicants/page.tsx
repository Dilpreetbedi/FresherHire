"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";
import { requireCompany } from "../../../../lib/auth";
import NotificationBell from "../../../../components/NotificationBell";

type Job = {
  id: number;
  title: string;
  description: string;
  required_skills: string[];
  location: string | null;
  job_type: string;
  experience_level: string;
};

type ApplicationRow = {
  id: number;
  job_id: number;
  candidate_id: string;
  status:
    | "applied"
    | "shortlisted"
    | "rejected"
    | "hired";
  cover_letter: string | null;
  created_at: string;
};

type Profile = {
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
  percentage: number;
};

type Applicant = ApplicationRow & {
  profile: Profile | null;
  skills: Skill[];
  assessments: Assessment[];
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  verifiedSkills: string[];
};

export default function ApplicantsPage() {
  const params = useParams();
  const router = useRouter();

  const jobId = Number(params.id);

  const [job, setJob] = useState<Job | null>(null);

  const [applications, setApplications] =
    useState<ApplicationRow[]>([]);

  const [profiles, setProfiles] =
    useState<Profile[]>([]);

  const [skills, setSkills] =
    useState<Skill[]>([]);

  const [assessments, setAssessments] =
    useState<Assessment[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [updatingId, setUpdatingId] =
    useState<number | null>(null);

  const [pendingStatus, setPendingStatus] =
    useState<
      | "shortlisted"
      | "rejected"
      | "hired"
      | null
    >(null);

  const [statusFilter, setStatusFilter] =
    useState("all");

  useEffect(() => {
    if (!Number.isInteger(jobId) || jobId <= 0) {
      setError("Invalid job.");
      setLoading(false);
      return;
    }

    loadApplicants();
  }, [jobId]);

  function normalizeSkill(skill: string) {
    return skill.trim().toLowerCase();
  }

  async function loadApplicants() {
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

      const {
        data: jobData,
        error: jobError,
      } = await supabase
        .from("jobs")
        .select(`
          id,
          title,
          description,
          required_skills,
          location,
          job_type,
          experience_level
        `)
        .eq("id", jobId)
        .eq("company_id", user.id)
        .maybeSingle();

      if (jobError) {
        console.error(
          "Job error:",
          jobError
        );

        setError(
          jobError.message ||
            "Could not load this job."
        );

        setLoading(false);
        return;
      }

      if (!jobData) {
        setError(
          "Job not found or you do not have permission to view it."
        );

        setLoading(false);
        return;
      }

      setJob(jobData);

      const {
        data: applicationData,
        error: applicationError,
      } = await supabase
        .from("applications")
        .select(`
          id,
          job_id,
          candidate_id,
          status,
          cover_letter,
          created_at
        `)
        .eq("job_id", jobId)
        .order("created_at", {
          ascending: false,
        });

      if (applicationError) {
        console.error(
          "Applications error:",
          applicationError
        );

        setError(
          applicationError.message ||
            "Could not load applications."
        );

        setLoading(false);
        return;
      }

      const loadedApplications =
        applicationData || [];

      setApplications(
        loadedApplications
      );

      if (
        loadedApplications.length === 0
      ) {
        setProfiles([]);
        setSkills([]);
        setAssessments([]);
        setLoading(false);
        return;
      }

      const candidateIds =
        Array.from(
          new Set(
            loadedApplications.map(
              (application) =>
                application.candidate_id
            )
          )
        );

      const [
        profilesResult,
        skillsResult,
        assessmentsResult,
      ] = await Promise.all([
        supabase
          .from("recruiter_profiles")
          .select(`
            id,
            full_name,
            degree,
            graduation_year,
            location,
            preferred_role,
            has_resume
          `)
          .in("id", candidateIds),

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
            percentage
          `)
          .in(
            "user_id",
            candidateIds
          ),
      ]);

      if (profilesResult.error) {
        console.error(
          "Profiles error:",
          profilesResult.error
        );

        setError(
          profilesResult.error.message ||
            "Could not load applicant profiles."
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

      if (assessmentsResult.error) {
        console.error(
          "Assessments error:",
          assessmentsResult.error
        );
      }

      setProfiles(
        profilesResult.data || []
      );

      setSkills(
        skillsResult.data || []
      );

      setAssessments(
        assessmentsResult.data || []
      );

      setLoading(false);
    } catch (err) {
      console.error(
        "Unexpected applicants load error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading applicants."
      );

      setLoading(false);
    }
  }

  function calculateApplicantMatch(
    application: ApplicationRow
  ) {
    if (!job) {
      return {
        matchScore: 0,
        matchedSkills: [],
        missingSkills: [],
        verifiedSkills: [],
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
        missingSkills: [],
        verifiedSkills: [],
      };
    }

    const candidateSkills =
      skills.filter(
        (skill) =>
          skill.user_id ===
          application.candidate_id
      );

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
            normalizeSkill(skill)
          )
      );

    const missingSkills =
      requiredSkills.filter(
        (skill) =>
          !candidateSkillNames.includes(
            normalizeSkill(skill)
          )
      );

    const candidateAssessments =
      assessments.filter(
        (assessment) =>
          assessment.user_id ===
          application.candidate_id
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

        const previousScore =
          bestScores[skillName] || 0;

        if (
          assessment.percentage >
          previousScore
        ) {
          bestScores[skillName] =
            assessment.percentage;
        }
      }
    );

    const verifiedSkills =
      requiredSkills.filter(
        (skill) => {
          const score =
            bestScores[
              normalizeSkill(skill)
            ];

          return (
            score !== undefined &&
            score >= 75
          );
        }
      );

    const skillCoverage =
      matchedSkills.length /
      requiredSkills.length;

    const verificationCoverage =
      verifiedSkills.length /
      requiredSkills.length;

    const skillScore =
      skillCoverage * 80;

    const verificationScore =
      verificationCoverage * 20;

    const matchScore =
      Math.min(
        Math.round(
          skillScore +
            verificationScore
        ),
        100
      );

    return {
      matchScore,
      matchedSkills,
      missingSkills,
      verifiedSkills,
    };
  }

  function getCandidateAssessmentEvidence(
    candidateId: string,
    skillName: string
  ) {
    const normalizedSkill =
      normalizeSkill(skillName);

    const skillAttempts =
      assessments.filter(
        (assessment) =>
          assessment.user_id ===
            candidateId &&
          normalizeSkill(
            assessment.skill_name
          ) === normalizedSkill
      );

    const bestPercentage =
      skillAttempts.reduce(
        (best, assessment) =>
          Math.max(
            best,
            assessment.percentage
          ),
        0
      );

    return {
      bestPercentage,
      attemptCount:
        skillAttempts.length,
    };
  }

  function getAssessmentLevel(
    percentage: number
  ) {
    if (percentage >= 95) {
      return "Exceptional";
    }

    if (percentage >= 85) {
      return "Strong";
    }

    if (percentage >= 75) {
      return "Verified";
    }

    if (percentage >= 60) {
      return "Developing";
    }

    return "Not Verified";
  }

  const applicants =
    useMemo(() => {
      return applications
        .map((application) => {
          const profile =
            profiles.find(
              (profile) =>
                profile.id ===
                application.candidate_id
            ) || null;

          const candidateSkills =
            skills.filter(
              (skill) =>
                skill.user_id ===
                application.candidate_id
            );

          const candidateAssessments =
            assessments.filter(
              (assessment) =>
                assessment.user_id ===
                application.candidate_id
            );

          const match =
            calculateApplicantMatch(
              application
            );

          return {
            ...application,
            profile,
            skills:
              candidateSkills,
            assessments:
              candidateAssessments,
            ...match,
          };
        })
        .sort(
          (a, b) =>
            b.matchScore -
            a.matchScore
        );
    }, [
      applications,
      profiles,
      skills,
      assessments,
      job,
    ]);

  const filteredApplicants =
    useMemo(() => {
      if (
        statusFilter === "all"
      ) {
        return applicants;
      }

      return applicants.filter(
        (applicant) =>
          applicant.status ===
          statusFilter
      );
    }, [
      applicants,
      statusFilter,
    ]);

  async function updateStatus(
    applicationId: number,
    status:
      | "shortlisted"
      | "rejected"
      | "hired"
  ) {
    if (updatingId !== null) {
      return;
    }

    const application =
      applications.find(
        (item) =>
          item.id ===
          applicationId
      );

    if (!application) {
      setError(
        "Application not found."
      );
      return;
    }

    if (
      application.status === status
    ) {
      return;
    }

    if (
      status === "rejected"
    ) {
      const confirmed =
        window.confirm(
          "Reject this candidate? The candidate will be notified."
        );

      if (!confirmed) {
        return;
      }
    }

    if (
      status === "hired"
    ) {
      const confirmed =
        window.confirm(
          "Mark this candidate as hired? The candidate will be notified."
        );

      if (!confirmed) {
        return;
      }
    }

    setUpdatingId(
      applicationId
    );

    setPendingStatus(status);
    setError("");

    try {
      const auth =
        await requireCompany();

      if (!auth.allowed) {
        setUpdatingId(null);
        setPendingStatus(null);

        router.replace(
          auth.redirectTo!
        );

        return;
      }

      const user = auth.user;

      if (!user) {
        setUpdatingId(null);
        setPendingStatus(null);

        router.replace("/login");

        return;
      }

      const {
        data: ownedJob,
        error: ownedJobError,
      } = await supabase
        .from("jobs")
        .select("id")
        .eq("id", jobId)
        .eq(
          "company_id",
          user.id
        )
        .maybeSingle();

      if (ownedJobError) {
        console.error(
          "Job ownership check error:",
          ownedJobError
        );

        setError(
          ownedJobError.message ||
            "Could not verify job ownership."
        );

        setUpdatingId(null);
        setPendingStatus(null);
        return;
      }

      if (!ownedJob) {
        setError(
          "You do not have permission to update applicants for this job."
        );

        setUpdatingId(null);
        setPendingStatus(null);

        router.replace(
          "/company/jobs"
        );

        return;
      }

      const {
        data: updatedApplication,
        error: updateError,
      } = await supabase
        .from("applications")
        .update({
          status,
        })
        .eq(
          "id",
          applicationId
        )
        .eq(
          "job_id",
          jobId
        )
        .select(
          "id, job_id, status"
        )
        .maybeSingle();

      if (updateError) {
        console.error(
          "Application update error:",
          updateError
        );

        setError(
          updateError.message ||
            "Could not update application status."
        );

        setUpdatingId(null);
        setPendingStatus(null);
        return;
      }

      if (!updatedApplication) {
        setError(
          "Application not found or you no longer have permission to update it."
        );

        setUpdatingId(null);
        setPendingStatus(null);
        return;
      }

      setApplications(
        (current) =>
          current.map(
            (item) =>
              item.id ===
                applicationId &&
              item.job_id ===
                jobId
                ? {
                    ...item,
                    status:
                      updatedApplication.status as ApplicationRow["status"],
                  }
                : item
          )
      );
    } catch (err) {
      console.error(
        "Unexpected application update error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not update application status."
      );
    }

    setUpdatingId(null);
    setPendingStatus(null);
  }

  function getMatchStyle(
    score: number
  ) {
    if (score >= 80) {
      return "border-green-200 bg-green-50 text-green-700";
    }

    if (score >= 50) {
      return "border-amber-200 bg-amber-50 text-amber-700";
    }

    return "border-red-200 bg-red-50 text-red-700";
  }

  function getStatusStyle(
    status: string
  ) {
    switch (status) {
      case "shortlisted":
        return "border-blue-200 bg-blue-50 text-blue-700";
      case "rejected":
        return "border-red-200 bg-red-50 text-red-700";
      case "hired":
        return "border-green-200 bg-green-50 text-green-700";
      default:
        return "border-amber-200 bg-amber-50 text-amber-700";
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

  const appliedCount =
    applicants.filter(
      (applicant) =>
        applicant.status === "applied"
    ).length;

  const shortlistedCount =
    applicants.filter(
      (applicant) =>
        applicant.status === "shortlisted"
    ).length;

  const hiredCount =
    applicants.filter(
      (applicant) =>
        applicant.status === "hired"
    ).length;

  const rejectedCount =
    applicants.filter(
      (applicant) =>
        applicant.status === "rejected"
    ).length;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <div className="text-center">
          <p className="font-semibold">
            Loading applicants...
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Ranking candidates for this role
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
              href="/company/jobs"
              className="text-sm font-semibold text-slate-600 hover:text-slate-950"
            >
              My Jobs
            </Link>

            <Link
              href="/company/dashboard"
              className="hidden text-sm font-medium text-slate-600 hover:text-slate-950 sm:block"
            >
              Dashboard
            </Link>

            <NotificationBell />

          </div>

        </div>

      </nav>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">

        <Link
          href="/company/jobs"
          className="text-sm font-semibold text-slate-500 hover:text-slate-900"
        >
          ← Back to My Jobs
        </Link>

        {error && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

              <span>
                {error}
              </span>

              <button
                onClick={
                  loadApplicants
                }
                className="w-fit rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
              >
                Retry
              </button>

            </div>

          </div>
        )}

        {!error && job && (
          <>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

              <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
                Applicants
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                {job.title}
              </h1>

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">

                <span>
                  📍{" "}
                  {job.location ||
                    "Location not specified"}
                </span>

                <span>
                  💼 {job.job_type}
                </span>

                <span>
                  🎓{" "}
                  {job.experience_level}
                </span>

              </div>

              <div className="mt-5 flex flex-wrap gap-2">

                {(job.required_skills || []).map(
                  (skill) => (
                    <span
                      key={skill}
                      className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700"
                    >
                      {skill}
                    </span>
                  )
                )}

              </div>

            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

              <StatCard
                label="Total Applicants"
                value={
                  applicants.length
                }
              />

              <StatCard
                label="Applied"
                value={
                  appliedCount
                }
              />

              <StatCard
                label="Shortlisted"
                value={
                  shortlistedCount
                }
              />

              <StatCard
                label="Hired"
                value={
                  hiredCount
                }
              />

              <StatCard
                label="Rejected"
                value={
                  rejectedCount
                }
              />

            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h2 className="text-2xl font-bold text-slate-950">
                  Candidate Rankings
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Applicants are ranked using 80% required-skill coverage and 20% verified-skill coverage. A skill is verified when the candidate has a best assessment score of at least 75%.
                </p>

              </div>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value
                  )
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >

                <option value="all">
                  All Applicants
                </option>

                <option value="applied">
                  Applied
                </option>

                <option value="shortlisted">
                  Shortlisted
                </option>

                <option value="hired">
                  Hired
                </option>

                <option value="rejected">
                  Rejected
                </option>

              </select>

            </div>

            {filteredApplicants.length === 0 && (

              <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">

                <div className="text-4xl">
                  👥
                </div>

                <h3 className="mt-5 text-xl font-semibold text-slate-950">
                  No applicants found
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  {statusFilter === "all"
                    ? "Applications for this job will appear here."
                    : "No applicants currently match this status filter."}
                </p>

              </div>

            )}

            <div className="mt-8 space-y-6">

              {filteredApplicants.map(
                (
                  applicant,
                  index
                ) => {

                  const profile =
                    applicant.profile;

                  const unverifiedMatchedSkills =
                    applicant.matchedSkills.filter(
                      (skill) =>
                        !applicant.verifiedSkills.some(
                          (verifiedSkill) =>
                            normalizeSkill(
                              verifiedSkill
                            ) ===
                            normalizeSkill(
                              skill
                            )
                        )
                    );

                  return (
                    <article
                      key={applicant.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 sm:p-7"
                    >

                      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

                        <div className="flex gap-4">

                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600">
                            #{index + 1}
                          </div>

                          <div className="min-w-0">

                            <h3 className="break-words text-xl font-bold text-slate-950">
                              {profile?.full_name ||
                                "Candidate"}
                            </h3>

                            <p className="mt-1 text-sm font-medium text-blue-600">
                              {profile?.preferred_role ||
                                "Fresher"}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">

                              {profile?.location && (
                                <span>
                                  📍 {profile.location}
                                </span>
                              )}

                              {profile?.degree && (
                                <span>
                                  🎓 {profile.degree}
                                </span>
                              )}

                              {profile?.graduation_year && (
                                <span>
                                  📅 {profile.graduation_year}
                                </span>
                              )}

                              {profile?.has_resume && (
                                <span>
                                  📄 Resume available
                                </span>
                              )}

                              <span>
                                Applied{" "}
                                {formatDate(
                                  applicant.created_at
                                )}
                              </span>

                            </div>

                          </div>

                        </div>

                        <div className="flex flex-wrap items-center gap-3">

                          <span
                            className={`rounded-full border px-4 py-2 text-sm font-bold ${getMatchStyle(
                              applicant.matchScore
                            )}`}
                          >
                            {applicant.matchScore}% Match
                          </span>

                          <span
                            className={`rounded-full border px-4 py-2 text-xs font-semibold ${getStatusStyle(
                              applicant.status
                            )}`}
                          >
                            {formatStatus(
                              applicant.status
                            )}
                          </span>

                        </div>

                      </div>

                      <div className="mt-6">

                        <div className="mb-2 flex justify-between text-xs text-slate-500">

                          <span>
                            Job Match
                          </span>

                          <span>
                            {applicant.matchScore}%
                          </span>

                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-200">

                          <div
                            className="h-full rounded-full bg-blue-600 transition-all"
                            style={{
                              width: `${Math.min(
                                Math.max(
                                  applicant.matchScore,
                                  0
                                ),
                                100
                              )}%`,
                            }}
                          />

                        </div>

                      </div>

                      <div className="mt-6">

                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Required Skill Match
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">

                          {(job.required_skills || []).map(
                            (skill) => {

                              const matched =
                                applicant.matchedSkills.some(
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

                              const verified =
                                applicant.verifiedSkills.some(
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

                              return (
                                <span
                                  key={skill}
                                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
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

                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-3">

                        <SmallStat
                          label="Skills Matched"
                          value={`${applicant.matchedSkills.length}/${job.required_skills?.length || 0}`}
                        />

                        <SmallStat
                          label="Verified Skills"
                          value={
                            applicant
                              .verifiedSkills
                              .length
                          }
                        />

                        <SmallStat
                          label="Missing Skills"
                          value={
                            applicant
                              .missingSkills
                              .length
                          }
                        />

                      </div>

                      {applicant.missingSkills.length >
                        0 && (

                        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">

                          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                            Missing required skills
                          </p>

                          <p className="mt-1 text-sm text-slate-700">
                            {applicant.missingSkills.join(
                              ", "
                            )}
                          </p>

                        </div>

                      )}

                      <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-5">

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                          <div>

                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                              Why this candidate?
                            </p>

                            <h4 className="mt-2 text-lg font-semibold text-slate-950">

                              {applicant.matchScore >= 80
                                ? "Strong Match"
                                : applicant.matchScore >= 50
                                ? "Moderate Match"
                                : "Low Match"}

                            </h4>

                          </div>

                          <span
                            className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${getMatchStyle(
                              applicant.matchScore
                            )}`}
                          >
                            {applicant.matchScore}% Match
                          </span>

                        </div>

                        <div className="mt-5 space-y-3">

                          {applicant.verifiedSkills.map(
                            (skill) => {
                              const evidence =
                                getCandidateAssessmentEvidence(
                                  applicant.candidate_id,
                                  skill
                                );

                              return (
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

                                    is verified with a best score of{" "}
                                    <span className="font-semibold text-slate-900">
                                      {evidence.bestPercentage}%
                                    </span>{" "}
                                    ({getAssessmentLevel(
                                      evidence.bestPercentage
                                    )}) across{" "}
                                    <span className="font-semibold text-slate-900">
                                      {evidence.attemptCount}
                                    </span>{" "}
                                    attempt
                                    {evidence.attemptCount !== 1
                                      ? "s"
                                      : ""}.

                                  </p>

                                </div>
                              );
                            }
                          )}

                          {unverifiedMatchedSkills.map(
                            (skill) => (
                              <div
                                key={`matched-${skill}`}
                                className="flex items-start gap-3 text-sm"
                              >

                                <span className="font-bold text-blue-600">
                                  •
                                </span>

                                <p className="text-slate-700">

                                  <span className="font-semibold text-blue-700">
                                    {skill}
                                  </span>{" "}

                                  is listed in the candidate&apos;s skills but has not been verified yet.

                                </p>

                              </div>
                            )
                          )}

                          {applicant.missingSkills.map(
                            (skill) => (
                              <div
                                key={`missing-${skill}`}
                                className="flex items-start gap-3 text-sm"
                              >

                                <span className="font-bold text-red-600">
                                  ✕
                                </span>

                                <p className="text-slate-600">

                                  <span className="font-semibold text-red-700">
                                    {skill}
                                  </span>{" "}

                                  is missing from the candidate&apos;s profile.

                                </p>

                              </div>
                            )
                          )}

                          {applicant.verifiedSkills.length === 0 &&
                            unverifiedMatchedSkills.length === 0 &&
                            applicant.missingSkills.length === 0 && (
                              <p className="text-sm text-slate-600">
                                This job currently has no required skills configured.
                              </p>
                            )}

                        </div>

                        <div className="mt-5 border-t border-blue-200 pt-4">

                          <p className="text-sm leading-6 text-slate-700">

                            {applicant.matchScore >= 80 ? (
                              <>
                                This candidate matches most of the required skills for{" "}
                                <span className="font-semibold text-slate-950">
                                  {job.title}
                                </span>
                                . They have{" "}
                                <span className="font-semibold text-green-700">
                                  {applicant.verifiedSkills.length}
                                </span>{" "}
                                verified skill
                                {applicant.verifiedSkills.length !== 1
                                  ? "s"
                                  : ""}{" "}
                                and{" "}
                                <span className="font-semibold text-slate-950">
                                  {applicant.missingSkills.length}
                                </span>{" "}
                                missing required skill
                                {applicant.missingSkills.length !== 1
                                  ? "s"
                                  : ""}
                                .
                              </>
                            ) : applicant.matchScore >= 50 ? (
                              <>
                                This candidate has relevant skills for{" "}
                                <span className="font-semibold text-slate-950">
                                  {job.title}
                                </span>
                                , but{" "}
                                <span className="font-semibold text-amber-700">
                                  {applicant.missingSkills.length}
                                </span>{" "}
                                required skill
                                {applicant.missingSkills.length !== 1
                                  ? "s are"
                                  : " is"}{" "}
                                still missing. Review their profile and projects before deciding.
                              </>
                            ) : (
                              <>
                                This candidate currently has limited overlap with the required skills for{" "}
                                <span className="font-semibold text-slate-950">
                                  {job.title}
                                </span>
                                . Review their full profile, skills, and projects before making a decision.
                              </>
                            )}

                          </p>

                        </div>

                      </div>

                      {applicant.cover_letter && (

                        <details className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5">

                          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-600">
                            Cover Letter
                          </summary>

                          <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                            {applicant.cover_letter}
                          </p>

                        </details>

                      )}

                      <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-200 pt-6">

                        <Link
                          href={`/company/candidates/${applicant.candidate_id}`}
                          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                          View Profile →
                        </Link>

                        {applicant.status !==
                          "shortlisted" && (
                          <button
                            onClick={() =>
                              updateStatus(
                                applicant.id,
                                "shortlisted"
                              )
                            }
                            disabled={
                              updatingId ===
                              applicant.id
                            }
                            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {updatingId ===
                              applicant.id &&
                            pendingStatus ===
                              "shortlisted"
                              ? "Updating..."
                              : "Shortlist"}
                          </button>
                        )}

                        {applicant.status !==
                          "hired" && (
                          <button
                            onClick={() =>
                              updateStatus(
                                applicant.id,
                                "hired"
                              )
                            }
                            disabled={
                              updatingId ===
                              applicant.id
                            }
                            className="rounded-xl border border-green-200 bg-green-50 px-5 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {updatingId ===
                              applicant.id &&
                            pendingStatus ===
                              "hired"
                              ? "Updating..."
                              : "Hire"}
                          </button>
                        )}

                        {applicant.status !==
                          "rejected" && (
                          <button
                            onClick={() =>
                              updateStatus(
                                applicant.id,
                                "rejected"
                              )
                            }
                            disabled={
                              updatingId ===
                              applicant.id
                            }
                            className="rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {updatingId ===
                              applicant.id &&
                            pendingStatus ===
                              "rejected"
                              ? "Updating..."
                              : "Reject"}
                          </button>
                        )}

                      </div>

                    </article>
                  );
                }
              )}

            </div>

          </>
        )}

      </section>

    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
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

function SmallStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-semibold text-slate-950">
        {value}
      </p>

    </div>
  );
}
