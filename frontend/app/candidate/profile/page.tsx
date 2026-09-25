"use client";

import Link from "next/link";
import { FormEvent, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type SkillLevel = "Beginner" | "Intermediate" | "Advanced";
type EducationLevel =
  | "10th"
  | "12th"
  | "diploma"
  | "bachelors"
  | "masters"
  | "doctorate"
  | "other";
type ScoreType = "percentage" | "cgpa_10" | "cgpa_4" | "grade" | "other";
type EmploymentType =
  | "full_time"
  | "internship"
  | "part_time"
  | "contract"
  | "freelance"
  | "apprenticeship"
  | "other";
type WorkMode = "onsite" | "hybrid" | "remote";

type SkillItem = {
  id: number;
  user_id: string;
  skill_name: string;
  skill_level: SkillLevel;
};

type AssessmentItem = {
  id: number;
  user_id: string;
  skill_name: string;
  score: number;
  total_questions: number;
  percentage: number;
  created_at?: string | null;
};

type EducationItem = {
  id: number;
  user_id: string;
  education_level: EducationLevel;
  institution_name: string;
  board_or_university: string | null;
  degree_or_course: string | null;
  specialization: string | null;
  start_year: number | null;
  end_year: number | null;
  score_type: ScoreType | null;
  score_value: number | null;
  location: string | null;
  is_current: boolean;
};

type EmploymentItem = {
  id: number;
  user_id: string;
  employment_type: EmploymentType;
  company_name: string;
  role_title: string;
  location: string | null;
  work_mode: WorkMode | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  skills_used: string | null;
};

type ProjectItem = {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  technologies: string | null;
  github_url: string | null;
  live_url: string | null;
};

type CandidateProfile = {
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
  skill_items: SkillItem[];
  assessment_items: AssessmentItem[];
  best_assessment_items: AssessmentItem[];
  education_items: EducationItem[];
  employment_items: EmploymentItem[];
  experience_items: EmploymentItem[];
  internship_items: EmploymentItem[];
  project_items: ProjectItem[];
};

type BasicForm = {
  full_name: string;
  headline: string;
  phone: string;
  location: string;
  graduation_year: string;
  degree: string;
  bio: string;
  linkedin_url: string;
  github_url: string;
  portfolio_url: string;
};

type SkillForm = {
  skill_name: string;
  skill_level: SkillLevel;
};

type EducationForm = {
  education_level: EducationLevel;
  institution_name: string;
  board_or_university: string;
  degree_or_course: string;
  specialization: string;
  start_year: string;
  end_year: string;
  score_type: ScoreType | "";
  score_value: string;
  location: string;
  is_current: boolean;
};

type EmploymentForm = {
  employment_type: EmploymentType;
  company_name: string;
  role_title: string;
  location: string;
  work_mode: WorkMode | "";
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
  skills_used: string;
};

type ProjectForm = {
  title: string;
  description: string;
  technologies: string;
  github_url: string;
  live_url: string;
};

const emptySkill: SkillForm = {
  skill_name: "",
  skill_level: "Intermediate",
};

const emptyEducation: EducationForm = {
  education_level: "bachelors",
  institution_name: "",
  board_or_university: "",
  degree_or_course: "",
  specialization: "",
  start_year: "",
  end_year: "",
  score_type: "",
  score_value: "",
  location: "",
  is_current: false,
};

const emptyEmployment = (type: EmploymentType): EmploymentForm => ({
  employment_type: type,
  company_name: "",
  role_title: "",
  location: "",
  work_mode: "",
  start_date: "",
  end_date: "",
  is_current: false,
  description: "",
  skills_used: "",
});

const emptyProject: ProjectForm = {
  title: "",
  description: "",
  technologies: "",
  github_url: "",
  live_url: "",
};

export default function CandidateProfilePage() {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [basic, setBasic] = useState<BasicForm>({
    full_name: "",
    headline: "",
    phone: "",
    location: "",
    graduation_year: "",
    degree: "",
    bio: "",
    linkedin_url: "",
    github_url: "",
    portfolio_url: "",
  });

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [skillForm, setSkillForm] = useState<SkillForm>(emptySkill);
  const [editingSkillId, setEditingSkillId] = useState<number | null>(null);
  const [skillOpen, setSkillOpen] = useState(false);

  const [educationForm, setEducationForm] = useState<EducationForm>(emptyEducation);
  const [editingEducationId, setEditingEducationId] = useState<number | null>(null);
  const [educationOpen, setEducationOpen] = useState(false);

  const [experienceForm, setExperienceForm] = useState<EmploymentForm>(emptyEmployment("full_time"));
  const [editingExperienceId, setEditingExperienceId] = useState<number | null>(null);
  const [experienceOpen, setExperienceOpen] = useState(false);

  const [internshipForm, setInternshipForm] = useState<EmploymentForm>(emptyEmployment("internship"));
  const [editingInternshipId, setEditingInternshipId] = useState<number | null>(null);
  const [internshipOpen, setInternshipOpen] = useState(false);

  const [projectForm, setProjectForm] = useState<ProjectForm>(emptyProject);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [projectOpen, setProjectOpen] = useState(false);

  const [sectionSaving, setSectionSaving] = useState("");
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeDeleting, setResumeDeleting] = useState(false);

  const completion = profile?.profile_completion || 0;

  useEffect(() => {
    void loadProfile();
  }, []);

  async function parseResponse(response: Response) {
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      router.replace("/login");
      throw new Error("Please login again.");
    }
    if (!response.ok) {
      throw new Error(data.detail || "Something went wrong.");
    }
    return data;
  }

  async function loadProfile(showSpinner = true) {
    try {
      if (showSpinner) setLoading(true);
      setError("");

      const response = await fetch(`${apiUrl}/api/candidate/profile/full`, {
        credentials: "include",
        cache: "no-store",
      });
      const data: CandidateProfile = await parseResponse(response);
      setProfile(data);
      setBasic({
        full_name: data.full_name || "",
        headline: data.headline || "",
        phone: data.phone || "",
        location: data.location || "",
        graduation_year: data.graduation_year ? String(data.graduation_year) : "",
        degree: data.degree || "",
        bio: data.bio || "",
        linkedin_url: data.linkedin_url || "",
        github_url: data.github_url || "",
        portfolio_url: data.portfolio_url || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load profile.");
    } finally {
      if (showSpinner) setLoading(false);
    }
  }

  async function refreshProfile(messageText?: string) {
    await loadProfile(false);
    if (messageText) setMessage(messageText);
  }

  async function saveBasicProfile() {
    try {
      setSavingProfile(true);
      setError("");
      setMessage("");

      const response = await fetch(`${apiUrl}/api/candidate/profile`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: basic.full_name.trim(),
          headline: basic.headline.trim() || null,
          phone: basic.phone.trim() || null,
          location: basic.location.trim() || null,
          graduation_year: basic.graduation_year ? Number(basic.graduation_year) : null,
          degree: basic.degree.trim() || null,
          bio: basic.bio.trim() || null,
          linkedin_url: basic.linkedin_url.trim() || null,
          github_url: basic.github_url.trim() || null,
          portfolio_url: basic.portfolio_url.trim() || null,
        }),
      });

      await parseResponse(response);
      router.push("/candidate/profile/view");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveSkill(event: FormEvent) {
    event.preventDefault();
    try {
      setSectionSaving("skill");
      setError("");
      const response = await fetch(
        editingSkillId
          ? `${apiUrl}/api/candidate/skills/${editingSkillId}`
          : `${apiUrl}/api/candidate/skills`,
        {
          method: editingSkillId ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(skillForm),
        }
      );
      await parseResponse(response);
      setSkillOpen(false);
      setEditingSkillId(null);
      setSkillForm(emptySkill);
      await refreshProfile(editingSkillId ? "Skill updated." : "Skill added.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save skill.");
    } finally {
      setSectionSaving("");
    }
  }

  function editSkill(item: SkillItem) {
    setEditingSkillId(item.id);
    setSkillForm({ skill_name: item.skill_name, skill_level: item.skill_level });
    setSkillOpen(true);
  }

  async function deleteSkill(id: number) {
    if (!window.confirm("Remove this skill from your profile?")) return;
    try {
      setSectionSaving(`skill-${id}`);
      const response = await fetch(`${apiUrl}/api/candidate/skills/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      await parseResponse(response);
      await refreshProfile("Skill removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove skill.");
    } finally {
      setSectionSaving("");
    }
  }

  async function saveEducation(event: FormEvent) {
    event.preventDefault();
    try {
      setSectionSaving("education");
      setError("");
      const payload = {
        ...educationForm,
        board_or_university: educationForm.board_or_university.trim() || null,
        degree_or_course: educationForm.degree_or_course.trim() || null,
        specialization: educationForm.specialization.trim() || null,
        start_year: educationForm.start_year ? Number(educationForm.start_year) : null,
        end_year: educationForm.is_current || !educationForm.end_year ? null : Number(educationForm.end_year),
        score_type: educationForm.score_type || null,
        score_value: educationForm.score_value ? Number(educationForm.score_value) : null,
        location: educationForm.location.trim() || null,
      };
      const response = await fetch(
        editingEducationId
          ? `${apiUrl}/api/candidate/education/${editingEducationId}`
          : `${apiUrl}/api/candidate/education`,
        {
          method: editingEducationId ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      await parseResponse(response);
      setEducationOpen(false);
      setEditingEducationId(null);
      setEducationForm(emptyEducation);
      await refreshProfile(editingEducationId ? "Education updated." : "Education added.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save education.");
    } finally {
      setSectionSaving("");
    }
  }

  function editEducation(item: EducationItem) {
    setEditingEducationId(item.id);
    setEducationForm({
      education_level: item.education_level,
      institution_name: item.institution_name || "",
      board_or_university: item.board_or_university || "",
      degree_or_course: item.degree_or_course || "",
      specialization: item.specialization || "",
      start_year: item.start_year ? String(item.start_year) : "",
      end_year: item.end_year ? String(item.end_year) : "",
      score_type: item.score_type || "",
      score_value: item.score_value != null ? String(item.score_value) : "",
      location: item.location || "",
      is_current: item.is_current,
    });
    setEducationOpen(true);
  }

  async function deleteEducation(id: number) {
    if (!window.confirm("Delete this education entry?")) return;
    try {
      setSectionSaving(`education-${id}`);
      const response = await fetch(`${apiUrl}/api/candidate/education/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      await parseResponse(response);
      await refreshProfile("Education removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove education.");
    } finally {
      setSectionSaving("");
    }
  }

  async function saveEmployment(event: FormEvent, kind: "experience" | "internship") {
    event.preventDefault();
    const form = kind === "experience" ? experienceForm : internshipForm;
    const editingId = kind === "experience" ? editingExperienceId : editingInternshipId;
    try {
      setSectionSaving(kind);
      setError("");
      const payload = {
        ...form,
        company_name: form.company_name.trim(),
        role_title: form.role_title.trim(),
        location: form.location.trim() || null,
        work_mode: form.work_mode || null,
        end_date: form.is_current ? null : form.end_date || null,
        description: form.description.trim() || null,
        skills_used: form.skills_used.trim() || null,
      };
      const response = await fetch(
        editingId
          ? `${apiUrl}/api/candidate/employment/${editingId}`
          : `${apiUrl}/api/candidate/employment`,
        {
          method: editingId ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      await parseResponse(response);

      if (kind === "experience") {
        setExperienceOpen(false);
        setEditingExperienceId(null);
        setExperienceForm(emptyEmployment("full_time"));
      } else {
        setInternshipOpen(false);
        setEditingInternshipId(null);
        setInternshipForm(emptyEmployment("internship"));
      }
      await refreshProfile(editingId ? "Entry updated." : "Entry added.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save entry.");
    } finally {
      setSectionSaving("");
    }
  }

  function editExperience(item: EmploymentItem, kind: "experience" | "internship") {
    const form: EmploymentForm = {
      employment_type: item.employment_type,
      company_name: item.company_name || "",
      role_title: item.role_title || "",
      location: item.location || "",
      work_mode: item.work_mode || "",
      start_date: item.start_date || "",
      end_date: item.end_date || "",
      is_current: item.is_current,
      description: item.description || "",
      skills_used: item.skills_used || "",
    };
    if (kind === "experience") {
      setEditingExperienceId(item.id);
      setExperienceForm(form);
      setExperienceOpen(true);
    } else {
      setEditingInternshipId(item.id);
      setInternshipForm(form);
      setInternshipOpen(true);
    }
  }

  async function deleteEmployment(id: number) {
    if (!window.confirm("Delete this experience entry?")) return;
    try {
      setSectionSaving(`employment-${id}`);
      const response = await fetch(`${apiUrl}/api/candidate/employment/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      await parseResponse(response);
      await refreshProfile("Experience removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove experience.");
    } finally {
      setSectionSaving("");
    }
  }

  async function saveProject(event: FormEvent) {
    event.preventDefault();
    try {
      setSectionSaving("project");
      setError("");
      const response = await fetch(
        editingProjectId
          ? `${apiUrl}/api/candidate/projects/${editingProjectId}`
          : `${apiUrl}/api/candidate/projects`,
        {
          method: editingProjectId ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: projectForm.title.trim(),
            description: projectForm.description.trim() || null,
            technologies: projectForm.technologies.trim() || null,
            github_url: projectForm.github_url.trim() || null,
            live_url: projectForm.live_url.trim() || null,
          }),
        }
      );
      await parseResponse(response);
      setProjectOpen(false);
      setEditingProjectId(null);
      setProjectForm(emptyProject);
      await refreshProfile(editingProjectId ? "Project updated." : "Project added.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save project.");
    } finally {
      setSectionSaving("");
    }
  }

  function editProject(item: ProjectItem) {
    setEditingProjectId(item.id);
    setProjectForm({
      title: item.title || "",
      description: item.description || "",
      technologies: item.technologies || "",
      github_url: item.github_url || "",
      live_url: item.live_url || "",
    });
    setProjectOpen(true);
  }

  async function deleteProject(id: number) {
    if (!window.confirm("Delete this project?")) return;
    try {
      setSectionSaving(`project-${id}`);
      const response = await fetch(`${apiUrl}/api/candidate/projects/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      await parseResponse(response);
      await refreshProfile("Project removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove project.");
    } finally {
      setSectionSaving("");
    }
  }

  async function uploadResume(file: File | undefined) {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a PDF resume.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Resume must be smaller than 5 MB.");
      return;
    }

    try {
      setResumeUploading(true);
      setError("");
      const formData = new FormData();
      formData.append("resume", file);
      const response = await fetch(`${apiUrl}/api/candidate/resume`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      await parseResponse(response);
      await refreshProfile("Resume uploaded successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload resume.");
    } finally {
      setResumeUploading(false);
    }
  }

  async function removeResume() {
    if (!window.confirm("Remove your current resume?")) return;
    try {
      setResumeDeleting(true);
      const response = await fetch(`${apiUrl}/api/candidate/resume`, {
        method: "DELETE",
        credentials: "include",
      });
      await parseResponse(response);
      await refreshProfile("Resume removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove resume.");
    } finally {
      setResumeDeleting(false);
    }
  }

  const experienceItems = useMemo(() => profile?.experience_items || [], [profile]);
  const internshipItems = useMemo(() => profile?.internship_items || [], [profile]);

  const initials = useMemo(() => {
    return (profile?.full_name || basic.full_name || "FH")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [profile?.full_name, basic.full_name]);

  const verifiedAssessmentCount = useMemo(
    () => (profile?.best_assessment_items || []).filter((item) => item.percentage >= 75).length,
    [profile]
  );

  const launchSteps = useMemo(() => [
    { label: "Add your headline", done: Boolean(basic.headline.trim()), target: "basic-information", icon: "✦" },
    { label: "Add 3+ skills", done: (profile?.skill_items || []).length >= 3, target: "skills", icon: "⚡" },
    { label: "Complete an assessment", done: (profile?.best_assessment_items || []).length > 0, target: "verified-skills-assessments", icon: "🧠" },
    { label: "Add education", done: (profile?.education_items || []).length > 0, target: "education", icon: "🎓" },
    { label: "Add internship / experience", done: (profile?.employment_items || []).length > 0, target: "experience", icon: "💼" },
    { label: "Add a project", done: (profile?.project_items || []).length > 0, target: "projects", icon: "🚀" },
    { label: "Upload resume", done: Boolean(profile?.resume_url), target: "resume", icon: "📄" },
  ], [basic.headline, profile]);

  const launchDone = launchSteps.filter((step) => step.done).length;
  const nextLaunchStep = launchSteps.find((step) => !step.done);

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
          <p className="mt-4 text-sm font-medium text-slate-500">Loading your profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#eff6ff_0,_#f8fafc_34%,_#f8fafc_100%)] pb-32 text-slate-900">
      <nav className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-950">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-sm text-white shadow-lg">F</span><span>Fresher<span className="text-blue-600">Hire</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/candidate/profile/view" className="text-sm font-semibold text-blue-600">
              View Profile
            </Link>
            <Link href="/candidate/dashboard" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white">
        <div className="absolute -left-20 top-8 h-52 w-52 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-xl font-black shadow-2xl backdrop-blur">{initials}</div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-200">Fresher Launchpad</p>
                  <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Make your profile impossible to skip.</h1>
                </div>
              </div>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Build proof around your skills, projects and assessments. Every completed section makes your recruiter profile stronger.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" onClick={() => nextLaunchStep && scrollToSection(nextLaunchStep.target)} className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-lg transition hover:-translate-y-0.5">
                  {nextLaunchStep ? `Next: ${nextLaunchStep.label}` : "Profile ready ✓"}
                </button>
                <Link href="/candidate/profile/view" className="rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15">
                  Preview Recruiter View →
                </Link>
              </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-5">
                <div className="relative grid h-24 w-24 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#60a5fa ${completion * 3.6}deg, rgba(255,255,255,0.12) 0deg)` }}>
                  <div className="grid h-20 w-20 place-items-center rounded-full bg-slate-950 text-center">
                    <span className="text-2xl font-black">{completion}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Profile Power</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{completion >= 80 ? "Recruiter-ready. Keep your proof fresh." : "You’re building momentum. Finish the next step."}</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2">
                <MiniStat label="Skills" value={(profile?.skill_items || []).length} />
                <MiniStat label="Verified" value={verifiedAssessmentCount} />
                <MiniStat label="Projects" value={(profile?.project_items || []).length} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div>
        <div className="mx-auto max-w-6xl space-y-7 px-4 py-8 sm:px-6">
          {error && <Alert tone="error">{error}</Alert>}
          {message && <Alert tone="success">{message}</Alert>}

          <section className="grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Your Mission</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">Finish your recruiter-ready checklist</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Small wins add up. Complete the sections that show the strongest proof of your potential.</p>
                </div>
                <div className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-white">
                  <p className="text-2xl font-black">{launchDone}/{launchSteps.length}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">missions done</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {launchSteps.map((step) => (
                  <button key={step.label} type="button" onClick={() => scrollToSection(step.target)} className={`group flex items-center gap-3 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${step.done ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-blue-50"}`}>
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-base ${step.done ? "bg-emerald-500 text-white" : "bg-white text-slate-700 shadow-sm"}`}>{step.done ? "✓" : step.icon}</span>
                    <span>
                      <span className="block text-sm font-bold text-slate-800">{step.label}</span>
                      <span className="text-xs text-slate-400">{step.done ? "Completed" : "Tap to continue"}</span>
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.08 } }} className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl text-white shadow-lg shadow-blue-200">✨</div>
              <h3 className="mt-4 text-xl font-black text-slate-950">Fresher tip</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Recruiters skim fast. Use numbers, outcomes and tools in projects and experience instead of only listing responsibilities.</p>
              <div className="mt-5 rounded-2xl border border-white bg-white/70 p-4 text-sm text-slate-600">
                <span className="font-bold text-slate-900">Example:</span> “Built a RAG assistant with FastAPI + Qdrant, reducing search time by 40%.”
              </div>
            </motion.div>
          </section>

          <SectionCard title="Basic Information" subtitle="Your core professional details.">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Full Name">
                <Input required value={basic.full_name} onChange={(value) => setBasic({ ...basic, full_name: value })} />
              </Field>
              <Field label="Professional Headline">
                <Input value={basic.headline} onChange={(value) => setBasic({ ...basic, headline: value })} placeholder="e.g. AI/ML Engineer | LLM & RAG" />
              </Field>
              <Field label="Location">
                <Input value={basic.location} onChange={(value) => setBasic({ ...basic, location: value })} placeholder="e.g. Noida, Uttar Pradesh" />
              </Field>
              <Field label="Degree">
                <Input value={basic.degree} onChange={(value) => setBasic({ ...basic, degree: value })} placeholder="e.g. B.E. Computer Science" />
              </Field>
              <Field label="Graduation Year">
                <Input type="number" value={basic.graduation_year} onChange={(value) => setBasic({ ...basic, graduation_year: value })} placeholder="2025" />
              </Field>
            </div>
            <div className="mt-5">
              <Field label="About / Bio">
                <Textarea value={basic.bio} onChange={(value) => setBasic({ ...basic, bio: value })} placeholder="Write a concise professional summary, your strengths and what roles you are looking for." rows={5} />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Contact Information" subtitle="Keep your contact details updated for hiring communication.">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Email">
                <Input value={profile?.email || ""} onChange={() => {}} readOnly disabled />
              </Field>
              <Field label="Phone Number">
                <Input
                  type="tel"
                  value={basic.phone}
                  onChange={(value) => setBasic({ ...basic, phone: value })}
                  placeholder="e.g. +91 98765 43210"
                />
              </Field>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-400">
              Your email is linked to your login account. You can update your phone number here.
            </p>
          </SectionCard>

          <SectionCard
            title="Skills"
            subtitle="Add skills individually and select your proficiency."
            action={
              <AddButton onClick={() => { setEditingSkillId(null); setSkillForm(emptySkill); setSkillOpen(!skillOpen); }}>
                + Add Skill
              </AddButton>
            }
          >
            <div className="flex flex-wrap gap-3">
              {(profile?.skill_items || []).map((item) => (
                <div key={item.id} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="font-semibold text-slate-800">{item.skill_name}</span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">{item.skill_level}</span>
                  <button type="button" onClick={() => editSkill(item)} className="text-xs font-semibold text-blue-600">Edit</button>
                  <button type="button" disabled={sectionSaving === `skill-${item.id}`} onClick={() => void deleteSkill(item.id)} className="text-xs font-semibold text-red-600">Remove</button>
                </div>
              ))}
              {(profile?.skill_items || []).length === 0 && <EmptyText>No skills added yet.</EmptyText>}
            </div>

            {skillOpen && (
              <form onSubmit={saveSkill} className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Skill">
                    <Input required value={skillForm.skill_name} onChange={(value) => setSkillForm({ ...skillForm, skill_name: value })} placeholder="Python" />
                  </Field>
                  <Field label="Level">
                    <Select value={skillForm.skill_level} onChange={(value) => setSkillForm({ ...skillForm, skill_level: value as SkillLevel })}>
                      <option>Beginner</option>
                      <option>Intermediate</option>
                      <option>Advanced</option>
                    </Select>
                  </Field>
                </div>
                <FormActions loading={sectionSaving === "skill"} onCancel={() => setSkillOpen(false)} label={editingSkillId ? "Update Skill" : "Add Skill"} />
              </form>
            )}
          </SectionCard>

          <SectionCard
            title="Verified Skills & Assessments"
            subtitle="Your best assessment result for each skill. Scores of 75% or more are shown as verified."
            action={
              <Link
                href="/assessments"
                className="w-fit rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-lg"
              >
                Take Assessment →
              </Link>
            }
          >
            {(profile?.best_assessment_items || []).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-9 text-center">
                <p className="font-semibold text-slate-800">No assessments completed yet</p>
                <p className="mt-2 text-sm text-slate-500">
                  Complete a role-relevant assessment to add verified evidence to your profile.
                </p>
                <Link href="/assessments" className="mt-4 inline-flex text-sm font-semibold text-blue-600">
                  Explore Assessments →
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(profile?.best_assessment_items || []).map((assessment) => {
                  const verified = assessment.percentage >= 75;
                  return (
                    <article
                      key={assessment.id}
                      className={`rounded-2xl border p-5 ${
                        verified
                          ? "border-emerald-200 bg-emerald-50/70"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-slate-900">{assessment.skill_name}</h3>
                          <p className="mt-1 text-xs text-slate-500">Best recorded result</p>
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
                        <p className="text-3xl font-black text-slate-950">{assessment.percentage}%</p>
                        <p className="text-xs font-medium text-slate-500">
                          {assessment.score}/{assessment.total_questions}
                        </p>
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
            )}
          </SectionCard>

          <SectionCard
            title="Education"
            subtitle="Add each school, college or university qualification separately."
            action={
              <AddButton onClick={() => { setEditingEducationId(null); setEducationForm(emptyEducation); setEducationOpen(!educationOpen); }}>
                + Add Education
              </AddButton>
            }
          >
            <div className="space-y-4">
              {(profile?.education_items || []).map((item) => (
                <EntryCard
                  key={item.id}
                  title={item.degree_or_course || prettyLabel(item.education_level)}
                  subtitle={item.institution_name}
                  meta={[
                    item.specialization,
                    formatYearRange(item.start_year, item.end_year, item.is_current),
                    formatScore(item.score_type, item.score_value),
                    item.location,
                  ]}
                  onEdit={() => editEducation(item)}
                  onDelete={() => void deleteEducation(item.id)}
                />
              ))}
              {(profile?.education_items || []).length === 0 && <EmptyText>No education added yet.</EmptyText>}
            </div>

            {educationOpen && (
              <form onSubmit={saveEducation} className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Education Level">
                    <Select value={educationForm.education_level} onChange={(value) => setEducationForm({ ...educationForm, education_level: value as EducationLevel })}>
                      <option value="10th">10th</option>
                      <option value="12th">12th</option>
                      <option value="diploma">Diploma</option>
                      <option value="bachelors">Bachelor&apos;s</option>
                      <option value="masters">Master&apos;s</option>
                      <option value="doctorate">Doctorate</option>
                      <option value="other">Other</option>
                    </Select>
                  </Field>
                  <Field label="Institution Name">
                    <Input required value={educationForm.institution_name} onChange={(value) => setEducationForm({ ...educationForm, institution_name: value })} placeholder="Chandigarh University" />
                  </Field>
                  <Field label="Degree / Course">
                    <Input value={educationForm.degree_or_course} onChange={(value) => setEducationForm({ ...educationForm, degree_or_course: value })} placeholder="B.E. Computer Science" />
                  </Field>
                  <Field label="Specialization">
                    <Input value={educationForm.specialization} onChange={(value) => setEducationForm({ ...educationForm, specialization: value })} placeholder="Computer Science" />
                  </Field>
                  <Field label="Board / University">
                    <Input value={educationForm.board_or_university} onChange={(value) => setEducationForm({ ...educationForm, board_or_university: value })} />
                  </Field>
                  <Field label="Location">
                    <Input value={educationForm.location} onChange={(value) => setEducationForm({ ...educationForm, location: value })} />
                  </Field>
                  <Field label="Start Year">
                    <Input type="number" value={educationForm.start_year} onChange={(value) => setEducationForm({ ...educationForm, start_year: value })} />
                  </Field>
                  <Field label="End Year">
                    <Input type="number" disabled={educationForm.is_current} value={educationForm.end_year} onChange={(value) => setEducationForm({ ...educationForm, end_year: value })} />
                  </Field>
                  <Field label="Score Type">
                    <Select value={educationForm.score_type} onChange={(value) => setEducationForm({ ...educationForm, score_type: value as ScoreType | "" })}>
                      <option value="">Select</option>
                      <option value="percentage">Percentage</option>
                      <option value="cgpa_10">CGPA / 10</option>
                      <option value="cgpa_4">CGPA / 4</option>
                      <option value="grade">Grade</option>
                      <option value="other">Other</option>
                    </Select>
                  </Field>
                  <Field label="Score">
                    <Input type="number" step="0.01" value={educationForm.score_value} onChange={(value) => setEducationForm({ ...educationForm, score_value: value })} placeholder="8.2" />
                  </Field>
                </div>
                <label className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input type="checkbox" checked={educationForm.is_current} onChange={(event) => setEducationForm({ ...educationForm, is_current: event.target.checked, end_year: event.target.checked ? "" : educationForm.end_year })} />
                  Currently studying here
                </label>
                <FormActions loading={sectionSaving === "education"} onCancel={() => setEducationOpen(false)} label={editingEducationId ? "Update Education" : "Add Education"} />
              </form>
            )}
          </SectionCard>

          <EmploymentSection
            title="Experience"
            subtitle="Add full-time, part-time, contract or freelance work separately."
            items={experienceItems}
            open={experienceOpen}
            form={experienceForm}
            setForm={setExperienceForm}
            editingId={editingExperienceId}
            saving={sectionSaving === "experience"}
            allowedTypes={[
              ["full_time", "Full-time"],
              ["part_time", "Part-time"],
              ["contract", "Contract"],
              ["freelance", "Freelance"],
              ["other", "Other"],
            ]}
            onAdd={() => { setEditingExperienceId(null); setExperienceForm(emptyEmployment("full_time")); setExperienceOpen(!experienceOpen); }}
            onEdit={(item) => editExperience(item, "experience")}
            onDelete={(id) => void deleteEmployment(id)}
            onSubmit={(event) => void saveEmployment(event, "experience")}
            onCancel={() => setExperienceOpen(false)}
          />

          <EmploymentSection
            title="Internships & Apprenticeships"
            subtitle="Keep practical training separate from full-time experience."
            items={internshipItems}
            open={internshipOpen}
            form={internshipForm}
            setForm={setInternshipForm}
            editingId={editingInternshipId}
            saving={sectionSaving === "internship"}
            allowedTypes={[
              ["internship", "Internship"],
              ["apprenticeship", "Apprenticeship"],
            ]}
            onAdd={() => { setEditingInternshipId(null); setInternshipForm(emptyEmployment("internship")); setInternshipOpen(!internshipOpen); }}
            onEdit={(item) => editExperience(item, "internship")}
            onDelete={(id) => void deleteEmployment(id)}
            onSubmit={(event) => void saveEmployment(event, "internship")}
            onCancel={() => setInternshipOpen(false)}
          />

          <SectionCard
            title="Projects"
            subtitle="Show recruiters the practical work you have built."
            action={
              <AddButton onClick={() => { setEditingProjectId(null); setProjectForm(emptyProject); setProjectOpen(!projectOpen); }}>
                + Add Project
              </AddButton>
            }
          >
            <div className="space-y-4">
              {(profile?.project_items || []).map((item) => (
                <EntryCard
                  key={item.id}
                  title={item.title}
                  subtitle={item.technologies || "Project"}
                  description={item.description}
                  meta={[item.github_url ? "GitHub available" : null, item.live_url ? "Live demo available" : null]}
                  onEdit={() => editProject(item)}
                  onDelete={() => void deleteProject(item.id)}
                />
              ))}
              {(profile?.project_items || []).length === 0 && <EmptyText>No projects added yet.</EmptyText>}
            </div>

            {projectOpen && (
              <form onSubmit={saveProject} className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Project Title">
                    <Input required value={projectForm.title} onChange={(value) => setProjectForm({ ...projectForm, title: value })} placeholder="Voice AI Platform" />
                  </Field>
                  <Field label="Technologies">
                    <Input value={projectForm.technologies} onChange={(value) => setProjectForm({ ...projectForm, technologies: value })} placeholder="Python, FastAPI, Qdrant, vLLM" />
                  </Field>
                  <Field label="GitHub URL">
                    <Input value={projectForm.github_url} onChange={(value) => setProjectForm({ ...projectForm, github_url: value })} placeholder="https://github.com/..." />
                  </Field>
                  <Field label="Live URL">
                    <Input value={projectForm.live_url} onChange={(value) => setProjectForm({ ...projectForm, live_url: value })} placeholder="https://..." />
                  </Field>
                </div>
                <div className="mt-4">
                  <Field label="Description">
                    <Textarea value={projectForm.description} onChange={(value) => setProjectForm({ ...projectForm, description: value })} rows={4} placeholder="What you built, your contribution and the outcome." />
                  </Field>
                </div>
                <FormActions loading={sectionSaving === "project"} onCancel={() => setProjectOpen(false)} label={editingProjectId ? "Update Project" : "Add Project"} />
              </form>
            )}
          </SectionCard>

          <SectionCard title="Professional Links" subtitle="Help recruiters verify your work and professional presence.">
            <div className="grid gap-5 md:grid-cols-3">
              <Field label="LinkedIn">
                <Input value={basic.linkedin_url} onChange={(value) => setBasic({ ...basic, linkedin_url: value })} placeholder="https://linkedin.com/in/..." />
              </Field>
              <Field label="GitHub">
                <Input value={basic.github_url} onChange={(value) => setBasic({ ...basic, github_url: value })} placeholder="https://github.com/..." />
              </Field>
              <Field label="Portfolio">
                <Input value={basic.portfolio_url} onChange={(value) => setBasic({ ...basic, portfolio_url: value })} placeholder="https://yourportfolio.com" />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Resume" subtitle="Upload one PDF resume. Recruiters receive a secure temporary link.">
            <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-slate-800">{profile?.resume_url ? "Resume uploaded" : "No resume uploaded"}</p>
                <p className="mt-1 text-sm text-slate-500">PDF only, maximum 5 MB.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile?.resume_url && (
                  <a href={profile.resume_url} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">
                    View Resume
                  </a>
                )}
                <label className="cursor-pointer rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">
                  {resumeUploading ? "Uploading..." : profile?.resume_url ? "Replace Resume" : "Upload Resume"}
                  <input type="file" accept="application/pdf,.pdf" className="hidden" disabled={resumeUploading} onChange={(event) => void uploadResume(event.target.files?.[0])} />
                </label>
                {profile?.resume_url && (
                  <button type="button" disabled={resumeDeleting} onClick={() => void removeResume()} className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">
                    {resumeDeleting ? "Removing..." : "Remove"}
                  </button>
                )}
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-800">Save your profile</p>
              <p className="text-xs text-slate-500">You&apos;ll be redirected to your complete recruiter-facing profile.</p>
            </div>
            <button type="button" onClick={() => void saveBasicProfile()} disabled={savingProfile} className="ml-auto rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50">
              {savingProfile ? "Saving..." : "Save & View Profile →"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function EmploymentSection({
  title,
  subtitle,
  items,
  open,
  form,
  setForm,
  editingId,
  saving,
  allowedTypes,
  onAdd,
  onEdit,
  onDelete,
  onSubmit,
  onCancel,
}: {
  title: string;
  subtitle: string;
  items: EmploymentItem[];
  open: boolean;
  form: EmploymentForm;
  setForm: (value: EmploymentForm) => void;
  editingId: number | null;
  saving: boolean;
  allowedTypes: [EmploymentType, string][];
  onAdd: () => void;
  onEdit: (item: EmploymentItem) => void;
  onDelete: (id: number) => void;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <SectionCard title={title} subtitle={subtitle} action={<AddButton onClick={onAdd}>+ Add {title.startsWith("Intern") ? "Internship" : "Experience"}</AddButton>}>
      <div className="space-y-4">
        {items.map((item) => (
          <EntryCard
            key={item.id}
            title={item.role_title}
            subtitle={item.company_name}
            description={item.description}
            meta={[
              prettyLabel(item.employment_type),
              item.work_mode ? prettyLabel(item.work_mode) : null,
              item.location,
              formatDateRange(item.start_date, item.end_date, item.is_current),
              item.skills_used ? `Skills: ${item.skills_used}` : null,
            ]}
            onEdit={() => onEdit(item)}
            onDelete={() => onDelete(item.id)}
          />
        ))}
        {items.length === 0 && <EmptyText>No entries added yet.</EmptyText>}
      </div>

      {open && (
        <form onSubmit={onSubmit} className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Type">
              <Select value={form.employment_type} onChange={(value) => setForm({ ...form, employment_type: value as EmploymentType })}>
                {allowedTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </Select>
            </Field>
            <Field label="Role Title">
              <Input required value={form.role_title} onChange={(value) => setForm({ ...form, role_title: value })} placeholder="LLM Engineer" />
            </Field>
            <Field label="Company / Organisation">
              <Input required value={form.company_name} onChange={(value) => setForm({ ...form, company_name: value })} placeholder="Company name" />
            </Field>
            <Field label="Location">
              <Input value={form.location} onChange={(value) => setForm({ ...form, location: value })} placeholder="Noida" />
            </Field>
            <Field label="Work Mode">
              <Select value={form.work_mode} onChange={(value) => setForm({ ...form, work_mode: value as WorkMode | "" })}>
                <option value="">Select</option>
                <option value="onsite">On-site</option>
                <option value="hybrid">Hybrid</option>
                <option value="remote">Remote</option>
              </Select>
            </Field>
            <Field label="Skills Used">
              <Input value={form.skills_used} onChange={(value) => setForm({ ...form, skills_used: value })} placeholder="Python, FastAPI, RAG" />
            </Field>
            <Field label="Start Date">
              <Input type="date" required value={form.start_date} onChange={(value) => setForm({ ...form, start_date: value })} />
            </Field>
            <Field label="End Date">
              <Input type="date" disabled={form.is_current} value={form.end_date} onChange={(value) => setForm({ ...form, end_date: value })} />
            </Field>
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={form.is_current} onChange={(event) => setForm({ ...form, is_current: event.target.checked, end_date: event.target.checked ? "" : form.end_date })} />
            I currently work here
          </label>
          <div className="mt-4">
            <Field label="Description">
              <Textarea value={form.description} onChange={(value) => setForm({ ...form, description: value })} rows={4} placeholder="Describe your responsibilities, achievements and impact." />
            </Field>
          </div>
          <FormActions loading={saving} onCancel={onCancel} label={editingId ? "Update Entry" : "Add Entry"} />
        </form>
      )}
    </SectionCard>
  );
}

function SectionCard({ title, subtitle, action, children }: { title: string; subtitle: string; action?: ReactNode; children: ReactNode }) {
  const meta = getSectionMeta(title);
  const id = title.toLowerCase().replaceAll("&", "").replaceAll("/", " ").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return (
    <motion.section id={id} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.35 }} className="scroll-mt-28 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/60">
      <div className={`h-1.5 bg-gradient-to-r ${meta.gradient}`} />
      <div className="p-6 sm:p-8">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-lg ${meta.iconClass}`}>{meta.icon}</div>
            <div>
              <h2 className="text-xl font-black text-slate-950">{title}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>
            </div>
          </div>
          {action}
        </div>
        <div className="pt-6">{children}</div>
      </div>
    </motion.section>
  );
}

function EntryCard({ title, subtitle, description, meta, onEdit, onDelete }: { title: string; subtitle?: string | null; description?: string | null; meta: (string | null | undefined)[]; onEdit: () => void; onDelete: () => void }) {
  return (
    <motion.article whileHover={{ y: -3 }} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm transition hover:border-blue-200 hover:shadow-lg">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="mt-1 font-medium text-slate-600">{subtitle}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {meta.filter(Boolean).map((item, index) => <span key={`${item}-${index}`} className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-slate-500">{item}</span>)}
          </div>
          {description && <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600">{description}</p>}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onEdit} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-blue-600">Edit</button>
          <button type="button" onClick={onDelete} className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">Delete</button>
        </div>
      </div>
    </motion.article>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function Input({ value, onChange, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> & { value: string; onChange: (value: string) => void }) {
  return <input {...props} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100" />;
}

function Textarea({ value, onChange, ...props }: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> & { value: string; onChange: (value: string) => void }) {
  return <textarea {...props} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm leading-6 outline-none transition placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" />;
}

function Select({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: ReactNode }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition hover:border-slate-300 hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100">{children}</select>;
}

function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return <button type="button" onClick={onClick} className="w-fit rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-lg">{children}</button>;
}

function FormActions({ loading, onCancel, label }: { loading: boolean; onCancel: () => void; label: string }) {
  return (
    <div className="mt-5 flex flex-wrap justify-end gap-2">
      <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600">Cancel</button>
      <button type="submit" disabled={loading} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{loading ? "Saving..." : label}</button>
    </div>
  );
}

function Alert({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  return <div className={`rounded-xl border p-4 text-sm ${tone === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{children}</div>;
}

function EmptyText({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white px-4 py-8 text-center text-sm text-slate-400">{children}</p>;
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-center">
      <p className="text-lg font-black text-white">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300">{label}</p>
    </div>
  );
}

function getSectionMeta(title: string) {
  if (title.startsWith("Basic")) return { icon: "👤", iconClass: "bg-blue-50", gradient: "from-blue-500 via-cyan-400 to-blue-500" };
  if (title.startsWith("Contact")) return { icon: "☎", iconClass: "bg-emerald-50", gradient: "from-emerald-500 via-teal-400 to-cyan-400" };
  if (title === "Skills") return { icon: "⚡", iconClass: "bg-amber-50", gradient: "from-amber-400 via-orange-400 to-rose-400" };
  if (title.startsWith("Verified")) return { icon: "🧠", iconClass: "bg-violet-50", gradient: "from-violet-500 via-fuchsia-500 to-pink-500" };
  if (title === "Education") return { icon: "🎓", iconClass: "bg-indigo-50", gradient: "from-indigo-500 via-blue-500 to-cyan-400" };
  if (title === "Experience") return { icon: "💼", iconClass: "bg-sky-50", gradient: "from-sky-500 via-blue-500 to-indigo-500" };
  if (title.startsWith("Intern")) return { icon: "🌱", iconClass: "bg-lime-50", gradient: "from-lime-400 via-emerald-400 to-teal-400" };
  if (title === "Projects") return { icon: "🚀", iconClass: "bg-rose-50", gradient: "from-rose-500 via-orange-400 to-amber-400" };
  if (title.startsWith("Professional")) return { icon: "🔗", iconClass: "bg-cyan-50", gradient: "from-cyan-400 via-blue-500 to-violet-500" };
  if (title === "Resume") return { icon: "📄", iconClass: "bg-slate-100", gradient: "from-slate-700 via-slate-500 to-blue-500" };
  return { icon: "✨", iconClass: "bg-blue-50", gradient: "from-blue-500 to-violet-500" };
}

function prettyLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatYearRange(start: number | null, end: number | null, current: boolean) {
  if (!start && !end) return null;
  return `${start || ""} - ${current ? "Present" : end || ""}`;
}

function formatScore(type: ScoreType | null, value: number | null) {
  if (value == null) return null;
  if (type === "percentage") return `${value}%`;
  if (type === "cgpa_10") return `CGPA: ${value}/10`;
  if (type === "cgpa_4") return `CGPA: ${value}/4`;
  return type ? `${prettyLabel(type)}: ${value}` : String(value);
}

function formatDateRange(start: string, end: string | null, current: boolean) {
  const startText = formatMonthYear(start);
  const endText = current ? "Present" : formatMonthYear(end);
  return `${startText} - ${endText}`;
}

function formatMonthYear(value: string | null) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}
