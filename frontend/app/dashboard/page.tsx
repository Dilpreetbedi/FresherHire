"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { requireFresher } from "../lib/auth";
import { useRouter } from "next/navigation";
import NotificationBell from "../components/NotificationBell";

type Profile = {
  full_name: string;
  email: string;
  phone_number: string | null;
  degree: string;
  graduation_year: number;
  location: string;
  preferred_role: string;
  resume_url: string | null;
};

type Skill = {
  id: number;
  skill_name: string;
  skill_level: string;
};

type AssessmentResult = {
  id: number;
  skill_name: string;
  score: number;
  total_questions: number;
  percentage: number;
};

type Project = {
  id: number;
};

export default function Dashboard() {
  const router = useRouter();

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [skills, setSkills] =
    useState<Skill[]>([]);

  const [assessments, setAssessments] =
    useState<AssessmentResult[]>([]);

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [phoneNumber, setPhoneNumber] =
    useState("");

  const [phoneSaving, setPhoneSaving] =
    useState(false);

  const [phoneMessage, setPhoneMessage] =
    useState("");

  const [resumeUploading, setResumeUploading] =
    useState(false);

  const [resumeMessage, setResumeMessage] =
    useState("");

  const [resumeSignedUrl, setResumeSignedUrl] =
    useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  function getResumeStoragePath(
    resumeValue: string | null,
    userId: string
  ) {
    if (!resumeValue) {
      return null;
    }

    if (!resumeValue.startsWith("http")) {
      return resumeValue;
    }

    const marker = "/resumes/";
    const markerIndex =
      resumeValue.indexOf(marker);

    if (markerIndex !== -1) {
      const path = resumeValue.slice(
        markerIndex + marker.length
      );

      try {
        return decodeURIComponent(path);
      } catch {
        return path;
      }
    }

    return `${userId}/resume.pdf`;
  }

  async function createResumeSignedUrl(
    resumeValue: string | null,
    userId: string
  ) {
    const filePath =
      getResumeStoragePath(
        resumeValue,
        userId
      );

    if (!filePath) {
      setResumeSignedUrl(null);
      return;
    }

    const {
      data,
      error,
    } = await supabase.storage
      .from("resumes")
      .createSignedUrl(
        filePath,
        60 * 10
      );

    if (error) {
      console.error(
        "Resume signed URL error:",
        error
      );

      setResumeSignedUrl(null);
      return;
    }

    setResumeSignedUrl(
      data.signedUrl
    );
  }

  async function loadDashboard() {
    setLoading(true);

    try {
      const auth =
        await requireFresher();

      if (!auth.allowed) {
        router.replace(
          auth.redirectTo!
        );
        return;
      }

      const user =
        auth.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error(
          "Profile error:",
          profileError
        );

        setLoading(false);
        return;
      }

      if (!profileData) {
        router.replace("/login");
        setLoading(false);
        return;
      }

      const [
        skillsResult,
        assessmentResult,
        projectsResult,
      ] = await Promise.all([
        supabase
          .from("skills")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("assessment_results")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("projects")
          .select("id")
          .eq("user_id", user.id),
      ]);

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

      if (projectsResult.error) {
        console.error(
          "Projects error:",
          projectsResult.error
        );
      }

      setProfile(profileData);
      setPhoneNumber(
        profileData.phone_number || ""
      );

      await createResumeSignedUrl(
        profileData.resume_url,
        user.id
      );

      setSkills(
        skillsResult.data || []
      );

      setAssessments(
        assessmentResult.data || []
      );

      setProjects(
        projectsResult.data || []
      );

      setLoading(false);
    } catch (err) {
      console.error(
        "Dashboard load error:",
        err
      );

      setLoading(false);
    }
  }

  const basicProfileComplete =
    Boolean(
      profile?.full_name &&
        profile?.email &&
        profile?.phone_number &&
        profile?.degree &&
        profile?.graduation_year &&
        profile?.location &&
        profile?.preferred_role
    );

  const hasSkills =
    skills.length > 0;

  const hasAssessment =
    assessments.length > 0;

  const hasProject =
    projects.length > 0;

  const hasResume =
    Boolean(profile?.resume_url);

  const completionItems = [
    {
      name: "Basic Profile",
      completed:
        basicProfileComplete,
      href: "#profile",
      description:
        "Complete your contact details, education, location, and preferred role.",
    },
    {
      name: "Add Skills",
      completed: hasSkills,
      href: "/skills",
      description:
        "Add at least one technical skill.",
    },
    {
      name: "Complete Assessment",
      completed:
        hasAssessment,
      href: "/assessments",
      description:
        "Complete at least one skill assessment.",
    },
    {
      name: "Add Project",
      completed:
        hasProject,
      href: "/projects",
      description:
        "Show companies something you have built.",
    },
    {
      name: "Upload Resume",
      completed:
        hasResume,
      href: "#resume",
      description:
        "Upload your latest resume as a PDF.",
    },
  ];

  const completedItems =
    completionItems.filter(
      (item) =>
        item.completed
    ).length;

  const profileStrength =
    Math.round(
      (completedItems /
        completionItems.length) *
        100
    );

  function getProfileStrengthText() {
    if (
      profileStrength === 100
    ) {
      return "Excellent";
    }

    if (
      profileStrength >= 80
    ) {
      return "Strong";
    }

    if (
      profileStrength >= 60
    ) {
      return "Good";
    }

    if (
      profileStrength >= 40
    ) {
      return "Getting There";
    }

    return "Getting Started";
  }

  async function savePhoneNumber() {
    if (phoneSaving) {
      return;
    }

    const normalizedPhone =
      phoneNumber.trim();

    if (!normalizedPhone) {
      setPhoneMessage(
        "Please enter your phone number."
      );
      return;
    }

    if (
      !/^\+?[0-9\s()-]{7,20}$/.test(
        normalizedPhone
      )
    ) {
      setPhoneMessage(
        "Please enter a valid phone number."
      );
      return;
    }

    setPhoneSaving(true);
    setPhoneMessage("");

    try {
      const auth =
        await requireFresher();

      if (!auth.allowed) {
        setPhoneSaving(false);

        router.replace(
          auth.redirectTo!
        );
        return;
      }

      const user = auth.user;

      if (!user) {
        setPhoneSaving(false);
        router.replace("/login");
        return;
      }

      const {
        error: updateError,
      } = await supabase
        .from("profiles")
        .update({
          phone_number:
            normalizedPhone,
        })
        .eq("id", user.id);

      if (updateError) {
        console.error(
          "Phone update error:",
          updateError
        );

        setPhoneMessage(
          updateError.message ||
            "Could not save phone number."
        );

        setPhoneSaving(false);
        return;
      }

      setProfile((current) =>
        current
          ? {
              ...current,
              phone_number:
                normalizedPhone,
            }
          : current
      );

      setPhoneNumber(
        normalizedPhone
      );

      setPhoneMessage(
        "Phone number saved successfully."
      );
    } catch (err) {
      console.error(
        "Phone save error:",
        err
      );

      setPhoneMessage(
        err instanceof Error
          ? err.message
          : "Could not save phone number."
      );
    }

    setPhoneSaving(false);
  }

  async function uploadResume(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setResumeMessage("");

    if (
      file.type !==
      "application/pdf"
    ) {
      setResumeMessage(
        "Please upload a PDF file."
      );

      event.target.value = "";

      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setResumeMessage(
        "Resume must be smaller than 5 MB."
      );

      event.target.value = "";

      return;
    }

    setResumeUploading(true);

    const auth =
      await requireFresher();

    if (!auth.allowed) {
      setResumeUploading(false);

      router.replace(
        auth.redirectTo!
      );

      return;
    }

    const user =
      auth.user;

    if (!user) {
      setResumeMessage(
        "Please log in before uploading your resume."
      );

      setResumeUploading(false);

      router.replace("/login");

      return;
    }

    const filePath =
      `${user.id}/resume.pdf`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from("resumes")
      .upload(
        filePath,
        file,
        {
          cacheControl: "3600",
          upsert: true,
          contentType:
            "application/pdf",
        }
      );

    if (uploadError) {
      console.error(
        "Resume upload error:",
        uploadError
      );

      setResumeMessage(
        uploadError.message
      );

      setResumeUploading(false);

      return;
    }

    const {
      error: updateError,
    } = await supabase
      .from("profiles")
      .update({
        resume_url: filePath,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error(
        "Profile update error:",
        updateError
      );

      setResumeMessage(
        updateError.message
      );

      setResumeUploading(false);

      return;
    }

    setProfile((current) =>
      current
        ? {
            ...current,
            resume_url:
              filePath,
          }
        : current
    );

    await createResumeSignedUrl(
      filePath,
      user.id
    );

    setResumeMessage(
      "Resume uploaded successfully."
    );

    setResumeUploading(false);

    event.target.value = "";
  }

  async function logout() {
    await supabase.auth.signOut();

    router.push("/");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <div className="text-center">
          <p className="font-semibold">
            Loading dashboard...
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Preparing your profile
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
            href="/"
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
              href="/applications"
              className="hidden text-sm font-medium text-slate-600 hover:text-slate-950 sm:block"
            >
              My Applications
            </Link>

            <NotificationBell />

            <button
              onClick={logout}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Sign Out
            </button>

          </div>

        </div>

      </nav>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              Fresher Dashboard
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Welcome,{" "}
              {profile?.full_name ||
                "Candidate"}{" "}
              👋
            </h1>

            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              Build your profile, verify your skills, showcase your work and discover entry-level opportunities.
            </p>

          </div>

          <Link
            href="/jobs"
            className="w-fit rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Browse Jobs →
          </Link>

        </div>

        <section className="mt-8 overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-sm">

          <div className="grid lg:grid-cols-3">

            <div className="border-b border-slate-200 bg-blue-50/70 p-6 sm:p-7 lg:border-b-0 lg:border-r">

              <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
                Profile Strength
              </p>

              <div className="mt-5 flex items-end gap-3">

                <span className="text-5xl font-bold text-slate-950">
                  {profileStrength}%
                </span>

                <span className="mb-1 text-sm font-semibold text-blue-700">
                  {getProfileStrengthText()}
                </span>

              </div>

              <div className="mt-6 h-3 overflow-hidden rounded-full bg-blue-100">

                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-500"
                  style={{
                    width: `${profileStrength}%`,
                  }}
                />

              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">
                {profileStrength ===
                100
                  ? "Your profile is complete and ready to be reviewed by recruiters."
                  : `${completedItems} of ${completionItems.length} profile steps completed.`}
              </p>

            </div>

            <div className="p-6 sm:p-7 lg:col-span-2">

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <h2 className="text-xl font-bold text-slate-950">
                    Complete Your Profile
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Give recruiters more evidence to evaluate your profile.
                  </p>

                </div>

                <span className="w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  {completedItems}/
                  {completionItems.length} complete
                </span>

              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">

                {completionItems.map(
                  (item) => (

                    <Link
                      key={item.name}
                      href={item.href}
                      className={`rounded-xl border p-4 transition ${
                        item.completed
                          ? "border-green-200 bg-green-50"
                          : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/30"
                      }`}
                    >

                      <div className="flex items-start gap-3">

                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            item.completed
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {item.completed
                            ? "✓"
                            : "○"}
                        </div>

                        <div>

                          <p
                            className={`text-sm font-semibold ${
                              item.completed
                                ? "text-green-800"
                                : "text-slate-900"
                            }`}
                          >
                            {item.name}
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {item.description}
                          </p>

                        </div>

                      </div>

                    </Link>

                  )
                )}

              </div>

            </div>

          </div>

        </section>

        <div
          id="profile"
          className="mt-6 grid gap-6 md:grid-cols-3"
        >

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="text-xl font-semibold text-slate-950">
                  Your Profile
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your phone number stays private and is shared only with eligible recruiters.
                </p>
              </div>

            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">

              <Info
                label="Name"
                value={
                  profile?.full_name
                }
              />

              <Info
                label="Email"
                value={
                  profile?.email
                }
              />

              <div className="sm:col-span-2">

                <label
                  htmlFor="phone-number"
                  className="text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Phone Number
                </label>

                <div className="mt-2 flex flex-col gap-3 sm:flex-row">

                  <input
                    id="phone-number"
                    type="tel"
                    value={phoneNumber}
                    onChange={(event) => {
                      setPhoneNumber(
                        event.target.value
                      );
                      setPhoneMessage("");
                    }}
                    placeholder="+91 98765 43210"
                    autoComplete="tel"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    onClick={
                      savePhoneNumber
                    }
                    disabled={
                      phoneSaving
                    }
                    className="shrink-0 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {phoneSaving
                      ? "Saving..."
                      : profile?.phone_number
                      ? "Update Phone"
                      : "Save Phone"}
                  </button>

                </div>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Include your country code, for example +91 for India.
                </p>

                {phoneMessage && (
                  <p
                    className={`mt-2 text-xs font-medium ${
                      phoneMessage.includes(
                        "successfully"
                      )
                        ? "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    {phoneMessage}
                  </p>
                )}

              </div>

              <Info
                label="Degree"
                value={
                  profile?.degree
                }
              />

              <Info
                label="Graduation"
                value={String(
                  profile?.graduation_year ||
                    ""
                )}
              />

              <Info
                label="Location"
                value={
                  profile?.location
                }
              />

              <Info
                label="Preferred Role"
                value={
                  profile?.preferred_role
                }
              />

            </div>

          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">

            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              Profile Status
            </p>

            <h2 className="mt-4 text-2xl font-bold text-slate-950">
              {profileStrength ===
              100
                ? "Profile Complete"
                : profileStrength >=
                  60
                ? "Profile Active"
                : "Getting Started"}
            </h2>

            <p className="mt-4 text-sm leading-6 text-slate-600">

              {profileStrength ===
              100
                ? "Your profile has the key information recruiters need."
                : `${100 - profileStrength}% remaining to complete your profile.`}

            </p>

            <Link
              href="/skills"
              className="mt-6 block w-full rounded-xl bg-blue-600 px-5 py-3 text-center font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Improve Profile →
            </Link>

          </div>

        </div>

        <section
          id="resume"
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >

          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

            <div>

              <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
                Resume
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                Your Resume
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                Upload your latest resume so eligible hiring companies can review it alongside your skills, assessments and projects.
              </p>

              <p className="mt-1 text-xs text-slate-400">
                PDF only • Maximum 5 MB
              </p>

            </div>

            {resumeSignedUrl && (

              <a
                href={
                  resumeSignedUrl
                }
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                View Resume ↗
              </a>

            )}

          </div>

          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 sm:p-6">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-xl">
                  📄
                </div>

                <div>

                  <p className="font-semibold text-slate-900">

                    {profile?.resume_url
                      ? "Resume uploaded"
                      : "Add your resume"}

                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">

                    {profile?.resume_url
                      ? "You can replace it anytime with a newer version."
                      : "Your resume remains private and is shared only when recruiter access is allowed."}

                  </p>

                </div>

              </div>

              <label
                className={`w-fit rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm ${
                  resumeUploading
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer hover:bg-blue-700"
                }`}
              >

                {resumeUploading
                  ? "Uploading..."
                  : profile?.resume_url
                  ? "Replace Resume"
                  : "Upload Resume"}

                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={
                    uploadResume
                  }
                  disabled={
                    resumeUploading
                  }
                  className="hidden"
                />

              </label>

            </div>

          </div>

          {resumeMessage && (

            <div
              className={`mt-4 rounded-xl border p-4 text-sm ${
                resumeMessage.includes(
                  "successfully"
                )
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {resumeMessage}
            </div>

          )}

          {profile?.resume_url && (

            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-green-700">

              <span>
                ✓
              </span>

              <span>
                Resume uploaded successfully.
              </span>

            </div>

          )}

        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

            <div>

              <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
                Verification
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                Verified Skills
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                Skills backed by practical assessment results.
              </p>

            </div>

            <Link
              href="/assessments"
              className="w-fit rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Take Assessment →
            </Link>

          </div>

          {assessments.length ===
          0 ? (

            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">

              <p className="font-medium text-slate-900">
                No verified skills yet
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Complete an assessment to verify your skills.
              </p>

            </div>

          ) : (

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {assessments.map(
                (assessment) => (

                  <div
                    key={
                      assessment.id
                    }
                    className={`rounded-xl border p-5 ${
                      assessment.percentage >=
                      75
                        ? "border-green-200 bg-green-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >

                    <div className="flex items-center justify-between gap-3">

                      <h3 className="font-semibold text-slate-900">
                        {assessment.skill_name}
                      </h3>

                      {assessment.percentage >=
                        75 && (
                        <span className="text-sm font-medium text-green-700">
                          ✓ Verified
                        </span>
                      )}

                    </div>

                    <div className="mt-5">

                      <div className="flex items-end justify-between">

                        <span className="text-3xl font-bold text-slate-950">
                          {assessment.percentage}%
                        </span>

                        <span className="text-xs text-slate-500">
                          {assessment.score}/
                          {assessment.total_questions}
                        </span>

                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">

                        <div
                          className={`h-full rounded-full ${
                            assessment.percentage >=
                            75
                              ? "bg-green-600"
                              : "bg-blue-600"
                          }`}
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

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between gap-4">

            <div>

              <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
                Skills
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                Your Skills
              </h2>

            </div>

            <Link
              href="/skills"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              + Add Skill
            </Link>

          </div>

          {skills.length ===
          0 ? (

            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">

              <p className="font-medium text-slate-900">
                No skills added yet
              </p>

              <Link
                href="/skills"
                className="mt-3 inline-block text-sm font-semibold text-blue-600"
              >
                Add your first skill →
              </Link>

            </div>

          ) : (

            <div className="mt-6 flex flex-wrap gap-3">

              {skills.map(
                (skill) => (

                  <div
                    key={skill.id}
                    className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2"
                  >

                    <span className="text-sm font-medium text-slate-800">
                      {skill.skill_name}
                    </span>

                    <span className="ml-2 text-xs text-slate-500">
                      {skill.skill_level}
                    </span>

                  </div>

                )
              )}

            </div>

          )}

        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between gap-4">

            <div>

              <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
                Portfolio
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                Your Projects
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {projects.length} project
                {projects.length !==
                1
                  ? "s"
                  : ""}{" "}
                added
              </p>

            </div>

            <Link
              href="/projects"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              + Add Project
            </Link>

          </div>

          <div className="mt-6">

            <Link
              href="/projects"
              className="inline-block rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Manage Projects →
            </Link>

          </div>

        </section>

        <section className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-6">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
                Opportunities
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                Find jobs matched to your skills
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                FresherHire compares your profile and verified skills against job requirements.
              </p>

            </div>

            <div className="flex flex-wrap gap-3">

              <Link
                href="/jobs"
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Browse Jobs →
              </Link>

              <Link
                href="/applications"
                className="rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-blue-50"
              >
                My Applications
              </Link>

            </div>

          </div>

        </section>

        <section className="mt-6 grid gap-6 md:grid-cols-3">

          <DashboardCard
            title="Add Skills"
            description="Tell companies what technologies you know."
            href="/skills"
          />

          <DashboardCard
            title="Add Projects"
            description="Showcase projects you have actually built."
            href="/projects"
          />

          <DashboardCard
            title="Take Assessments"
            description="Prove your skills through practical assessments."
            href="/assessments"
          />

        </section>

      </section>

    </main>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div>

      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-slate-800">
        {value ||
          "Not provided"}
      </p>

    </div>
  );
}

function DashboardCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">

      <h3 className="text-lg font-semibold text-slate-950">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        {description}
      </p>

      <Link
        href={href}
        className="mt-5 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
      >
        Get Started →
      </Link>

    </div>
  );
}
