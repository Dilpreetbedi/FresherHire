"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { requireCompany } from "../../../lib/auth";
import NotificationBell from "../../../components/NotificationBell";

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
  id: number;
  user_id: string;
  skill_name: string;
  skill_level: string;
};

type Assessment = {
  id: number;
  user_id: string;
  skill_name: string;
  score: number;
  total_questions: number;
  percentage: number;
  created_at: string;
};

type Project = {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  technologies: string | null;
  github_url: string | null;
  live_url: string | null;
  created_at: string;
};

type ContactAccess = {
  email: string | null;
  phone_number: string | null;
  can_contact: boolean;
  access_reason:
    | "allowed"
    | "candidate_not_connected"
    | "paid_plan_required"
    | string;
  subscription_plan: string | null;
};

export default function CandidateProfilePage() {
  const params = useParams();
  const router = useRouter();

  const candidateId =
    typeof params.id === "string"
      ? params.id
      : "";

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [skills, setSkills] =
    useState<Skill[]>([]);

  const [assessments, setAssessments] =
    useState<Assessment[]>([]);

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [contactEmail, setContactEmail] =
    useState<string | null>(null);

  const [contactPhone, setContactPhone] =
    useState<string | null>(null);

  const [canContact, setCanContact] =
    useState(false);

  const [contactAccessReason, setContactAccessReason] =
    useState("");

  const [subscriptionPlan, setSubscriptionPlan] =
    useState("free");

  const [showContactCard, setShowContactCard] =
    useState(false);

  const [copyMessage, setCopyMessage] =
    useState("");

  const [resumeSignedUrl, setResumeSignedUrl] =
    useState<string | null>(null);

  const [resumeLoading, setResumeLoading] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [actionError, setActionError] =
    useState("");

  const [isShortlisted, setIsShortlisted] =
    useState(false);

  const [shortlisting, setShortlisting] =
    useState(false);

  useEffect(() => {
    if (!candidateId) {
      setError("Invalid candidate.");
      setLoading(false);
      return;
    }

    loadCandidate();
  }, [candidateId]);

  async function loadContactAccess(
    hasResume: boolean
  ) {
    setContactEmail(null);
    setContactPhone(null);
    setCanContact(false);
    setContactAccessReason("");
    setSubscriptionPlan("free");
    setResumeSignedUrl(null);
    setShowContactCard(false);
    setCopyMessage("");

    const {
      data,
      error: contactError,
    } = await supabase.rpc(
      "get_candidate_contact",
      {
        p_candidate_id:
          candidateId,
      }
    );

    if (contactError) {
      console.error(
        "Candidate contact access error:",
        contactError
      );

      return;
    }

    const contact =
      Array.isArray(data) &&
      data.length > 0
        ? (data[0] as ContactAccess)
        : null;

    const allowed =
      Boolean(
        contact?.can_contact
      );

    setCanContact(allowed);

    setContactAccessReason(
      contact?.access_reason || ""
    );

    setSubscriptionPlan(
      contact?.subscription_plan || "free"
    );

    setContactEmail(
      allowed
        ? contact?.email || null
        : null
    );

    setContactPhone(
      allowed
        ? contact?.phone_number || null
        : null
    );

    if (
      allowed &&
      hasResume
    ) {
      await createCandidateResumeSignedUrl();
    }
  }

  async function copyText(
    value: string,
    successMessage: string
  ) {
    try {
      await navigator.clipboard.writeText(
        value
      );

      setCopyMessage(
        successMessage
      );

      window.setTimeout(() => {
        setCopyMessage("");
      }, 1800);
    } catch (err) {
      console.error(
        "Copy contact error:",
        err
      );

      setCopyMessage(
        "Could not copy automatically. Select the contact detail and copy it manually."
      );
    }
  }

  async function createCandidateResumeSignedUrl() {
    setResumeSignedUrl(null);
    setResumeLoading(true);

    const filePath =
      `${candidateId}/resume.pdf`;

    const {
      data,
      error: signedUrlError,
    } = await supabase.storage
      .from("resumes")
      .createSignedUrl(
        filePath,
        60 * 10
      );

    if (signedUrlError) {
      console.error(
        "Resume signed URL error:",
        signedUrlError
      );

      setResumeLoading(false);
      return;
    }

    setResumeSignedUrl(
      data.signedUrl
    );

    setResumeLoading(false);
  }

  async function loadCandidate() {
    setLoading(true);
    setError("");
    setActionError("");
    setContactEmail(null);
    setContactPhone(null);
    setCanContact(false);
    setContactAccessReason("");
    setSubscriptionPlan("free");
    setResumeSignedUrl(null);
    setShowContactCard(false);
    setCopyMessage("");

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

      const user = auth.user;

      if (!user) {
        setLoading(false);
        router.replace("/login");
        return;
      }

      const {
        data: profileData,
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
        `)
        .eq(
          "id",
          candidateId
        )
        .maybeSingle();

      if (profileError) {
        console.error(
          "Recruiter profile error:",
          profileError
        );

        setError(
          profileError.message ||
            "Could not load this candidate."
        );

        setLoading(false);
        return;
      }

      if (!profileData) {
        setError(
          "Candidate profile not found."
        );

        setLoading(false);
        return;
      }

      setProfile(profileData);

      const [
        skillsResult,
        assessmentsResult,
        projectsResult,
        shortlistResult,
      ] = await Promise.all([
        supabase
          .from("skills")
          .select("*")
          .eq(
            "user_id",
            candidateId
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          ),

        supabase
          .from("assessment_results")
          .select("*")
          .eq(
            "user_id",
            candidateId
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          ),

        supabase
          .from("projects")
          .select("*")
          .eq(
            "user_id",
            candidateId
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          ),

        supabase
          .from("shortlists")
          .select("id")
          .eq(
            "company_id",
            user.id
          )
          .eq(
            "candidate_id",
            candidateId
          )
          .maybeSingle(),
      ]);

      if (skillsResult.error) {
        console.error(
          "Skills error:",
          skillsResult.error
        );
      } else {
        setSkills(
          skillsResult.data || []
        );
      }

      if (
        assessmentsResult.error
      ) {
        console.error(
          "Assessment error:",
          assessmentsResult.error
        );
      } else {
        setAssessments(
          assessmentsResult.data ||
            []
        );
      }

      if (projectsResult.error) {
        console.error(
          "Projects error:",
          projectsResult.error
        );
      } else {
        setProjects(
          projectsResult.data ||
            []
        );
      }

      if (
        shortlistResult.error
      ) {
        console.error(
          "Shortlist check error:",
          shortlistResult.error
        );
      }

      setIsShortlisted(
        Boolean(
          shortlistResult.data
        )
      );

      await loadContactAccess(
        profileData.has_resume
      );

      setLoading(false);
    } catch (err) {
      console.error(
        "Candidate load error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading this candidate."
      );

      setLoading(false);
    }
  }

  const bestAssessments =
    useMemo(() => {
      const map = new Map<
        string,
        Assessment
      >();

      assessments.forEach(
        (assessment) => {
          const key =
            assessment.skill_name
              .trim()
              .toLowerCase();

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
    }, [assessments]);

  const verifiedSkillNames =
    useMemo(() => {
      return bestAssessments
        .filter(
          (assessment) =>
            assessment.percentage >=
            75
        )
        .map(
          (assessment) =>
            assessment.skill_name
              .trim()
              .toLowerCase()
        );
    }, [bestAssessments]);

  async function shortlistCandidate() {
    if (
      shortlisting ||
      isShortlisted
    ) {
      return;
    }

    setShortlisting(true);
    setActionError("");

    try {
      const auth =
        await requireCompany();

      if (!auth.allowed) {
        setShortlisting(false);

        router.replace(
          auth.redirectTo!
        );

        return;
      }

      const user = auth.user;

      if (!user) {
        setShortlisting(false);
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
        .select("candidate_id")
        .maybeSingle();

      if (shortlistError) {
        if (
          shortlistError.code ===
          "23505"
        ) {
          setIsShortlisted(true);

          if (profile) {
            await loadContactAccess(
              profile.has_resume
            );
          }
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

        setShortlisting(false);
        return;
      }

      if (!insertedShortlist) {
        setActionError(
          "Could not confirm the shortlist update. Please try again."
        );

        setShortlisting(false);
        return;
      }

      setIsShortlisted(true);

      if (profile) {
        await loadContactAccess(
          profile.has_resume
        );
      }
    } catch (err) {
      console.error(
        "Shortlist error:",
        err
      );

      setActionError(
        err instanceof Error
          ? err.message
          : "Could not shortlist candidate."
      );
    }

    setShortlisting(false);
  }

  async function removeFromShortlist() {
    if (
      shortlisting ||
      !isShortlisted
    ) {
      return;
    }

    setShortlisting(true);
    setActionError("");

    try {
      const auth =
        await requireCompany();

      if (!auth.allowed) {
        setShortlisting(false);

        router.replace(
          auth.redirectTo!
        );

        return;
      }

      const user = auth.user;

      if (!user) {
        setShortlisting(false);
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
        .select("candidate_id")
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

        setShortlisting(false);
        return;
      }

      if (!deletedShortlist) {
        setActionError(
          "Candidate was not found in your shortlist."
        );

        setShortlisting(false);
        return;
      }

      setIsShortlisted(false);

      if (profile) {
        await loadContactAccess(
          profile.has_resume
        );
      }
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

    setShortlisting(false);
  }

  function getScoreStyle(
    percentage: number
  ) {
    if (percentage >= 75) {
      return "border-green-200 bg-green-50 text-green-700";
    }

    if (percentage >= 60) {
      return "border-amber-200 bg-amber-50 text-amber-700";
    }

    return "border-red-200 bg-red-50 text-red-700";
  }

  function parseTechnologies(
    technologies: string | null
  ) {
    if (!technologies) {
      return [];
    }

    return Array.from(
      new Set(
        technologies
          .split(",")
          .map(
            (tech) =>
              tech.trim()
          )
          .filter(Boolean)
      )
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <div className="text-center">
          <p className="font-semibold">
            Loading candidate...
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Preparing profile evidence
          </p>
        </div>
      </main>
    );
  }

  if (
    error ||
    !profile
  ) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-20 text-slate-900 sm:px-6">

        <div className="mx-auto max-w-xl text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl">
            👤
          </div>

          <h1 className="mt-6 text-3xl font-bold text-slate-950">
            Candidate Not Found
          </h1>

          <p className="mt-4 text-slate-600">
            {error ||
              "This candidate could not be found."}
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">

            <Link
              href="/company/candidates"
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              ← Back to Candidates
            </Link>

            <button
              onClick={
                loadCandidate
              }
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Retry
            </button>

          </div>

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
              className="text-sm font-semibold text-slate-600 hover:text-slate-950"
            >
              Find Freshers
            </Link>

            <Link
              href="/company/shortlisted"
              className="hidden text-sm font-medium text-slate-600 hover:text-slate-950 sm:block"
            >
              Shortlisted
            </Link>

            <Link
              href="/company/pricing"
              className="hidden text-sm font-medium text-slate-600 hover:text-slate-950 md:block"
            >
              Plans
            </Link>

            <Link
              href="/company/dashboard"
              className="hidden text-sm font-medium text-slate-600 hover:text-slate-950 lg:block"
            >
              Dashboard
            </Link>

            <NotificationBell />

          </div>

        </div>

      </nav>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">

        <Link
          href="/company/candidates"
          className="text-sm font-semibold text-slate-500 hover:text-slate-900"
        >
          ← Back to Candidates
        </Link>

        {actionError && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {actionError}
          </div>
        )}

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">

          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">

            <div className="flex flex-col gap-5 sm:flex-row">

              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-3xl font-bold text-blue-700">
                {(profile.full_name ||
                  "C")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="min-w-0">

                <h1 className="break-words text-3xl font-bold text-slate-950">
                  {profile.full_name}
                </h1>

                <p className="mt-2 text-lg font-medium text-blue-600">
                  {profile.preferred_role ||
                    "Fresher Candidate"}
                </p>

                <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">

                  {profile.location && (
                    <span>
                      📍{" "}
                      {profile.location}
                    </span>
                  )}

                  {profile.degree && (
                    <span>
                      🎓{" "}
                      {profile.degree}
                    </span>
                  )}

                  {profile.graduation_year && (
                    <span>
                      📅 Class of{" "}
                      {profile.graduation_year}
                    </span>
                  )}

                </div>

              </div>

            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">

              {profile.has_resume &&
                canContact && (
                <ResumeButton
                  signedUrl={
                    resumeSignedUrl
                  }
                  loading={
                    resumeLoading
                  }
                  label="📄 View Resume ↗"
                />
              )}

              {isShortlisted ? (

                <button
                  onClick={
                    removeFromShortlist
                  }
                  disabled={
                    shortlisting
                  }
                  className="rounded-xl border border-green-200 bg-green-50 px-5 py-3 text-sm font-semibold text-green-700 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {shortlisting
                    ? "Updating..."
                    : "✓ Shortlisted"}
                </button>

              ) : (

                <button
                  onClick={
                    shortlistCandidate
                  }
                  disabled={
                    shortlisting
                  }
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {shortlisting
                    ? "Adding..."
                    : "☆ Shortlist"}
                </button>

              )}

            </div>

          </div>

        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            label="Skills"
            value={
              skills.length
            }
          />

          <StatCard
            label="Verified Skills"
            value={
              verifiedSkillNames.length
            }
          />

          <StatCard
            label="Projects"
            value={
              projects.length
            }
          />

          <StatCard
            label="Resume"
            value={
              profile.has_resume
                ? canContact
                  ? "Available"
                  : contactAccessReason ===
                    "paid_plan_required"
                  ? "Paid Plan"
                  : "Locked"
                : "Not Added"
            }
          />

        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                Candidate Resume
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                Resume
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Resume access requires an eligible candidate relationship and an active Starter or Pro recruiter plan.
              </p>

            </div>

            {!profile.has_resume ? (

              <span className="w-fit rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500">
                No resume uploaded
              </span>

            ) : !canContact ? (

              contactAccessReason ===
              "paid_plan_required" ? (

                <Link
                  href="/company/pricing"
                  className="w-fit rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100"
                >
                  🔒 Upgrade for Resume →
                </Link>

              ) : (

                <span className="w-fit rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
                  🔒 Resume Locked
                </span>

              )

            ) : (

              <ResumeButton
                signedUrl={
                  resumeSignedUrl
                }
                loading={
                  resumeLoading
                }
                label="📄 Open Resume ↗"
                primary
              />

            )}

          </div>

          {profile.has_resume &&
            !canContact && (

            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">

              <p className="text-sm font-semibold text-amber-800">
                {contactAccessReason ===
                "paid_plan_required"
                  ? "🔒 Recruiter upgrade required"
                  : "🔒 Private candidate document"}
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-600">
                {contactAccessReason ===
                "paid_plan_required"
                  ? `Your ${subscriptionPlan} plan does not include candidate contact and resume access. Upgrade to Starter or Pro to unlock these details.`
                  : "Shortlist this candidate, or review them after they apply to one of your jobs, to become eligible for private contact and resume access."}
              </p>

              {contactAccessReason ===
                "paid_plan_required" && (

                <Link
                  href="/company/pricing"
                  className="mt-3 inline-block text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  View Recruiter Plans →
                </Link>

              )}

            </div>
          )}

          {profile.has_resume &&
            canContact &&
            resumeSignedUrl && (

            <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">

              <p className="text-sm font-semibold text-green-800">
                ✓ Resume access enabled
              </p>

              <p className="mt-1 text-xs text-slate-600">
                This private resume link is temporary and expires automatically.
              </p>

            </div>
          )}

          {profile.has_resume &&
            canContact &&
            !resumeSignedUrl &&
            !resumeLoading && (

            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">

              <p className="text-sm font-semibold text-amber-800">
                Resume temporarily unavailable
              </p>

              <p className="mt-1 text-xs text-slate-600">
                Access is allowed, but a secure resume link could not be generated.
              </p>

              <button
                onClick={
                  createCandidateResumeSignedUrl
                }
                className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Retry Resume Link
              </button>

            </div>
          )}

        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
            Candidate Expertise
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Skills
          </h2>

          {skills.length === 0 ? (

            <p className="mt-6 text-sm text-slate-500">
              Candidate has not added any skills yet.
            </p>

          ) : (

            <div className="mt-6 flex flex-wrap gap-3">

              {skills.map(
                (skill) => {
                  const verified =
                    verifiedSkillNames.includes(
                      skill.skill_name
                        .trim()
                        .toLowerCase()
                    );

                  return (
                    <div
                      key={
                        skill.id
                      }
                      className={`rounded-xl border px-4 py-3 ${
                        verified
                          ? "border-green-200 bg-green-50"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >

                      <div className="flex items-center gap-2">

                        {verified && (
                          <span className="text-green-700">
                            ✓
                          </span>
                        )}

                        <span
                          className={
                            verified
                              ? "font-semibold text-green-700"
                              : "font-semibold text-slate-900"
                          }
                        >
                          {skill.skill_name}
                        </span>

                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        {skill.skill_level}
                        {verified &&
                          " • Verified"}
                      </p>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
            Skill Evidence
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Assessment Results
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Best assessment attempt for each skill is shown.
          </p>

          {bestAssessments.length === 0 ? (

            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-sm text-slate-500">
                No assessment results yet.
              </p>
            </div>

          ) : (

            <div className="mt-6 grid gap-4 md:grid-cols-2">

              {bestAssessments.map(
                (assessment) => (

                  <div
                    key={
                      assessment.id
                    }
                    className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                  >

                    <div className="flex items-center justify-between gap-4">

                      <div>

                        <h3 className="font-semibold text-slate-950">
                          {assessment.skill_name}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          {assessment.score}/
                          {assessment.total_questions}{" "}
                          correct
                        </p>

                      </div>

                      <span
                        className={`rounded-full border px-3 py-1.5 text-xs font-bold ${getScoreStyle(
                          assessment.percentage
                        )}`}
                      >
                        {assessment.percentage}%
                      </span>

                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">

                      <div
                        className={
                          assessment.percentage >= 75
                            ? "h-full rounded-full bg-green-600"
                            : "h-full rounded-full bg-blue-600"
                        }
                        style={{
                          width: `${Math.min(
                            Math.max(
                              assessment.percentage,
                              0
                            ),
                            100
                          )}%`,
                        }}
                      />

                    </div>

                    {assessment.percentage >= 75 && (

                      <p className="mt-3 text-xs font-semibold text-green-700">
                        ✓ Verified Skill
                      </p>

                    )}

                  </div>

                )
              )}

            </div>
          )}

        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
            Proof of Work
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Projects
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Real projects help demonstrate practical experience beyond a resume.
          </p>

          {projects.length === 0 ? (

            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">

              <div className="text-3xl">
                💻
              </div>

              <p className="mt-4 text-sm text-slate-500">
                Candidate hasn&apos;t added any projects yet.
              </p>

            </div>

          ) : (

            <div className="mt-6 grid gap-5 md:grid-cols-2">

              {projects.map(
                (project) => {
                  const technologies =
                    parseTechnologies(
                      project.technologies
                    );

                  return (
                    <div
                      key={
                        project.id
                      }
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6"
                    >

                      <h3 className="break-words text-lg font-bold text-slate-950">
                        {project.title}
                      </h3>

                      {project.description && (

                        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                          {project.description}
                        </p>

                      )}

                      {technologies.length > 0 && (

                        <div className="mt-4 flex flex-wrap gap-2">

                          {technologies.map(
                            (technology) => (

                              <span
                                key={
                                  technology
                                }
                                className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                              >
                                {technology}
                              </span>

                            )
                          )}

                        </div>

                      )}

                      {(project.github_url ||
                        project.live_url) && (

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">

                          {project.github_url && (

                            <a
                              href={
                                project.github_url
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                            >
                              GitHub ↗
                            </a>

                          )}

                          {project.live_url && (

                            <a
                              href={
                                project.live_url
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-xl bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                            >
                              Live Demo ↗
                            </a>

                          )}

                        </div>
                      )}

                    </div>
                  );
                }
              )}

            </div>
          )}

        </section>

        <section className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:p-7">

          <h2 className="text-xl font-bold text-slate-950">
            Interested in this candidate?
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Candidate contact and resume access require both an eligible candidate relationship and an active paid recruiter plan.
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">

            {canContact &&
            (contactEmail ||
              contactPhone) ? (

              <button
                type="button"
                onClick={() => {
                  setShowContactCard(
                    (current) =>
                      !current
                  );
                  setCopyMessage("");
                }}
                className="rounded-xl bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                {showContactCard
                  ? "Hide Contact"
                  : "Contact Candidate"}
              </button>

            ) : (

              contactAccessReason ===
              "paid_plan_required" ? (

                <Link
                  href="/company/pricing"
                  className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-center text-sm font-semibold text-amber-700 shadow-sm hover:bg-amber-100"
                >
                  🔒 Upgrade to Contact →
                </Link>

              ) : (

                <span className="cursor-not-allowed rounded-xl border border-slate-300 bg-slate-100 px-5 py-3 text-center text-sm font-semibold text-slate-500">
                  🔒 Contact Locked
                </span>

              )

            )}

            {profile.has_resume &&
              canContact && (

              <ResumeButton
                signedUrl={
                  resumeSignedUrl
                }
                loading={
                  resumeLoading
                }
                label="View Resume ↗"
              />

            )}

            <Link
              href="/company/shortlisted"
              className="rounded-xl border border-blue-200 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 shadow-sm hover:bg-blue-50"
            >
              View Shortlisted
            </Link>

          </div>

          {canContact &&
            (contactEmail ||
              contactPhone) &&
            showContactCard && (

            <div className="mt-5 rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">

              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                Candidate Contact
              </p>

              <h3 className="mt-2 text-lg font-bold text-slate-950">
                {profile.full_name}
              </h3>

              <div className="mt-4 grid gap-4 md:grid-cols-2">

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Email
                  </p>

                  <p className="mt-2 break-all text-sm font-semibold text-slate-950">
                    {contactEmail ||
                      "Not provided"}
                  </p>

                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Phone
                  </p>

                  <p className="mt-2 break-all text-sm font-semibold text-slate-950">
                    {contactPhone ||
                      "Not provided"}
                  </p>

                </div>

              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">

                {contactEmail && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          contactEmail,
                          "Email copied."
                        )
                      }
                      className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      Copy Email
                    </button>

                    <a
                      href={`mailto:${contactEmail}`}
                      className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-center text-sm font-semibold text-blue-700 hover:bg-blue-100"
                    >
                      Open Email App ↗
                    </a>
                  </>
                )}

                {contactPhone && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          contactPhone,
                          "Phone number copied."
                        )
                      }
                      className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      Copy Phone
                    </button>

                    <a
                      href={`tel:${contactPhone.replace(
                        /[^+\d]/g,
                        ""
                      )}`}
                      className="rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                    >
                      Call Candidate
                    </a>
                  </>
                )}

              </div>

              {copyMessage && (
                <p className="mt-3 text-xs font-medium text-green-700">
                  {copyMessage}
                </p>
              )}

            </div>
          )}

          {canContact &&
            !contactEmail &&
            !contactPhone && (

            <p className="mt-4 text-xs leading-5 text-slate-500">
              Contact access is enabled, but this candidate has not provided contact details yet.
            </p>

          )}

          {!canContact &&
            contactAccessReason ===
              "paid_plan_required" && (

            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">

              <p className="text-sm font-semibold text-amber-800">
                Upgrade your recruiter plan to contact this candidate
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-600">
                This candidate is eligible for contact, but your current {subscriptionPlan} plan does not include private email, phone, or resume access. Starter or Pro access is required.
              </p>

              <Link
                href="/company/pricing"
                className="mt-4 inline-block rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                View Plans & Upgrade →
              </Link>

            </div>
          )}

          {!canContact &&
            contactAccessReason !==
              "paid_plan_required" && (

            <p className="mt-4 text-xs leading-5 text-slate-500">
              Shortlist this candidate, or review them after they apply to one of your jobs, before private contact access can be considered.
            </p>

          )}

        </section>

      </section>

    </main>
  );
}

function ResumeButton({
  signedUrl,
  loading,
  label,
  primary = false,
}: {
  signedUrl: string | null;
  loading: boolean;
  label: string;
  primary?: boolean;
}) {
  if (
    loading ||
    !signedUrl
  ) {
    return (
      <span
        className={`cursor-not-allowed rounded-xl px-5 py-3 text-center text-sm font-semibold opacity-60 ${
          primary
            ? "bg-blue-600 text-white"
            : "border border-blue-200 bg-blue-50 text-blue-700"
        }`}
      >
        {loading
          ? "Preparing Resume..."
          : "Resume Unavailable"}
      </span>
    );
  }

  return (
    <a
      href={
        signedUrl
      }
      target="_blank"
      rel="noopener noreferrer"
      className={`rounded-xl px-5 py-3 text-center text-sm font-semibold shadow-sm ${
        primary
          ? "bg-blue-600 text-white hover:bg-blue-700"
          : "border border-blue-200 bg-white text-blue-700 hover:bg-blue-50"
      }`}
    >
      {label}
    </a>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-950">
        {value}
      </p>

    </div>
  );
}