"use client";

import Link from "next/link";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type Skill = { id: number; skill_name: string; skill_level: string };
type Assessment = {
  id: number;
  user_id: string;
  skill_name: string;
  score: number;
  total_questions: number;
  percentage: number;
  created_at?: string | null;
};
type Education = {
  id: number;
  education_level: string;
  institution_name: string;
  board_or_university: string | null;
  degree_or_course: string | null;
  specialization: string | null;
  start_year: number | null;
  end_year: number | null;
  score_type: string | null;
  score_value: number | null;
  location: string | null;
  is_current: boolean;
};
type Employment = {
  id: number;
  employment_type: string;
  company_name: string;
  role_title: string;
  location: string | null;
  work_mode: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  skills_used: string | null;
};
type Project = {
  id: number;
  title: string;
  description: string | null;
  technologies: string | null;
  github_url: string | null;
  live_url: string | null;
};
type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  headline: string | null;
  location: string | null;
  graduation_year: number | null;
  degree: string | null;
  bio: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  resume_url: string | null;
  profile_completion: number;
  skill_items: Skill[];
  assessment_items: Assessment[];
  best_assessment_items: Assessment[];
  education_items: Education[];
  experience_items: Employment[];
  internship_items: Employment[];
  project_items: Project[];
};

export default function CandidateProfileViewPage() {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch(`${apiUrl}/api/candidate/profile/full`, {
          credentials: "include",
          cache: "no-store",
        });
        if (response.status === 401) {
          router.replace("/login");
          return;
        }
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Unable to load profile.");
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load profile.");
      } finally {
        setLoading(false);
      }
    }
    void loadProfile();
  }, [apiUrl, router]);

  const initials = useMemo(() => {
    return (profile?.full_name || "FH")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [profile]);

  const verifiedAssessments = useMemo(
    () => (profile?.best_assessment_items || []).filter((item) => item.percentage >= 75),
    [profile]
  );

  const evidenceCount = useMemo(() => {
    if (!profile) return 0;
    return profile.skill_items.length + profile.project_items.length + verifiedAssessments.length;
  }, [profile, verifiedAssessments]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
          <p className="mt-4 text-sm text-slate-500">Loading your profile...</p>
        </div>
      </main>
    );
  }

  if (!profile || error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-3xl border border-red-200 bg-white p-7 text-center shadow-sm">
          <h1 className="text-xl font-bold">Unable to load profile</h1>
          <p className="mt-2 text-sm text-red-600">{error || "Profile not found."}</p>
          <Link href="/candidate/profile" className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white">Edit Profile</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#eff6ff_0,_#f8fafc_35%,_#f8fafc_100%)] text-slate-900">
      <nav className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-2xl font-black tracking-tight"><span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-sm text-white shadow-lg">F</span><span>Fresher<span className="text-blue-600">Hire</span></span></Link>
          <div className="flex items-center gap-3">
            <Link href="/candidate/profile" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">Edit Profile</Link>
            <Link href="/candidate/dashboard" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Dashboard</Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white">
        <div className="absolute -left-24 top-4 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_310px] lg:items-center">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <motion.div initial={{ scale: .85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="grid h-24 w-24 shrink-0 place-items-center rounded-3xl border border-white/15 bg-white/10 text-3xl font-black shadow-2xl backdrop-blur">{initials}</motion.div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-200">● Recruiter Preview</span>
                  {profile.profile_completion >= 80 && <span className="rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-xs font-bold text-blue-200">Recruiter-ready ✓</span>}
                </div>
                <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{profile.full_name}</h1>
                <p className="mt-2 text-lg font-semibold text-blue-100">{profile.headline || "Fresher Candidate"}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-300">
                  {profile.location && <span className="rounded-full bg-white/10 px-3 py-1.5">📍 {profile.location}</span>}
                  {profile.degree && <span className="rounded-full bg-white/10 px-3 py-1.5">🎓 {profile.degree}</span>}
                  {profile.graduation_year && <span className="rounded-full bg-white/10 px-3 py-1.5">Class of {profile.graduation_year}</span>}
                </div>
              </div>
            </div>

            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#60a5fa ${profile.profile_completion * 3.6}deg, rgba(255,255,255,.12) 0deg)` }}>
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-slate-950 text-lg font-black">{profile.profile_completion}%</div>
                </div>
                <div>
                  <p className="font-black">Profile Strength</p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">{profile.profile_completion >= 80 ? "Strong enough to start applying confidently." : "Keep adding evidence to stand out."}</p>
                </div>
              </div>
              <Link href="/candidate/profile" className="mt-5 flex w-full justify-center rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5">Improve Profile →</Link>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-7 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SnapshotCard icon="⚡" label="Skills" value={profile.skill_items.length} note="skills added" />
          <SnapshotCard icon="🧠" label="Verified" value={verifiedAssessments.length} note="assessment badges" />
          <SnapshotCard icon="🚀" label="Projects" value={profile.project_items.length} note="work samples" />
          <SnapshotCard icon="✨" label="Evidence" value={evidenceCount} note="proof points" />
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-7 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-7">
          <ProfileSection title="About">
            <p className="whitespace-pre-line text-sm leading-7 text-slate-600">{profile.bio || "No professional summary added yet."}</p>
          </ProfileSection>

          <ProfileSection title="Contact Information">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email</p>
                <p className="mt-2 break-all text-sm font-semibold text-slate-700">{profile.email}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Phone Number</p>
                <p className="mt-2 text-sm font-semibold text-slate-700">{profile.phone || "Not added yet"}</p>
              </div>
            </div>
          </ProfileSection>

          <ProfileSection title="Skills">
            {profile.skill_items.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {profile.skill_items.map((skill) => (
                  <div key={skill.id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                    <span className="font-semibold text-slate-800">{skill.skill_name}</span>
                    <span className="ml-2 text-xs font-medium text-slate-400">{skill.skill_level}</span>
                  </div>
                ))}
              </div>
            ) : <EmptyState>No skills added yet.</EmptyState>}
          </ProfileSection>

          <ProfileSection title="Verified Skills & Assessments">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm leading-6 text-slate-500">
                  Best recorded result for each assessment. A score of 75% or above is verified.
                </p>
              </div>
              <Link
                href="/assessments"
                className="w-fit rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700"
              >
                Take Assessment →
              </Link>
            </div>
            {profile.best_assessment_items.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {profile.best_assessment_items.map((assessment) => {
                  const verified = assessment.percentage >= 75;
                  return (
                    <article
                      key={assessment.id}
                      className={`rounded-2xl border p-5 ${
                        verified
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-slate-900">{assessment.skill_name}</h3>
                          <p className="mt-1 text-xs text-slate-500">Best result</p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            verified
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {verified ? "✓ Verified" : "Attempted"}
                        </span>
                      </div>
                      <div className="mt-5 flex items-end justify-between">
                        <span className="text-3xl font-black text-slate-950">{assessment.percentage}%</span>
                        <span className="text-xs font-medium text-slate-500">
                          {assessment.score}/{assessment.total_questions}
                        </span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                        <div
                          className={`h-full rounded-full ${verified ? "bg-emerald-500" : "bg-blue-600"}`}
                          style={{ width: `${Math.min(100, Math.max(0, assessment.percentage))}%` }}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
                <p className="font-semibold text-slate-800">No assessments completed yet.</p>
                <Link href="/assessments" className="mt-3 inline-flex text-sm font-semibold text-blue-600">
                  Explore Assessments →
                </Link>
              </div>
            )}
          </ProfileSection>

          <ProfileSection title="Experience">
            <TimelineList items={profile.experience_items} render={(item) => (
              <div>
                <h3 className="text-lg font-bold text-slate-900">{item.role_title}</h3>
                <p className="mt-1 font-semibold text-slate-600">{item.company_name}</p>
                <p className="mt-1 text-sm text-slate-400">{prettyLabel(item.employment_type)}{item.work_mode ? ` • ${prettyLabel(item.work_mode)}` : ""}{item.location ? ` • ${item.location}` : ""}</p>
                <p className="mt-1 text-sm text-slate-400">{formatDateRange(item.start_date, item.end_date, item.is_current)}</p>
                {item.description && <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{item.description}</p>}
                {item.skills_used && <p className="mt-3 text-sm"><span className="font-semibold text-slate-700">Skills:</span> <span className="text-slate-500">{item.skills_used}</span></p>}
              </div>
            )} empty="No professional experience added yet." />
          </ProfileSection>

          <ProfileSection title="Internships & Apprenticeships">
            <TimelineList items={profile.internship_items} render={(item) => (
              <div>
                <h3 className="text-lg font-bold text-slate-900">{item.role_title}</h3>
                <p className="mt-1 font-semibold text-slate-600">{item.company_name}</p>
                <p className="mt-1 text-sm text-slate-400">{prettyLabel(item.employment_type)}{item.work_mode ? ` • ${prettyLabel(item.work_mode)}` : ""}{item.location ? ` • ${item.location}` : ""}</p>
                <p className="mt-1 text-sm text-slate-400">{formatDateRange(item.start_date, item.end_date, item.is_current)}</p>
                {item.description && <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{item.description}</p>}
              </div>
            )} empty="No internships or apprenticeships added yet." />
          </ProfileSection>

          <ProfileSection title="Education">
            {profile.education_items.length > 0 ? (
              <div className="space-y-5">
                {profile.education_items.map((item) => (
                  <div key={item.id} className="border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                    <h3 className="text-lg font-bold text-slate-900">{item.degree_or_course || prettyLabel(item.education_level)}</h3>
                    <p className="mt-1 font-semibold text-slate-600">{item.institution_name}</p>
                    {item.specialization && <p className="mt-1 text-sm text-slate-500">{item.specialization}</p>}
                    <p className="mt-2 text-sm text-slate-400">{formatYearRange(item.start_year, item.end_year, item.is_current)}{item.location ? ` • ${item.location}` : ""}</p>
                    {item.score_value != null && <p className="mt-2 text-sm font-medium text-slate-600">{formatScore(item.score_type, item.score_value)}</p>}
                  </div>
                ))}
              </div>
            ) : <EmptyState>No education added yet.</EmptyState>}
          </ProfileSection>

          <ProfileSection title="Projects">
            {profile.project_items.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {profile.project_items.map((project) => (
                  <article key={project.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <h3 className="text-lg font-bold text-slate-900">{project.title}</h3>
                    {project.technologies && <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-blue-600">{project.technologies}</p>}
                    {project.description && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{project.description}</p>}
                    <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
                      {project.github_url && <a href={project.github_url} target="_blank" rel="noreferrer" className="text-blue-600">GitHub ↗</a>}
                      {project.live_url && <a href={project.live_url} target="_blank" rel="noreferrer" className="text-blue-600">Live Project ↗</a>}
                    </div>
                  </article>
                ))}
              </div>
            ) : <EmptyState>No projects added yet.</EmptyState>}
          </ProfileSection>
        </div>

        <aside className="space-y-5">
          <SideCard title="Contact">
            <p className="break-all text-sm text-slate-600">{profile.email}</p>
            {profile.phone && <p className="mt-2 text-sm text-slate-600">{profile.phone}</p>}
          </SideCard>

          <SideCard title="Resume">
            {profile.resume_url ? (
              <a href={profile.resume_url} target="_blank" rel="noreferrer" className="inline-flex w-full justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white">View Resume ↗</a>
            ) : <p className="text-sm text-slate-500">No resume uploaded yet.</p>}
          </SideCard>

          <SideCard title="Links">
            <div className="space-y-2 text-sm font-semibold">
              {profile.linkedin_url && <a className="block text-blue-600" href={profile.linkedin_url} target="_blank" rel="noreferrer">LinkedIn ↗</a>}
              {profile.github_url && <a className="block text-blue-600" href={profile.github_url} target="_blank" rel="noreferrer">GitHub ↗</a>}
              {profile.portfolio_url && <a className="block text-blue-600" href={profile.portfolio_url} target="_blank" rel="noreferrer">Portfolio ↗</a>}
              {!profile.linkedin_url && !profile.github_url && !profile.portfolio_url && <p className="font-normal text-slate-500">No links added yet.</p>}
            </div>
          </SideCard>

          <Link href="/candidate/profile" className="flex w-full justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">Edit Profile</Link>
        </aside>
      </div>
    </main>
  );
}

function ProfileSection({ title, children }: { title: string; children: ReactNode }) {
  const meta = getProfileSectionMeta(title);
  return (
    <motion.section initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-70px" }} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-xl hover:shadow-slate-200/60">
      <div className={`h-1.5 bg-gradient-to-r ${meta.gradient}`} />
      <div className="p-6 sm:p-7">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <span className={`grid h-10 w-10 place-items-center rounded-2xl ${meta.iconClass}`}>{meta.icon}</span>
          <h2 className="text-xl font-black text-slate-950">{title}</h2>
        </div>
        <div className="pt-5">{children}</div>
      </div>
    </motion.section>
  );
}

function SideCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <motion.section whileHover={{ y: -3 }} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-lg">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Profile asset</p>
      <h2 className="mt-1 font-black text-slate-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </motion.section>
  );
}

function TimelineList<T extends { id: number }>({ items, render, empty }: { items: T[]; render: (item: T) => ReactNode; empty: string }) {
  if (items.length === 0) return <EmptyState>{empty}</EmptyState>;
  return (
    <div className="space-y-0">
      {items.map((item, index) => (
        <motion.div key={item.id} whileHover={{ x: 4 }} className="relative pl-8 pb-7 last:pb-0">
          {index !== items.length - 1 && <div className="absolute left-[7px] top-4 h-full w-px bg-slate-200" />}
          <div className="absolute left-0 top-1 h-4 w-4 rounded-full border-4 border-blue-100 bg-blue-600" />
          {render(item)}
        </motion.div>
      ))}
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white px-5 py-9 text-center text-sm text-slate-400">{children}</div>;
}

function SnapshotCard({ icon, label, value, note }: { icon: string; label: string; value: number; note: string }) {
  return (
    <motion.div whileHover={{ y: -4 }} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-xl">
      <div className="flex items-center justify-between">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50">{icon}</span>
        <span className="text-2xl font-black text-slate-950">{value}</span>
      </div>
      <p className="mt-4 font-black text-slate-800">{label}</p>
      <p className="mt-1 text-xs text-slate-400">{note}</p>
    </motion.div>
  );
}

function getProfileSectionMeta(title: string) {
  if (title === "About") return { icon: "👋", iconClass: "bg-blue-50", gradient: "from-blue-500 via-cyan-400 to-blue-500" };
  if (title.startsWith("Contact")) return { icon: "☎", iconClass: "bg-emerald-50", gradient: "from-emerald-500 via-teal-400 to-cyan-400" };
  if (title === "Skills") return { icon: "⚡", iconClass: "bg-amber-50", gradient: "from-amber-400 via-orange-400 to-rose-400" };
  if (title.startsWith("Verified")) return { icon: "🧠", iconClass: "bg-violet-50", gradient: "from-violet-500 via-fuchsia-500 to-pink-500" };
  if (title === "Experience") return { icon: "💼", iconClass: "bg-sky-50", gradient: "from-sky-500 via-blue-500 to-indigo-500" };
  if (title.startsWith("Intern")) return { icon: "🌱", iconClass: "bg-lime-50", gradient: "from-lime-400 via-emerald-400 to-teal-400" };
  if (title === "Education") return { icon: "🎓", iconClass: "bg-indigo-50", gradient: "from-indigo-500 via-blue-500 to-cyan-400" };
  if (title === "Projects") return { icon: "🚀", iconClass: "bg-rose-50", gradient: "from-rose-500 via-orange-400 to-amber-400" };
  return { icon: "✨", iconClass: "bg-blue-50", gradient: "from-blue-500 to-violet-500" };
}

function prettyLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatYearRange(start: number | null, end: number | null, current: boolean) {
  if (!start && !end) return "";
  return `${start || ""} - ${current ? "Present" : end || ""}`;
}

function formatScore(type: string | null, value: number) {
  if (type === "percentage") return `${value}%`;
  if (type === "cgpa_10") return `CGPA: ${value}/10`;
  if (type === "cgpa_4") return `CGPA: ${value}/4`;
  return type ? `${prettyLabel(type)}: ${value}` : String(value);
}

function formatDateRange(start: string, end: string | null, current: boolean) {
  return `${formatMonthYear(start)} - ${current ? "Present" : formatMonthYear(end)}`;
}

function formatMonthYear(value: string | null) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}
