"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type SkillItem = {
  id: number;
  skill_name: string;
  skill_level: string;
};

type AssessmentItem = {
  id: number;
  skill_name: string;
  score: number;
  total_questions: number;
  percentage: number;
  created_at?: string | null;
};

type Candidate = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  headline: string | null;
  location: string | null;
  graduation_year: number | null;
  degree: string | null;
  bio: string | null;
  resume_url: string | null;
  profile_completion: number;
  skill_items?: SkillItem[];
  best_assessment_items?: AssessmentItem[];
  project_items?: { id: number; title: string }[];
  education_items?: { id: number }[];
  experience_items?: { id: number }[];
  internship_items?: { id: number }[];
};

type ApplicationStatus =
  | "applied"
  | "shortlisted"
  | "interview"
  | "hired"
  | "rejected"
  | "withdrawn";

type Application = {
  id: number;
  status: ApplicationStatus;
  cover_letter: string | null;
  applied_at: string | null;
  job: {
    id: number;
    title: string;
    location: string;
    employment_type: string;
    workplace_type: string;
    job_status: "published" | "closed";
    company: {
      id: string;
      name: string;
      is_verified: boolean;
    };
  };
};

type Notification = {
  id: number;
  application_id: number | null;
  job_id: number | null;
  notification_type:
    | "applied"
    | "shortlisted"
    | "interview"
    | "hired"
    | "rejected";
  title: string;
  message: string;
  is_read: boolean;
  created_at: string | null;
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

export default function CandidateDashboardPage() {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const meResponse = await fetch(`${apiUrl}/api/candidate/me`, {
          credentials: "include",
          cache: "no-store",
        });

        if (meResponse.status === 401) {
          router.replace("/login");
          return;
        }

        const meData = await meResponse.json();

        if (!meResponse.ok) {
          throw new Error(meData.detail || "Unable to load your dashboard.");
        }

        setCandidate(meData);

        const [applicationsResponse, notificationResponse, unreadResponse] =
          await Promise.all([
            fetch(`${apiUrl}/api/candidate/applications`, {
              credentials: "include",
              cache: "no-store",
            }),
            fetch(`${apiUrl}/api/candidate/notifications`, {
              credentials: "include",
              cache: "no-store",
            }),
            fetch(`${apiUrl}/api/candidate/notifications/unread-count`, {
              credentials: "include",
              cache: "no-store",
            }),
          ]);

        if (applicationsResponse.ok) {
          setApplications(await applicationsResponse.json());
        }

        if (notificationResponse.ok) {
          setNotifications(await notificationResponse.json());
        }

        if (unreadResponse.ok) {
          const unreadData = await unreadResponse.json();
          setUnreadCount(unreadData.unread_count || 0);
        }
      } catch (err) {
        console.error("Candidate dashboard error:", err);
        setError(
          err instanceof Error ? err.message : "Unable to load your dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [apiUrl, router]);

  const stats = useMemo(() => {
    const activeApplications = applications.filter((application) =>
      ["applied", "shortlisted", "interview"].includes(application.status)
    ).length;

    return {
      total: applications.filter((application) => application.status !== "withdrawn")
        .length,
      active: activeApplications,
      shortlisted: applications.filter(
        (application) => application.status === "shortlisted"
      ).length,
      interview: applications.filter(
        (application) => application.status === "interview"
      ).length,
      hired: applications.filter((application) => application.status === "hired")
        .length,
    };
  }, [applications]);

  const bestAssessments = candidate?.best_assessment_items || [];
  const verifiedAssessments = bestAssessments.filter(
    (assessment) => assessment.percentage >= 75
  );
  const skills = candidate?.skill_items || [];
  const projects = candidate?.project_items || [];

  const missions = useMemo(() => {
    if (!candidate) return [];

    return [
      {
        label: "Build a 70%+ profile",
        complete: candidate.profile_completion >= 70,
        href: "/candidate/profile",
      },
      {
        label: "Add at least 3 skills",
        complete: (candidate.skill_items?.length || 0) >= 3,
        href: "/candidate/profile",
      },
      {
        label: "Verify one skill",
        complete: (candidate.best_assessment_items || []).some(
          (assessment) => assessment.percentage >= 75
        ),
        href: "/assessments",
      },
      {
        label: "Add a project",
        complete: (candidate.project_items?.length || 0) > 0,
        href: "/candidate/profile",
      },
      {
        label: "Upload your resume",
        complete: Boolean(candidate.resume_url),
        href: "/candidate/profile",
      },
      {
        label: "Apply to your first role",
        complete: applications.length > 0,
        href: "/jobs",
      },
    ];
  }, [candidate, applications.length]);

  const completedMissions = missions.filter((mission) => mission.complete).length;
  const missionProgress = missions.length
    ? Math.round((completedMissions / missions.length) * 100)
    : 0;

  const nextAction = useMemo(() => {
    if (!candidate) {
      return {
        title: "Complete your profile",
        description: "Add the details recruiters need to understand your potential.",
        href: "/candidate/profile",
        cta: "Build Profile",
      };
    }

    if (candidate.profile_completion < 70) {
      return {
        title: "Strengthen your recruiter profile",
        description: `Your profile is ${candidate.profile_completion}% complete. Add missing details to improve recruiter context.`,
        href: "/candidate/profile",
        cta: "Improve Profile",
      };
    }

    if (verifiedAssessments.length === 0) {
      return {
        title: "Turn a skill into proof",
        description:
          "Complete an assessment and add verified evidence next to your skills.",
        href: "/assessments",
        cta: "Take Assessment",
      };
    }

    if (applications.length === 0) {
      return {
        title: "Your profile is ready to move",
        description:
          "Start applying to fresher-friendly roles and begin your hiring journey.",
        href: "/jobs",
        cta: "Explore Jobs",
      };
    }

    if (stats.interview > 0) {
      return {
        title: "You have an interview-stage application",
        description:
          "Review your applications and keep your profile and resume up to date.",
        href: "/candidate/applications",
        cta: "View Applications",
      };
    }

    return {
      title: "Keep your momentum going",
      description:
        "Explore more relevant openings while your existing applications move forward.",
      href: "/jobs",
      cta: "Find More Roles",
    };
  }, [applications.length, candidate, stats.interview, verifiedAssessments.length]);

  const recentApplications = applications.slice(0, 3);
  const recentNotifications = notifications.slice(0, 3);

  async function logout() {
    try {
      await fetch(`${apiUrl}/api/candidate/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f8fc]">
        <div className="text-center">
          <div className="relative mx-auto h-16 w-16">
            <div className="absolute inset-0 animate-ping rounded-3xl bg-blue-200/50" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 text-xl font-black text-white shadow-xl">
              F
            </div>
          </div>
          <p className="mt-5 text-sm font-semibold text-slate-600">
            Building your career dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-slate-900">
      <nav className="sticky top-0 z-50 border-b border-white/80 bg-white/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-xl font-black tracking-tight">
            <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-slate-950 text-sm font-black text-white shadow-lg shadow-blue-200">
              F
              <span className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-violet-500" />
            </span>
            <span>
              Fresher<span className="text-blue-600">Hire</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/jobs"
              className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 sm:block"
            >
              Find Jobs
            </Link>

            <Link
              href="/candidate/notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              aria-label="Notifications"
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white ring-2 ring-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            <Link
              href="/candidate/profile/view"
              className="hidden rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:block"
            >
              Preview Profile
            </Link>

            <button
              type="button"
              onClick={logout}
              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden border-b border-slate-200/70 bg-white">
        <div className="absolute -left-24 -top-32 h-80 w-80 rounded-full bg-blue-100 blur-3xl" />
        <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-violet-100 blur-3xl" />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.5fr_.8fr] lg:py-12"
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.45 }}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-blue-700">
                Career Command Center
              </span>
              {candidate?.profile_completion && candidate.profile_completion >= 80 ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  Recruiter-ready ✓
                </span>
              ) : null}
            </div>

            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Hey {firstName(candidate?.full_name)}, your next opportunity starts here.
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Build proof, track your applications and keep moving toward your first great role.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={nextAction.href}
                className="group inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl"
              >
                {nextAction.cta}
                <span className="transition group-hover:translate-x-1">→</span>
              </Link>

              <Link
                href="/candidate/profile/view"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                👀 Recruiter Preview
              </Link>
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
                  Profile Power
                </p>
                <p className="mt-2 text-3xl font-black">
                  {candidate?.profile_completion || 0}%
                </p>
              </div>

              <ProgressRing value={candidate?.profile_completion || 0} />
            </div>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${candidate?.profile_completion || 0}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-blue-400 via-cyan-300 to-violet-400"
              />
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-300">
              {candidate?.profile_completion && candidate.profile_completion >= 80
                ? "Strong foundation. Keep your skills and projects fresh as you apply."
                : "Complete more profile sections so recruiters get a clearer picture of your potential."}
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <MiniMetric label="Skills" value={skills.length} />
              <MiniMetric label="Verified" value={verifiedAssessments.length} />
              <MiniMetric label="Projects" value={projects.length} />
            </div>
          </motion.div>
        </motion.div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}

        <motion.section
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
        >
          <StatCard icon="📨" label="Applications" value={stats.total} note={`${stats.active} active`} />
          <StatCard icon="⭐" label="Shortlisted" value={stats.shortlisted} note="Recruiter interest" />
          <StatCard icon="🎯" label="Interviews" value={stats.interview} note="Next-stage progress" />
          <StatCard icon="🎉" label="Offers / Hired" value={stats.hired} note="Final success" />
          <StatCard icon="🧠" label="Verified Skills" value={verifiedAssessments.length} note={`${bestAssessments.length} assessed`} />
        </motion.section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
          <div className="space-y-6">
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.12 }}
              className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"
            >
              <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-600">
                      Next Best Action
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-slate-950">
                      {nextAction.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {nextAction.description}
                    </p>
                  </div>

                  <Link
                    href={nextAction.href}
                    className="shrink-0 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-violet-700"
                  >
                    {nextAction.cta} →
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
                <QuickAction icon="🔎" title="Find Jobs" subtitle="Browse fresher roles" href="/jobs" />
                <QuickAction icon="🧠" title="Assess Skills" subtitle="Turn claims into proof" href="/assessments" />
                <QuickAction icon="📄" title="Applications" subtitle="Track every stage" href="/candidate/applications" />
                <QuickAction icon="✨" title="Upgrade Profile" subtitle="Stand out to recruiters" href="/candidate/profile" />
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.17 }}
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7"
            >
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
                    Hiring Journey
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    Your applications at a glance
                  </h2>
                </div>

                <Link href="/candidate/applications" className="text-sm font-bold text-blue-600 hover:text-blue-700">
                  View all →
                </Link>
              </div>

              {recentApplications.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                  <div className="text-4xl">🚀</div>
                  <h3 className="mt-4 text-lg font-black text-slate-950">Your first application starts the journey</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Explore entry-level roles from verified companies and start building real hiring momentum.
                  </p>
                  <Link href="/jobs" className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white">
                    Explore Jobs →
                  </Link>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {recentApplications.map((application) => (
                    <ApplicationRow key={application.id} application={application} />
                  ))}
                </div>
              )}
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.22 }}
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7"
            >
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
                    Proof of Skill
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">Your credibility layer</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Skills are stronger when recruiters can see evidence behind them.
                  </p>
                </div>
                <Link href="/assessments" className="text-sm font-bold text-emerald-700 hover:text-emerald-800">
                  Take Assessment →
                </Link>
              </div>

              {bestAssessments.length === 0 ? (
                <div className="mt-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-cyan-50 p-6">
                  <p className="text-lg font-black text-slate-950">No verified evidence yet</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Complete an assessment to turn a listed skill into recruiter-visible proof.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {bestAssessments.slice(0, 3).map((assessment) => (
                    <AssessmentCard key={assessment.id} assessment={assessment} />
                  ))}
                </div>
              )}
            </motion.section>
          </div>

          <aside className="space-y-6">
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.16 }}
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-600">Career Missions</p>
                  <h2 className="mt-2 text-xl font-black text-slate-950">Level up your profile</h2>
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                  {completedMissions}/{missions.length}
                </span>
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${missionProgress}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                />
              </div>

              <div className="mt-5 space-y-2.5">
                {missions.map((mission) => (
                  <Link
                    key={mission.label}
                    href={mission.href}
                    className={`group flex items-center gap-3 rounded-2xl border px-3.5 py-3 transition ${
                      mission.complete
                        ? "border-emerald-100 bg-emerald-50/70"
                        : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/50"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                        mission.complete
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700"
                      }`}
                    >
                      {mission.complete ? "✓" : "→"}
                    </span>
                    <span className={`text-sm font-semibold ${mission.complete ? "text-emerald-800" : "text-slate-700"}`}>
                      {mission.label}
                    </span>
                  </Link>
                ))}
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.21 }}
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-600">Live Updates</p>
                  <h2 className="mt-2 text-xl font-black text-slate-950">Notifications</h2>
                </div>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-rose-500 px-2.5 py-1 text-xs font-black text-white">
                    {unreadCount} new
                  </span>
                )}
              </div>

              {recentNotifications.length === 0 ? (
                <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-center">
                  <div className="text-3xl">🔔</div>
                  <p className="mt-3 text-sm font-bold text-slate-700">No updates yet</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Recruiter activity will appear here.</p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {recentNotifications.map((notification) => (
                    <NotificationRow key={notification.id} notification={notification} />
                  ))}
                </div>
              )}

              <Link
                href="/candidate/notifications"
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                View all notifications
              </Link>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.26 }}
              className="overflow-hidden rounded-[28px] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-6 text-white shadow-xl shadow-blue-200"
            >
              <div className="text-3xl">💡</div>
              <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-blue-100">Fresher Tip</p>
              <h2 className="mt-2 text-xl font-black">Evidence beats adjectives.</h2>
              <p className="mt-2 text-sm leading-6 text-blue-100">
                Instead of only saying “good at Python”, show a project, assessment result or internship where you used it.
              </p>
              <Link href="/candidate/profile" className="mt-5 inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-black text-blue-700">
                Add Proof →
              </Link>
            </motion.section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function ProgressRing({ value }: { value: number }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (Math.min(Math.max(value, 0), 100) / 100) * circumference;

  return (
    <div className="relative h-20 w-20">
      <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="7" />
        <motion.circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="white"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: progress }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-white">
        {value}%
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-center">
      <p className="text-lg font-black">{value}</p>
      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  note,
}: {
  icon: string;
  label: string;
  value: number;
  note: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -4 }}
      className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
          <p className="mt-1 text-xs text-slate-400">{note}</p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-xl">{icon}</span>
      </div>
    </motion.div>
  );
}

function QuickAction({
  icon,
  title,
  subtitle,
  href,
}: {
  icon: string;
  title: string;
  subtitle: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50 hover:shadow-md"
    >
      <div className="text-2xl">{icon}</div>
      <p className="mt-3 text-sm font-black text-slate-900">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>
      <span className="mt-3 inline-block text-xs font-black text-blue-600 transition group-hover:translate-x-1">Open →</span>
    </Link>
  );
}

function ApplicationRow({ application }: { application: Application }) {
  const appearance = getApplicationStatusAppearance(application.status);

  return (
    <Link
      href="/candidate/applications"
      className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-lg font-black text-slate-700">
          {application.job.company.name?.charAt(0)?.toUpperCase() || "C"}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-black text-slate-950">{application.job.title}</p>
            {application.job.company.is_verified && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-700">✓ Verified</span>
            )}
          </div>
          <p className="mt-1 truncate text-sm text-slate-500">{application.job.company.name}</p>
          <p className="mt-1 text-xs text-slate-400">{application.job.location} • {formatDate(application.applied_at)}</p>
        </div>
      </div>

      <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-black ${appearance.className}`}>
        {appearance.label}
      </span>
    </Link>
  );
}

function AssessmentCard({ assessment }: { assessment: AssessmentItem }) {
  const verified = assessment.percentage >= 75;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className={`rounded-2xl border p-5 ${
        verified ? "border-emerald-200 bg-emerald-50/70" : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-slate-950">{assessment.skill_name}</p>
          <p className="mt-1 text-xs text-slate-500">Best assessment result</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${verified ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600"}`}>
          {verified ? "✓ Verified" : "Attempted"}
        </span>
      </div>

      <div className="mt-5 flex items-end justify-between">
        <p className="text-3xl font-black text-slate-950">{assessment.percentage}%</p>
        <p className="text-xs font-semibold text-slate-500">{assessment.score}/{assessment.total_questions}</p>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(assessment.percentage, 100)}%` }}
          transition={{ duration: 0.7 }}
          className={`h-full rounded-full ${verified ? "bg-emerald-500" : "bg-blue-500"}`}
        />
      </div>
    </motion.div>
  );
}

function NotificationRow({ notification }: { notification: Notification }) {
  const icon =
    notification.notification_type === "hired"
      ? "🎉"
      : notification.notification_type === "interview"
      ? "🎯"
      : notification.notification_type === "shortlisted"
      ? "⭐"
      : notification.notification_type === "rejected"
      ? "📄"
      : "🔔";

  return (
    <Link
      href="/candidate/notifications"
      className={`flex gap-3 rounded-2xl border p-3.5 transition hover:-translate-y-0.5 hover:shadow-sm ${
        notification.is_read
          ? "border-slate-200 bg-white"
          : "border-blue-200 bg-blue-50/60"
      }`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-base shadow-sm">{icon}</div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-black text-slate-900">{notification.title}</p>
          {!notification.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />}
        </div>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{notification.message}</p>
      </div>
    </Link>
  );
}

function getApplicationStatusAppearance(status: ApplicationStatus) {
  switch (status) {
    case "shortlisted":
      return { label: "Shortlisted", className: "bg-blue-100 text-blue-700" };
    case "interview":
      return { label: "Interview", className: "bg-violet-100 text-violet-700" };
    case "hired":
      return { label: "Hired", className: "bg-emerald-100 text-emerald-700" };
    case "rejected":
      return { label: "Rejected", className: "bg-rose-100 text-rose-700" };
    case "withdrawn":
      return { label: "Withdrawn", className: "bg-slate-100 text-slate-600" };
    default:
      return { label: "Applied", className: "bg-amber-100 text-amber-700" };
  }
}

function firstName(name?: string | null) {
  if (!name?.trim()) return "there";
  return name.trim().split(/\s+/)[0];
}

function formatDate(value: string | null) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
