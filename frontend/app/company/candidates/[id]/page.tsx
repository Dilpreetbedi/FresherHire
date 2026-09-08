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

type ProfileSummary = {
  resume_headline: string | null;
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

type Education = {
  id: number;
  user_id: string;
  education_level:
    | "10th"
    | "12th"
    | "diploma"
    | "bachelors"
    | "masters"
    | "doctorate"
    | "other";
  institution_name: string;
  board_or_university: string | null;
  degree_or_course: string | null;
  specialization: string | null;
  start_year: number | null;
  end_year: number | null;
  score_type:
    | "percentage"
    | "cgpa_10"
    | "cgpa_4"
    | "other"
    | null;
  score_value: number | null;
  location: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
};

type Employment = {
  id: number;
  user_id: string;
  employment_type:
    | "full_time"
    | "internship"
    | "part_time"
    | "contract"
    | "freelance"
    | "apprenticeship"
    | "other";
  company_name: string;
  role_title: string;
  location: string | null;
  work_mode: "onsite" | "hybrid" | "remote" | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  skills_used: string | null;
  created_at: string;
  updated_at: string;
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

type CandidateActivity = {
  last_login_at: string | null;
  last_seen_at: string | null;
  active_seconds_today: number;
  active_seconds_7d: number;
};

export default function CandidateProfilePage() {
  const params = useParams();
  const router = useRouter();

  const candidateId =
    typeof params.id === "string" ? params.id : "";

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileSummary, setProfileSummary] =
    useState<ProfileSummary | null>(null);

  const [skills, setSkills] = useState<Skill[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [employment, setEmployment] = useState<Employment[]>([]);

  const [activity, setActivity] = useState<CandidateActivity | null>(null);

  const [contactEmail, setContactEmail] = useState<string | null>(null);
  const [contactPhone, setContactPhone] = useState<string | null>(null);
  const [canContact, setCanContact] = useState(false);
  const [contactAccessReason, setContactAccessReason] = useState("");
  const [subscriptionPlan, setSubscriptionPlan] = useState("free");
  const [showContactCard, setShowContactCard] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");

  const [resumeSignedUrl, setResumeSignedUrl] = useState<string | null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const [isShortlisted, setIsShortlisted] = useState(false);
  const [shortlisting, setShortlisting] = useState(false);

  useEffect(() => {
    if (!candidateId) {
      setError("Invalid candidate.");
      setLoading(false);
      return;
    }

    loadCandidate();
  }, [candidateId]);

  async function loadContactAccess() {
    setContactEmail(null);
    setContactPhone(null);
    setCanContact(false);
    setContactAccessReason("");
    setSubscriptionPlan("free");
    setShowContactCard(false);
    setCopyMessage("");

    const { data, error: contactError } = await supabase.rpc(
      "get_candidate_contact",
      {
        p_candidate_id: candidateId,
      }
    );

    if (contactError) {
      console.error("Candidate contact access error:", contactError);
      return;
    }

    const contact =
      Array.isArray(data) && data.length > 0
        ? (data[0] as ContactAccess)
        : null;

    const allowed = Boolean(contact?.can_contact);

    setCanContact(allowed);
    setContactAccessReason(contact?.access_reason || "");
    setSubscriptionPlan(contact?.subscription_plan || "free");
    setContactEmail(allowed ? contact?.email || null : null);
    setContactPhone(allowed ? contact?.phone_number || null : null);
  }

  async function loadCandidateActivity() {
    const { data, error: activityError } = await supabase.rpc(
      "get_candidate_activity",
      {
        p_candidate_id: candidateId,
      }
    );

    if (activityError) {
      console.error("Candidate activity error:", activityError);
      setActivity(null);
      return;
    }

    const row =
      Array.isArray(data) && data.length > 0
        ? (data[0] as CandidateActivity)
        : null;

    setActivity(
      row
        ? {
            last_login_at: row.last_login_at || null,
            last_seen_at: row.last_seen_at || null,
            active_seconds_today: Number(row.active_seconds_today || 0),
            active_seconds_7d: Number(row.active_seconds_7d || 0),
          }
        : null
    );
  }

  async function loadCandidateProfileSummary() {
    const { data, error: summaryError } = await supabase.rpc(
      "get_candidate_profile_summary",
      {
        p_candidate_id: candidateId,
      }
    );

    if (summaryError) {
      console.error("Candidate profile summary error:", summaryError);
      setProfileSummary(null);
      return;
    }

    const row =
      Array.isArray(data) && data.length > 0
        ? (data[0] as ProfileSummary)
        : null;

    setProfileSummary(row);
  }

  async function copyText(
    value: string,
    successMessage: string
  ) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage(successMessage);

      window.setTimeout(() => {
        setCopyMessage("");
      }, 1800);
    } catch (err) {
      console.error("Copy contact error:", err);

      setCopyMessage(
        "Could not copy automatically. Select the contact detail and copy it manually."
      );
    }
  }

  async function createCandidateResumeSignedUrl() {
    setResumeSignedUrl(null);
    setResumeLoading(true);

    const filePath = `${candidateId}/resume.pdf`;

    const { data, error: signedUrlError } = await supabase.storage
      .from("resumes")
      .createSignedUrl(filePath, 60 * 10);

    if (signedUrlError) {
      console.error("Resume signed URL error:", signedUrlError);
      setResumeLoading(false);
      return;
    }

    setResumeSignedUrl(data.signedUrl);
    setResumeLoading(false);
  }

  async function loadCandidate() {
    setLoading(true);
    setError("");
    setActionError("");
    setActivity(null);
    setProfileSummary(null);

    setContactEmail(null);
    setContactPhone(null);
    setCanContact(false);
    setContactAccessReason("");
    setSubscriptionPlan("free");
    setResumeSignedUrl(null);
    setShowContactCard(false);
    setCopyMessage("");

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

      const { data: profileData, error: profileError } = await supabase
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
        .eq("id", candidateId)
        .maybeSingle();

      if (profileError) {
        console.error("Recruiter profile error:", profileError);

        setError(
          profileError.message || "Could not load this candidate."
        );

        setLoading(false);
        return;
      }

      if (!profileData) {
        setError("Candidate profile not found.");
        setLoading(false);
        return;
      }

      setProfile(profileData);

      const [
        skillsResult,
        assessmentsResult,
        projectsResult,
        shortlistResult,
        educationResult,
        employmentResult,
      ] = await Promise.all([
        supabase
          .from("skills")
          .select("*")
          .eq("user_id", candidateId)
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("assessment_results")
          .select("*")
          .eq("user_id", candidateId)
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("projects")
          .select("*")
          .eq("user_id", candidateId)
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("shortlists")
          .select("id")
          .eq("company_id", user.id)
          .eq("candidate_id", candidateId)
          .maybeSingle(),

        supabase
          .from("education_details")
          .select("*")
          .eq("user_id", candidateId)
          .order("end_year", {
            ascending: false,
            nullsFirst: true,
          }),

        supabase
          .from("employment_details")
          .select("*")
          .eq("user_id", candidateId)
          .order("start_date", {
            ascending: false,
          }),
      ]);

      if (skillsResult.error) {
        console.error("Skills error:", skillsResult.error);
      } else {
        setSkills(skillsResult.data || []);
      }

      if (assessmentsResult.error) {
        console.error("Assessment error:", assessmentsResult.error);
      } else {
        setAssessments(assessmentsResult.data || []);
      }

      if (projectsResult.error) {
        console.error("Projects error:", projectsResult.error);
      } else {
        setProjects(projectsResult.data || []);
      }

      if (educationResult.error) {
        console.error("Education error:", educationResult.error);
      } else {
        setEducation(educationResult.data || []);
      }

      if (employmentResult.error) {
        console.error("Employment error:", employmentResult.error);
      } else {
        setEmployment(employmentResult.data || []);
      }

      if (shortlistResult.error) {
        console.error("Shortlist check error:", shortlistResult.error);
      }

      setIsShortlisted(Boolean(shortlistResult.data));

      if (profileData.has_resume) {
        await createCandidateResumeSignedUrl();
      }

      await Promise.all([
        loadContactAccess(),
        loadCandidateActivity(),
        loadCandidateProfileSummary(),
      ]);

      setLoading(false);
    } catch (err) {
      console.error("Candidate load error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading this candidate."
      );

      setLoading(false);
    }
  }

  const bestAssessments = useMemo(() => {
    const map = new Map<string, Assessment>();

    assessments.forEach((assessment) => {
      const key = assessment.skill_name
        .trim()
        .toLowerCase();

      const existing = map.get(key);

      if (
        !existing ||
        assessment.percentage > existing.percentage
      ) {
        map.set(key, assessment);
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => b.percentage - a.percentage
    );
  }, [assessments]);

  const verifiedAssessmentCount = useMemo(
    () =>
      bestAssessments.filter(
        (assessment) => assessment.percentage >= 75
      ).length,
    [bestAssessments]
  );

  async function shortlistCandidate() {
    if (shortlisting || isShortlisted) {
      return;
    }

    setShortlisting(true);
    setActionError("");

    try {
      const auth = await requireCompany();

      if (!auth.allowed) {
        setShortlisting(false);
        router.replace(auth.redirectTo!);
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
          company_id: user.id,
          candidate_id: candidateId,
        })
        .select("candidate_id")
        .maybeSingle();

      if (shortlistError) {
        if (shortlistError.code === "23505") {
          setIsShortlisted(true);
          await loadContactAccess();
        } else {
          console.error("Shortlist error:", shortlistError);

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
      await loadContactAccess();
    } catch (err) {
      console.error("Shortlist error:", err);

      setActionError(
        err instanceof Error
          ? err.message
          : "Could not shortlist candidate."
      );
    }

    setShortlisting(false);
  }

  async function removeFromShortlist() {
    if (shortlisting || !isShortlisted) {
      return;
    }

    setShortlisting(true);
    setActionError("");

    try {
      const auth = await requireCompany();

      if (!auth.allowed) {
        setShortlisting(false);
        router.replace(auth.redirectTo!);
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
        .eq("company_id", user.id)
        .eq("candidate_id", candidateId)
        .select("candidate_id")
        .maybeSingle();

      if (removeError) {
        console.error("Remove shortlist error:", removeError);

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
      await loadContactAccess();
    } catch (err) {
      console.error("Remove shortlist error:", err);

      setActionError(
        err instanceof Error
          ? err.message
          : "Could not remove candidate from shortlist."
      );
    }

    setShortlisting(false);
  }

  function getScoreStyle(percentage: number) {
    if (percentage >= 75) {
      return "border-green-200 bg-green-50 text-green-700";
    }

    if (percentage >= 60) {
      return "border-amber-200 bg-amber-50 text-amber-700";
    }

    return "border-red-200 bg-red-50 text-red-700";
  }

  function parseTechnologies(technologies: string | null) {
    if (!technologies) {
      return [];
    }

    return Array.from(
      new Set(
        technologies
          .split(",")
          .map((tech) => tech.trim())
          .filter(Boolean)
      )
    );
  }

  function formatDuration(seconds: number) {
    if (!seconds || seconds <= 0) {
      return "0m";
    }

    const totalMinutes = Math.floor(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours <= 0) {
      return `${Math.max(totalMinutes, 1)}m`;
    }

    if (minutes === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${minutes}m`;
  }

  function getPresenceInfo(lastSeenAt: string | null) {
    if (!lastSeenAt) {
      return {
        label: "No activity yet",
        detail: "Activity tracking has not started for this candidate.",
        className:
          "border-slate-200 bg-slate-50 text-slate-600",
        dotClassName: "bg-slate-400",
      };
    }

    const lastSeenMs = new Date(lastSeenAt).getTime();

    if (Number.isNaN(lastSeenMs)) {
      return {
        label: "Offline",
        detail: "Last active time unavailable",
        className:
          "border-slate-200 bg-slate-50 text-slate-600",
        dotClassName: "bg-slate-400",
      };
    }

    const differenceMs = Date.now() - lastSeenMs;
    const minutes = Math.max(
      0,
      Math.floor(differenceMs / 60000)
    );

    if (minutes < 2) {
      return {
        label: "Online now",
        detail: "Active just now",
        className:
          "border-green-200 bg-green-50 text-green-700",
        dotClassName: "bg-green-500",
      };
    }

    if (minutes < 15) {
      return {
        label: "Recently active",
        detail: `Last active ${minutes}m ago`,
        className:
          "border-amber-200 bg-amber-50 text-amber-700",
        dotClassName: "bg-amber-500",
      };
    }

    if (minutes < 60) {
      return {
        label: "Offline",
        detail: `Last active ${minutes}m ago`,
        className:
          "border-slate-200 bg-slate-50 text-slate-600",
        dotClassName: "bg-slate-400",
      };
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return {
        label: "Offline",
        detail: `Last active ${hours}h ago`,
        className:
          "border-slate-200 bg-slate-50 text-slate-600",
        dotClassName: "bg-slate-400",
      };
    }

    const days = Math.floor(hours / 24);

    return {
      label: "Offline",
      detail: `Last active ${days}d ago`,
      className:
        "border-slate-200 bg-slate-50 text-slate-600",
      dotClassName: "bg-slate-400",
    };
  }

  function formatLoginDate(value: string | null) {
    if (!value) {
      return "Not recorded";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Not recorded";
    }

    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  function educationLevelLabel(level: Education["education_level"]) {
    const labels: Record<Education["education_level"], string> = {
      "10th": "Class X",
      "12th": "Class XII",
      diploma: "Diploma",
      bachelors: "Bachelor's",
      masters: "Master's",
      doctorate: "Doctorate / PhD",
      other: "Other Education",
    };

    return labels[level];
  }

  function scoreLabel(item: Education) {
    if (item.score_value === null || item.score_value === undefined) {
      return null;
    }

    if (item.score_type === "percentage") {
      return `${item.score_value}%`;
    }

    if (item.score_type === "cgpa_10") {
      return `${item.score_value}/10 CGPA`;
    }

    if (item.score_type === "cgpa_4") {
      return `${item.score_value}/4 CGPA`;
    }

    return String(item.score_value);
  }

  function employmentTypeLabel(type: Employment["employment_type"]) {
    const labels: Record<Employment["employment_type"], string> = {
      full_time: "Full Time",
      internship: "Internship",
      part_time: "Part Time",
      contract: "Contract",
      freelance: "Freelance",
      apprenticeship: "Apprenticeship",
      other: "Other",
    };

    return labels[type];
  }

  function formatMonthYear(value: string | null) {
    if (!value) return "";

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat("en-IN", {
      month: "short",
      year: "numeric",
    }).format(date);
  }

  const presence = getPresenceInfo(
    activity?.last_seen_at || null
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <div className="text-center">
          <p className="font-semibold">
            Loading candidate...
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Preparing candidate evidence
          </p>
        </div>
      </main>
    );
  }

  if (error || !profile) {
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
            {error || "This candidate could not be found."}
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/company/candidates"
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              ← Back to Candidates
            </Link>

            <button
              onClick={loadCandidate}
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
            Fresher<span className="text-blue-600">Hire</span>
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
                {(profile.full_name || "C")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="min-w-0">
                <h1 className="break-words text-3xl font-bold text-slate-950">
                  {profile.full_name}
                </h1>

                <p className="mt-2 text-lg font-medium text-blue-600">
                  {profile.preferred_role || "Fresher Candidate"}
                </p>

                {profileSummary?.resume_headline && (
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                    {profileSummary.resume_headline}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
                  {profile.location && (
                    <span>📍 {profile.location}</span>
                  )}

                  {profile.degree && (
                    <span>🎓 {profile.degree}</span>
                  )}

                  {profile.graduation_year && (
                    <span>📅 Class of {profile.graduation_year}</span>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${presence.className}`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${presence.dotClassName}`}
                    />
                    {presence.label}
                  </span>

                  <span className="text-xs text-slate-500">
                    {presence.detail}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {profile.has_resume && (
                <ResumeButton
                  signedUrl={resumeSignedUrl}
                  loading={resumeLoading}
                  label="📄 View Resume ↗"
                />
              )}

              {isShortlisted ? (
                <button
                  onClick={removeFromShortlist}
                  disabled={shortlisting}
                  className="rounded-xl border border-green-200 bg-green-50 px-5 py-3 text-sm font-semibold text-green-700 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {shortlisting
                    ? "Updating..."
                    : "✓ Shortlisted"}
                </button>
              ) : (
                <button
                  onClick={shortlistCandidate}
                  disabled={shortlisting}
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

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <StatCard label="Skills" value={skills.length} />
          <StatCard
            label="Verified Assessments"
            value={verifiedAssessmentCount}
          />
          <StatCard
            label="Experience"
            value={employment.length}
          />
          <StatCard
            label="Education"
            value={education.length}
          />
          <StatCard
            label="Work Samples"
            value={projects.length}
          />
          <StatCard
            label="Resume"
            value={profile.has_resume ? "Available" : "Not Added"}
          />
        </div>

        {profileSummary?.resume_headline && (
          <section className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
              Resume Headline
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              Professional Summary
            </h2>

            <p className="mt-4 max-w-4xl text-base leading-7 text-slate-700">
              {profileSummary.resume_headline}
            </p>
          </section>
        )}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                Student Activity
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                Login & Activity Status
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Activity time counts while the fresher is actively using
                FresherHire in a visible browser tab.
              </p>
            </div>

            <span
              className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${presence.className}`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${presence.dotClassName}`}
              />
              {presence.label}
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ActivityCard
              label="Last Active"
              value={presence.detail.replace(/^Last active /, "")}
            />

            <ActivityCard
              label="Active Today"
              value={formatDuration(
                activity?.active_seconds_today || 0
              )}
            />

            <ActivityCard
              label="Active This Week"
              value={formatDuration(
                activity?.active_seconds_7d || 0
              )}
            />

            <ActivityCard
              label="Last Login"
              value={formatLoginDate(
                activity?.last_login_at || null
              )}
            />
          </div>

          {!activity?.last_seen_at && (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">
                No activity recorded yet
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Activity will appear after this fresher logs in with the
                activity tracker enabled.
              </p>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
            Professional Experience
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Employment & Internships
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Full-time roles, internships, apprenticeships, freelance work and
            other professional experience added by the candidate.
          </p>

          {employment.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-sm font-medium text-slate-700">
                No experience added.
              </p>

              <p className="mt-2 text-xs text-slate-500">
                This is normal for many freshers.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {employment.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-950">
                          {item.role_title}
                        </h3>

                        <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          {employmentTypeLabel(item.employment_type)}
                        </span>

                        {item.is_current && (
                          <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                            Current
                          </span>
                        )}
                      </div>

                      <p className="mt-1 font-semibold text-slate-700">
                        {item.company_name}
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        {formatMonthYear(item.start_date)} —{" "}
                        {item.is_current
                          ? "Present"
                          : formatMonthYear(item.end_date)}
                        {item.location ? ` • ${item.location}` : ""}
                        {item.work_mode
                          ? ` • ${
                              item.work_mode.charAt(0).toUpperCase() +
                              item.work_mode.slice(1)
                            }`
                          : ""}
                      </p>

                      {item.description && (
                        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                          {item.description}
                        </p>
                      )}

                      {item.skills_used && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {item.skills_used
                            .split(",")
                            .map((skill) => skill.trim())
                            .filter(Boolean)
                            .map((skill) => (
                              <span
                                key={skill}
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600"
                              >
                                {skill}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
            Academic Background
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Education
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            School, college, degree, diploma and higher-education details added
            by the candidate.
          </p>

          {education.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-sm font-medium text-slate-700">
                No detailed education history added yet.
              </p>

              <p className="mt-2 text-xs text-slate-500">
                Basic qualification information may still appear at the top of
                the profile.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {education.map((item) => {
                const score = scoreLabel(item);

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-950">
                            {item.degree_or_course ||
                              educationLevelLabel(item.education_level)}
                          </h3>

                          <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            {educationLevelLabel(item.education_level)}
                          </span>

                          {item.is_current && (
                            <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                              Current
                            </span>
                          )}
                        </div>

                        <p className="mt-1 font-semibold text-slate-700">
                          {item.institution_name}
                        </p>

                        {item.board_or_university && (
                          <p className="mt-1 text-sm text-slate-500">
                            {item.board_or_university}
                          </p>
                        )}

                        <p className="mt-2 text-sm text-slate-500">
                          {item.start_year ? `${item.start_year} — ` : ""}
                          {item.is_current
                            ? "Present"
                            : item.end_year || ""}
                          {item.location ? ` • ${item.location}` : ""}
                          {score ? ` • ${score}` : ""}
                        </p>

                        {item.specialization && (
                          <p className="mt-2 text-xs font-medium text-slate-600">
                            Specialization: {item.specialization}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

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
                Resume is available to logged-in company accounts.
                Shortlisting or a paid recruiter plan is not required.
              </p>
            </div>

            {!profile.has_resume ? (
              <span className="w-fit rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500">
                No resume uploaded
              </span>
            ) : (
              <ResumeButton
                signedUrl={resumeSignedUrl}
                loading={resumeLoading}
                label="📄 Open Resume ↗"
                primary
              />
            )}
          </div>

          {profile.has_resume &&
            resumeSignedUrl && (
              <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-semibold text-green-800">
                  ✓ Resume available
                </p>

                <p className="mt-1 text-xs text-slate-600">
                  This secure resume link is temporary and expires automatically.
                </p>
              </div>
            )}

          {profile.has_resume &&
            !resumeSignedUrl &&
            !resumeLoading && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-800">
                  Resume temporarily unavailable
                </p>

                <p className="mt-1 text-xs text-slate-600">
                  A secure resume link could not be generated. Make sure the
                  resumes bucket policy allows authenticated company accounts
                  to read resume objects.
                </p>

                <button
                  onClick={createCandidateResumeSignedUrl}
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

          <p className="mt-2 text-sm text-slate-500">
            Technical, business and role-specific skills added by the candidate.
          </p>

          {skills.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">
              Candidate has not added any skills yet.
            </p>
          ) : (
            <div className="mt-6 flex flex-wrap gap-3">
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <span className="font-semibold text-slate-900">
                    {skill.skill_name}
                  </span>

                  <p className="mt-1 text-xs text-slate-500">
                    {skill.skill_level}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
            Verified Evidence
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                Verified Skills & Assessments
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Best recorded result for each role-relevant assessment is shown.
              </p>
            </div>

            {bestAssessments.length > 0 && (
              <span className="w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                {verifiedAssessmentCount} verified / {bestAssessments.length} attempted
              </span>
            )}
          </div>

          {bestAssessments.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-sm font-medium text-slate-700">
                No assessment results yet.
              </p>

              <p className="mt-2 text-xs text-slate-500">
                This candidate has not completed a FresherHire assessment yet.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {bestAssessments.map((assessment) => (
                <div
                  key={assessment.skill_name}
                  className={`rounded-xl border p-5 ${
                    assessment.percentage >= 75
                      ? "border-green-200 bg-green-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-950">
                        {assessment.skill_name}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Best recorded result • {assessment.score}/
                        {assessment.total_questions} correct
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${getScoreStyle(
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

                  {assessment.percentage >= 75 ? (
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-green-700">
                        ✓ Verified Assessment
                      </p>

                      <p className="text-xs text-slate-500">
                        Passed 75% threshold
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-slate-600">
                        Attempted
                      </p>

                      <p className="text-xs text-slate-500">
                        Verification requires 75%
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
            Proof of Work
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Projects & Work Samples
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Projects, case studies and practical work can demonstrate ability
            beyond a resume.
          </p>

          {projects.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <div className="text-3xl">
                📁
              </div>

              <p className="mt-4 text-sm text-slate-500">
                Candidate hasn&apos;t added any projects or work samples yet.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {projects.map((project) => {
                const technologies =
                  parseTechnologies(
                    project.technologies
                  );

                return (
                  <div
                    key={project.id}
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
                              key={technology}
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
                            href={project.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                          >
                            Source / Portfolio ↗
                          </a>
                        )}

                        {project.live_url && (
                          <a
                            href={project.live_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-xl bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                          >
                            View Work ↗
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:p-7">
          <h2 className="text-xl font-bold text-slate-950">
            Interested in this candidate?
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Resume access is available to logged-in company accounts. Private
            email and phone access still follow your current recruiter access
            rules.
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
            ) : contactAccessReason ===
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
            )}

            {profile.has_resume && (
              <ResumeButton
                signedUrl={resumeSignedUrl}
                loading={resumeLoading}
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
                Contact access is enabled, but this candidate has not provided
                contact details yet.
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
                  Your current {subscriptionPlan} plan does not include private
                  email or phone access. Resume viewing is available separately.
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
                Resume viewing is available now. Private email and phone access
                remain subject to your existing contact-access rules.
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
      href={signedUrl}
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

function ActivityCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-base font-bold text-slate-950">
        {value}
      </p>
    </div>
  );
}
