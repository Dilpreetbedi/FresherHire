"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  resume_headline: string | null;
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

type EducationForm = {
  education_level: Education["education_level"];
  institution_name: string;
  board_or_university: string;
  degree_or_course: string;
  specialization: string;
  start_year: string;
  end_year: string;
  score_type: NonNullable<Education["score_type"]> | "";
  score_value: string;
  location: string;
  is_current: boolean;
};

type EmploymentForm = {
  employment_type: Employment["employment_type"];
  company_name: string;
  role_title: string;
  location: string;
  work_mode: NonNullable<Employment["work_mode"]> | "";
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
  skills_used: string;
};

const EMPTY_EDUCATION_FORM: EducationForm = {
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

const EMPTY_EMPLOYMENT_FORM: EmploymentForm = {
  employment_type: "internship",
  company_name: "",
  role_title: "",
  location: "",
  work_mode: "",
  start_date: "",
  end_date: "",
  is_current: false,
  description: "",
  skills_used: "",
};

export default function Dashboard() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [assessments, setAssessments] = useState<AssessmentResult[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [employment, setEmployment] = useState<Employment[]>([]);

  const [loading, setLoading] = useState(true);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneMessage, setPhoneMessage] = useState("");

  const [resumeHeadline, setResumeHeadline] = useState("");
  const [headlineSaving, setHeadlineSaving] = useState(false);
  const [headlineMessage, setHeadlineMessage] = useState("");

  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeMessage, setResumeMessage] = useState("");
  const [resumeSignedUrl, setResumeSignedUrl] = useState<string | null>(null);

  const [showEducationForm, setShowEducationForm] = useState(false);
  const [educationForm, setEducationForm] =
    useState<EducationForm>(EMPTY_EDUCATION_FORM);
  const [educationEditingId, setEducationEditingId] =
    useState<number | null>(null);
  const [educationSaving, setEducationSaving] = useState(false);
  const [educationMessage, setEducationMessage] = useState("");

  const [showEmploymentForm, setShowEmploymentForm] = useState(false);
  const [employmentForm, setEmploymentForm] =
    useState<EmploymentForm>(EMPTY_EMPLOYMENT_FORM);
  const [employmentEditingId, setEmploymentEditingId] =
    useState<number | null>(null);
  const [employmentSaving, setEmploymentSaving] = useState(false);
  const [employmentMessage, setEmploymentMessage] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  function getResumeStoragePath(
    resumeValue: string | null,
    userId: string
  ) {
    if (!resumeValue) return null;
    if (!resumeValue.startsWith("http")) return resumeValue;

    const marker = "/resumes/";
    const markerIndex = resumeValue.indexOf(marker);

    if (markerIndex !== -1) {
      const path = resumeValue.slice(markerIndex + marker.length);

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
    const filePath = getResumeStoragePath(resumeValue, userId);

    if (!filePath) {
      setResumeSignedUrl(null);
      return;
    }

    const { data, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(filePath, 60 * 10);

    if (error) {
      console.error("Resume signed URL error:", error);
      setResumeSignedUrl(null);
      return;
    }

    setResumeSignedUrl(data.signedUrl);
  }

  async function loadDashboard() {
    setLoading(true);

    try {
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

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile error:", profileError);
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
        educationResult,
        employmentResult,
      ] = await Promise.all([
        supabase
          .from("skills")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("assessment_results")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("projects")
          .select("id")
          .eq("user_id", user.id),

        supabase
          .from("education_details")
          .select("*")
          .eq("user_id", user.id)
          .order("end_year", { ascending: false, nullsFirst: true }),

        supabase
          .from("employment_details")
          .select("*")
          .eq("user_id", user.id)
          .order("start_date", { ascending: false }),
      ]);

      if (skillsResult.error) {
        console.error("Skills error:", skillsResult.error);
      }

      if (assessmentResult.error) {
        console.error("Assessment error:", assessmentResult.error);
      }

      if (projectsResult.error) {
        console.error("Projects error:", projectsResult.error);
      }

      if (educationResult.error) {
        console.error("Education error:", educationResult.error);
      }

      if (employmentResult.error) {
        console.error("Employment error:", employmentResult.error);
      }

      setProfile(profileData);
      setPhoneNumber(profileData.phone_number || "");
      setResumeHeadline(profileData.resume_headline || "");

      await createResumeSignedUrl(profileData.resume_url, user.id);

      setSkills(skillsResult.data || []);
      setAssessments(assessmentResult.data || []);
      setProjects(projectsResult.data || []);
      setEducation(educationResult.data || []);
      setEmployment(employmentResult.data || []);

      setLoading(false);
    } catch (err) {
      console.error("Dashboard load error:", err);
      setLoading(false);
    }
  }

  const bestAssessmentResults = useMemo(() => {
    const bestByAssessment = new Map<string, AssessmentResult>();

    for (const assessment of assessments) {
      const key = assessment.skill_name.trim().toLowerCase();
      const current = bestByAssessment.get(key);

      if (!current || assessment.percentage > current.percentage) {
        bestByAssessment.set(key, assessment);
      }
    }

    return Array.from(bestByAssessment.values()).sort(
      (a, b) => b.percentage - a.percentage
    );
  }, [assessments]);

  const verifiedAssessmentCount = bestAssessmentResults.filter(
    (assessment) => assessment.percentage >= 75
  ).length;

  const basicProfileComplete = Boolean(
    profile?.full_name &&
      profile?.email &&
      profile?.phone_number &&
      profile?.degree &&
      profile?.graduation_year &&
      profile?.location &&
      profile?.preferred_role
  );

  const hasHeadline = Boolean(profile?.resume_headline?.trim());
  const hasEducation = education.length > 0;
  const hasSkills = skills.length > 0;
  const hasAssessment = assessments.length > 0;
  const hasProject = projects.length > 0;
  const hasResume = Boolean(profile?.resume_url);

  const completionItems = [
    {
      name: "Basic Profile",
      completed: basicProfileComplete,
      href: "#profile",
      description:
        "Complete your contact details, qualification, location and preferred role.",
    },
    {
      name: "Resume Headline",
      completed: hasHeadline,
      href: "#resume-headline",
      description:
        "Add a short professional headline recruiters can understand quickly.",
    },
    {
      name: "Education",
      completed: hasEducation,
      href: "#education",
      description:
        "Add school, college, diploma or higher-education details.",
    },
    {
      name: "Add Skills",
      completed: hasSkills,
      href: "/skills",
      description: "Add at least one skill relevant to the roles you want.",
    },
    {
      name: "Complete Assessment",
      completed: hasAssessment,
      href: "/assessments",
      description: "Complete at least one role-relevant assessment.",
    },
    {
      name: "Add Project / Work Sample",
      completed: hasProject,
      href: "/projects",
      description:
        "Show practical work, projects, case studies or portfolio evidence.",
    },
    {
      name: "Upload Resume",
      completed: hasResume,
      href: "#resume",
      description: "Upload your latest resume as a PDF.",
    },
  ];

  const completedItems = completionItems.filter((item) => item.completed).length;

  const profileStrength = Math.round(
    (completedItems / completionItems.length) * 100
  );

  function getProfileStrengthText() {
    if (profileStrength === 100) return "Excellent";
    if (profileStrength >= 80) return "Strong";
    if (profileStrength >= 60) return "Good";
    if (profileStrength >= 40) return "Getting There";
    return "Getting Started";
  }

  async function savePhoneNumber() {
    if (phoneSaving) return;

    const normalizedPhone = phoneNumber.trim();

    if (!normalizedPhone) {
      setPhoneMessage("Please enter your phone number.");
      return;
    }

    if (!/^\+?[0-9\s()-]{7,20}$/.test(normalizedPhone)) {
      setPhoneMessage("Please enter a valid phone number.");
      return;
    }

    setPhoneSaving(true);
    setPhoneMessage("");

    try {
      const auth = await requireFresher();

      if (!auth.allowed) {
        setPhoneSaving(false);
        router.replace(auth.redirectTo!);
        return;
      }

      const user = auth.user;

      if (!user) {
        setPhoneSaving(false);
        router.replace("/login");
        return;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ phone_number: normalizedPhone })
        .eq("id", user.id);

      if (updateError) {
        console.error("Phone update error:", updateError);
        setPhoneMessage(updateError.message || "Could not save phone number.");
        setPhoneSaving(false);
        return;
      }

      setProfile((current) =>
        current
          ? {
              ...current,
              phone_number: normalizedPhone,
            }
          : current
      );

      setPhoneNumber(normalizedPhone);
      setPhoneMessage("Phone number saved successfully.");
    } catch (err) {
      console.error("Phone save error:", err);
      setPhoneMessage(
        err instanceof Error ? err.message : "Could not save phone number."
      );
    }

    setPhoneSaving(false);
  }

  async function saveResumeHeadline() {
    if (headlineSaving) return;

    const headline = resumeHeadline.trim();

    if (!headline) {
      setHeadlineMessage("Please enter your resume headline.");
      return;
    }

    if (headline.length > 220) {
      setHeadlineMessage("Resume headline must be 220 characters or less.");
      return;
    }

    setHeadlineSaving(true);
    setHeadlineMessage("");

    try {
      const auth = await requireFresher();

      if (!auth.allowed) {
        setHeadlineSaving(false);
        router.replace(auth.redirectTo!);
        return;
      }

      const user = auth.user;

      if (!user) {
        setHeadlineSaving(false);
        router.replace("/login");
        return;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ resume_headline: headline })
        .eq("id", user.id);

      if (updateError) {
        console.error("Headline update error:", updateError);
        setHeadlineMessage(
          updateError.message || "Could not save resume headline."
        );
        setHeadlineSaving(false);
        return;
      }

      setProfile((current) =>
        current
          ? {
              ...current,
              resume_headline: headline,
            }
          : current
      );

      setResumeHeadline(headline);
      setHeadlineMessage("Resume headline saved successfully.");
    } catch (err) {
      console.error("Headline save error:", err);
      setHeadlineMessage(
        err instanceof Error ? err.message : "Could not save resume headline."
      );
    }

    setHeadlineSaving(false);
  }

  function openNewEducationForm() {
    setEducationEditingId(null);
    setEducationForm(EMPTY_EDUCATION_FORM);
    setEducationMessage("");
    setShowEducationForm(true);
  }

  function openEditEducationForm(item: Education) {
    setEducationEditingId(item.id);
    setEducationForm({
      education_level: item.education_level,
      institution_name: item.institution_name || "",
      board_or_university: item.board_or_university || "",
      degree_or_course: item.degree_or_course || "",
      specialization: item.specialization || "",
      start_year: item.start_year ? String(item.start_year) : "",
      end_year: item.end_year ? String(item.end_year) : "",
      score_type: item.score_type || "",
      score_value:
        item.score_value !== null && item.score_value !== undefined
          ? String(item.score_value)
          : "",
      location: item.location || "",
      is_current: item.is_current,
    });
    setEducationMessage("");
    setShowEducationForm(true);
  }

  function closeEducationForm() {
    if (educationSaving) return;
    setShowEducationForm(false);
    setEducationEditingId(null);
    setEducationForm(EMPTY_EDUCATION_FORM);
    setEducationMessage("");
  }

  async function saveEducation() {
    if (educationSaving) return;

    const institution = educationForm.institution_name.trim();

    if (!institution) {
      setEducationMessage("Please enter the institution name.");
      return;
    }

    const startYear = educationForm.start_year
      ? Number(educationForm.start_year)
      : null;

    const endYear =
      educationForm.is_current || !educationForm.end_year
        ? null
        : Number(educationForm.end_year);

    if (
      startYear !== null &&
      (!Number.isInteger(startYear) || startYear < 1950 || startYear > 2100)
    ) {
      setEducationMessage("Please enter a valid start year.");
      return;
    }

    if (
      endYear !== null &&
      (!Number.isInteger(endYear) || endYear < 1950 || endYear > 2100)
    ) {
      setEducationMessage("Please enter a valid end year.");
      return;
    }

    if (
      startYear !== null &&
      endYear !== null &&
      endYear < startYear
    ) {
      setEducationMessage("End year cannot be earlier than start year.");
      return;
    }

    const scoreValue = educationForm.score_value
      ? Number(educationForm.score_value)
      : null;

    if (
      scoreValue !== null &&
      (Number.isNaN(scoreValue) || scoreValue < 0)
    ) {
      setEducationMessage("Please enter a valid score.");
      return;
    }

    setEducationSaving(true);
    setEducationMessage("");

    try {
      const auth = await requireFresher();

      if (!auth.allowed) {
        setEducationSaving(false);
        router.replace(auth.redirectTo!);
        return;
      }

      const user = auth.user;

      if (!user) {
        setEducationSaving(false);
        router.replace("/login");
        return;
      }

      const payload = {
        user_id: user.id,
        education_level: educationForm.education_level,
        institution_name: institution,
        board_or_university:
          educationForm.board_or_university.trim() || null,
        degree_or_course: educationForm.degree_or_course.trim() || null,
        specialization: educationForm.specialization.trim() || null,
        start_year: startYear,
        end_year: endYear,
        score_type: educationForm.score_type || null,
        score_value: scoreValue,
        location: educationForm.location.trim() || null,
        is_current: educationForm.is_current,
        updated_at: new Date().toISOString(),
      };

      if (educationEditingId) {
        const { data, error: updateError } = await supabase
          .from("education_details")
          .update(payload)
          .eq("id", educationEditingId)
          .eq("user_id", user.id)
          .select("*")
          .single();

        if (updateError) {
          console.error("Education update error:", updateError);
          setEducationMessage(
            updateError.message || "Could not update education."
          );
          setEducationSaving(false);
          return;
        }

        setEducation((current) =>
          current.map((item) =>
            item.id === educationEditingId ? data : item
          )
        );
      } else {
        const { data, error: insertError } = await supabase
          .from("education_details")
          .insert(payload)
          .select("*")
          .single();

        if (insertError) {
          console.error("Education insert error:", insertError);
          setEducationMessage(
            insertError.message || "Could not add education."
          );
          setEducationSaving(false);
          return;
        }

        setEducation((current) => [data, ...current]);
      }

      setEducationMessage(
        educationEditingId
          ? "Education updated successfully."
          : "Education added successfully."
      );

      setEducationEditingId(null);
      setEducationForm(EMPTY_EDUCATION_FORM);

      window.setTimeout(() => {
        setShowEducationForm(false);
        setEducationMessage("");
      }, 700);
    } catch (err) {
      console.error("Education save error:", err);
      setEducationMessage(
        err instanceof Error ? err.message : "Could not save education."
      );
    }

    setEducationSaving(false);
  }

  async function deleteEducation(id: number) {
    const confirmed = window.confirm(
      "Delete this education entry?"
    );

    if (!confirmed) return;

    try {
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

      const { error } = await supabase
        .from("education_details")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Education delete error:", error);
        window.alert(error.message || "Could not delete education.");
        return;
      }

      setEducation((current) =>
        current.filter((item) => item.id !== id)
      );
    } catch (err) {
      console.error("Education delete error:", err);
      window.alert("Could not delete education.");
    }
  }

  function openNewEmploymentForm() {
    setEmploymentEditingId(null);
    setEmploymentForm(EMPTY_EMPLOYMENT_FORM);
    setEmploymentMessage("");
    setShowEmploymentForm(true);
  }

  function openEditEmploymentForm(item: Employment) {
    setEmploymentEditingId(item.id);
    setEmploymentForm({
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
    });
    setEmploymentMessage("");
    setShowEmploymentForm(true);
  }

  function closeEmploymentForm() {
    if (employmentSaving) return;
    setShowEmploymentForm(false);
    setEmploymentEditingId(null);
    setEmploymentForm(EMPTY_EMPLOYMENT_FORM);
    setEmploymentMessage("");
  }

  async function saveEmployment() {
    if (employmentSaving) return;

    const companyName = employmentForm.company_name.trim();
    const roleTitle = employmentForm.role_title.trim();

    if (!companyName) {
      setEmploymentMessage("Please enter the company or organisation name.");
      return;
    }

    if (!roleTitle) {
      setEmploymentMessage("Please enter your role or designation.");
      return;
    }

    if (!employmentForm.start_date) {
      setEmploymentMessage("Please select a start date.");
      return;
    }

    if (
      !employmentForm.is_current &&
      employmentForm.end_date &&
      employmentForm.end_date < employmentForm.start_date
    ) {
      setEmploymentMessage("End date cannot be earlier than start date.");
      return;
    }

    setEmploymentSaving(true);
    setEmploymentMessage("");

    try {
      const auth = await requireFresher();

      if (!auth.allowed) {
        setEmploymentSaving(false);
        router.replace(auth.redirectTo!);
        return;
      }

      const user = auth.user;

      if (!user) {
        setEmploymentSaving(false);
        router.replace("/login");
        return;
      }

      const payload = {
        user_id: user.id,
        employment_type: employmentForm.employment_type,
        company_name: companyName,
        role_title: roleTitle,
        location: employmentForm.location.trim() || null,
        work_mode: employmentForm.work_mode || null,
        start_date: employmentForm.start_date,
        end_date: employmentForm.is_current
          ? null
          : employmentForm.end_date || null,
        is_current: employmentForm.is_current,
        description: employmentForm.description.trim() || null,
        skills_used: employmentForm.skills_used.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (employmentEditingId) {
        const { data, error: updateError } = await supabase
          .from("employment_details")
          .update(payload)
          .eq("id", employmentEditingId)
          .eq("user_id", user.id)
          .select("*")
          .single();

        if (updateError) {
          console.error("Employment update error:", updateError);
          setEmploymentMessage(
            updateError.message || "Could not update experience."
          );
          setEmploymentSaving(false);
          return;
        }

        setEmployment((current) =>
          current.map((item) =>
            item.id === employmentEditingId ? data : item
          )
        );
      } else {
        const { data, error: insertError } = await supabase
          .from("employment_details")
          .insert(payload)
          .select("*")
          .single();

        if (insertError) {
          console.error("Employment insert error:", insertError);
          setEmploymentMessage(
            insertError.message || "Could not add experience."
          );
          setEmploymentSaving(false);
          return;
        }

        setEmployment((current) => [data, ...current]);
      }

      setEmploymentMessage(
        employmentEditingId
          ? "Experience updated successfully."
          : "Experience added successfully."
      );

      setEmploymentEditingId(null);
      setEmploymentForm(EMPTY_EMPLOYMENT_FORM);

      window.setTimeout(() => {
        setShowEmploymentForm(false);
        setEmploymentMessage("");
      }, 700);
    } catch (err) {
      console.error("Employment save error:", err);
      setEmploymentMessage(
        err instanceof Error ? err.message : "Could not save experience."
      );
    }

    setEmploymentSaving(false);
  }

  async function deleteEmployment(id: number) {
    const confirmed = window.confirm(
      "Delete this employment or internship entry?"
    );

    if (!confirmed) return;

    try {
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

      const { error } = await supabase
        .from("employment_details")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Employment delete error:", error);
        window.alert(error.message || "Could not delete experience.");
        return;
      }

      setEmployment((current) =>
        current.filter((item) => item.id !== id)
      );
    } catch (err) {
      console.error("Employment delete error:", err);
      window.alert("Could not delete experience.");
    }
  }

  async function uploadResume(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setResumeMessage("");

    if (file.type !== "application/pdf") {
      setResumeMessage("Please upload a PDF file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setResumeMessage("Resume must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    setResumeUploading(true);

    const auth = await requireFresher();

    if (!auth.allowed) {
      setResumeUploading(false);
      router.replace(auth.redirectTo!);
      return;
    }

    const user = auth.user;

    if (!user) {
      setResumeMessage("Please log in before uploading your resume.");
      setResumeUploading(false);
      router.replace("/login");
      return;
    }

    const filePath = `${user.id}/resume.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: "application/pdf",
      });

    if (uploadError) {
      console.error("Resume upload error:", uploadError);
      setResumeMessage(uploadError.message);
      setResumeUploading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ resume_url: filePath })
      .eq("id", user.id);

    if (updateError) {
      console.error("Profile update error:", updateError);
      setResumeMessage(updateError.message);
      setResumeUploading(false);
      return;
    }

    setProfile((current) =>
      current
        ? {
            ...current,
            resume_url: filePath,
          }
        : current
    );

    await createResumeSignedUrl(filePath, user.id);

    setResumeMessage("Resume uploaded successfully.");
    setResumeUploading(false);
    event.target.value = "";
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
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

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <div className="text-center">
          <p className="font-semibold">Loading dashboard...</p>
          <p className="mt-2 text-sm text-slate-500">Preparing your profile</p>
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
            Fresher<span className="text-blue-600">Hire</span>
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
              Welcome, {profile?.full_name || "Candidate"} 👋
            </h1>

            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              Build a complete fresher profile with education, experience,
              skills, assessments, work samples and your resume.
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
                  style={{ width: `${profileStrength}%` }}
                />
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">
                {profileStrength === 100
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
                    Give recruiters more context and evidence before they open your resume.
                  </p>
                </div>

                <span className="w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  {completedItems}/{completionItems.length} complete
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {completionItems.map((item) => (
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
                        {item.completed ? "✓" : "○"}
                      </div>

                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            item.completed ? "text-green-800" : "text-slate-900"
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
                ))}
              </div>
            </div>
          </div>
        </section>

        <div id="profile" className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                Your Profile
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Keep your basic information accurate and up to date.
              </p>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Info label="Name" value={profile?.full_name} />
              <Info label="Email" value={profile?.email} />

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
                      setPhoneNumber(event.target.value);
                      setPhoneMessage("");
                    }}
                    placeholder="+91 98765 43210"
                    autoComplete="tel"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    onClick={savePhoneNumber}
                    disabled={phoneSaving}
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
                      phoneMessage.includes("successfully")
                        ? "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    {phoneMessage}
                  </p>
                )}
              </div>

              <Info label="Degree / Qualification" value={profile?.degree} />
              <Info
                label="Graduation"
                value={String(profile?.graduation_year || "")}
              />
              <Info label="Location" value={profile?.location} />
              <Info label="Preferred Role" value={profile?.preferred_role} />
            </div>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              Profile Status
            </p>

            <h2 className="mt-4 text-2xl font-bold text-slate-950">
              {profileStrength === 100
                ? "Profile Complete"
                : profileStrength >= 60
                ? "Profile Active"
                : "Getting Started"}
            </h2>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              {profileStrength === 100
                ? "Your profile has the key information and evidence recruiters need."
                : `${100 - profileStrength}% remaining to complete your profile.`}
            </p>

            {employment.length === 0 && (
              <p className="mt-4 rounded-xl border border-blue-200 bg-white/70 p-3 text-xs leading-5 text-slate-600">
                Employment or internship history is optional. Add it if you have
                any professional, freelance or apprenticeship experience.
              </p>
            )}

            <Link
              href="/assessments"
              className="mt-6 block w-full rounded-xl bg-blue-600 px-5 py-3 text-center font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Strengthen Profile →
            </Link>
          </div>
        </div>

        <section
          id="resume-headline"
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              Resume Headline
            </p>

            <h2 className="text-2xl font-bold text-slate-950">
              Tell recruiters who you are in one line
            </h2>

            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Keep it concise and role-focused. Example: B.Tech CSE graduate
              skilled in Python, AI/ML and FastAPI seeking entry-level AI roles.
            </p>
          </div>

          <div className="mt-5">
            <textarea
              value={resumeHeadline}
              onChange={(event) => {
                setResumeHeadline(event.target.value);
                setHeadlineMessage("");
              }}
              rows={3}
              maxLength={220}
              placeholder="Example: B.Com graduate with internship experience in sales and customer engagement seeking entry-level business development roles."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-slate-500">
                {resumeHeadline.length}/220 characters
              </span>

              <button
                type="button"
                onClick={saveResumeHeadline}
                disabled={headlineSaving}
                className="w-fit rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {headlineSaving ? "Saving..." : "Save Headline"}
              </button>
            </div>

            {headlineMessage && (
              <p
                className={`mt-3 text-sm font-medium ${
                  headlineMessage.includes("successfully")
                    ? "text-green-700"
                    : "text-red-700"
                }`}
              >
                {headlineMessage}
              </p>
            )}
          </div>
        </section>

        <section
          id="employment"
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
                Experience
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                Employment & Internships
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Add full-time work, internships, part-time roles, freelance
                projects, contract work or apprenticeships.
              </p>
            </div>

            <button
              type="button"
              onClick={openNewEmploymentForm}
              className="w-fit rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              + Add Experience
            </button>
          </div>

          {showEmploymentForm && (
            <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/50 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-slate-950">
                  {employmentEditingId
                    ? "Edit Experience"
                    : "Add Employment / Internship"}
                </h3>

                <button
                  type="button"
                  onClick={closeEmploymentForm}
                  className="text-sm font-semibold text-slate-500 hover:text-slate-900"
                >
                  Cancel
                </button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <FormField label="Employment Type">
                  <select
                    value={employmentForm.employment_type}
                    onChange={(event) =>
                      setEmploymentForm((current) => ({
                        ...current,
                        employment_type:
                          event.target.value as Employment["employment_type"],
                      }))
                    }
                    className={inputClassName}
                  >
                    <option value="full_time">Full Time</option>
                    <option value="internship">Internship</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="freelance">Freelance</option>
                    <option value="apprenticeship">Apprenticeship</option>
                    <option value="other">Other</option>
                  </select>
                </FormField>

                <FormField label="Company / Organisation">
                  <input
                    value={employmentForm.company_name}
                    onChange={(event) =>
                      setEmploymentForm((current) => ({
                        ...current,
                        company_name: event.target.value,
                      }))
                    }
                    placeholder="Company name"
                    className={inputClassName}
                  />
                </FormField>

                <FormField label="Role / Designation">
                  <input
                    value={employmentForm.role_title}
                    onChange={(event) =>
                      setEmploymentForm((current) => ({
                        ...current,
                        role_title: event.target.value,
                      }))
                    }
                    placeholder="AI Intern, Sales Executive, HR Intern..."
                    className={inputClassName}
                  />
                </FormField>

                <FormField label="Location">
                  <input
                    value={employmentForm.location}
                    onChange={(event) =>
                      setEmploymentForm((current) => ({
                        ...current,
                        location: event.target.value,
                      }))
                    }
                    placeholder="Noida, Bengaluru, Remote..."
                    className={inputClassName}
                  />
                </FormField>

                <FormField label="Work Mode">
                  <select
                    value={employmentForm.work_mode}
                    onChange={(event) =>
                      setEmploymentForm((current) => ({
                        ...current,
                        work_mode: event.target.value as EmploymentForm["work_mode"],
                      }))
                    }
                    className={inputClassName}
                  >
                    <option value="">Select work mode</option>
                    <option value="onsite">Onsite</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="remote">Remote</option>
                  </select>
                </FormField>

                <FormField label="Start Date">
                  <input
                    type="date"
                    value={employmentForm.start_date}
                    onChange={(event) =>
                      setEmploymentForm((current) => ({
                        ...current,
                        start_date: event.target.value,
                      }))
                    }
                    className={inputClassName}
                  />
                </FormField>

                <FormField label="End Date">
                  <input
                    type="date"
                    value={employmentForm.end_date}
                    disabled={employmentForm.is_current}
                    onChange={(event) =>
                      setEmploymentForm((current) => ({
                        ...current,
                        end_date: event.target.value,
                      }))
                    }
                    className={`${inputClassName} disabled:bg-slate-100 disabled:text-slate-400`}
                  />
                </FormField>

                <div className="flex items-end">
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={employmentForm.is_current}
                      onChange={(event) =>
                        setEmploymentForm((current) => ({
                          ...current,
                          is_current: event.target.checked,
                          end_date: event.target.checked
                            ? ""
                            : current.end_date,
                        }))
                      }
                      className="h-4 w-4"
                    />
                    I currently work here
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <FormField label="Description / Responsibilities">
                    <textarea
                      rows={4}
                      value={employmentForm.description}
                      onChange={(event) =>
                        setEmploymentForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      placeholder="What did you work on? Mention responsibilities, impact, achievements or results."
                      className={inputClassName}
                    />
                  </FormField>
                </div>

                <div className="sm:col-span-2">
                  <FormField label="Skills Used">
                    <input
                      value={employmentForm.skills_used}
                      onChange={(event) =>
                        setEmploymentForm((current) => ({
                          ...current,
                          skills_used: event.target.value,
                        }))
                      }
                      placeholder="Python, Sales, Excel, Recruiting, React..."
                      className={inputClassName}
                    />
                  </FormField>
                </div>
              </div>

              {employmentMessage && (
                <p
                  className={`mt-4 text-sm font-medium ${
                    employmentMessage.includes("successfully")
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  {employmentMessage}
                </p>
              )}

              <button
                type="button"
                onClick={saveEmployment}
                disabled={employmentSaving}
                className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {employmentSaving
                  ? "Saving..."
                  : employmentEditingId
                  ? "Update Experience"
                  : "Save Experience"}
              </button>
            </div>
          )}

          {employment.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="font-medium text-slate-900">
                No employment or internship added
              </p>

              <p className="mt-2 text-sm text-slate-500">
                This is optional for freshers. Add internships, apprenticeships,
                freelance work or employment if you have any.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {employment.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
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
                        <p className="mt-3 text-xs leading-5 text-slate-500">
                          <span className="font-semibold text-slate-700">
                            Skills:
                          </span>{" "}
                          {item.skills_used}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => openEditEmploymentForm(item)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteEmployment(item.id)}
                        className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section
          id="education"
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
                Education
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                Education Details
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Add Class X, Class XII, diploma, college, bachelor&apos;s,
                master&apos;s or other education details.
              </p>
            </div>

            <button
              type="button"
              onClick={openNewEducationForm}
              className="w-fit rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              + Add Education
            </button>
          </div>

          {showEducationForm && (
            <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/50 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-slate-950">
                  {educationEditingId
                    ? "Edit Education"
                    : "Add Education"}
                </h3>

                <button
                  type="button"
                  onClick={closeEducationForm}
                  className="text-sm font-semibold text-slate-500 hover:text-slate-900"
                >
                  Cancel
                </button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <FormField label="Education Level">
                  <select
                    value={educationForm.education_level}
                    onChange={(event) =>
                      setEducationForm((current) => ({
                        ...current,
                        education_level:
                          event.target.value as Education["education_level"],
                      }))
                    }
                    className={inputClassName}
                  >
                    <option value="10th">Class X / 10th</option>
                    <option value="12th">Class XII / 12th</option>
                    <option value="diploma">Diploma</option>
                    <option value="bachelors">Bachelor&apos;s</option>
                    <option value="masters">Master&apos;s</option>
                    <option value="doctorate">Doctorate / PhD</option>
                    <option value="other">Other</option>
                  </select>
                </FormField>

                <FormField label="Institution / School / College">
                  <input
                    value={educationForm.institution_name}
                    onChange={(event) =>
                      setEducationForm((current) => ({
                        ...current,
                        institution_name: event.target.value,
                      }))
                    }
                    placeholder="School or college name"
                    className={inputClassName}
                  />
                </FormField>

                <FormField label="Board / University">
                  <input
                    value={educationForm.board_or_university}
                    onChange={(event) =>
                      setEducationForm((current) => ({
                        ...current,
                        board_or_university: event.target.value,
                      }))
                    }
                    placeholder="CBSE, ICSE, Chandigarh University..."
                    className={inputClassName}
                  />
                </FormField>

                <FormField label="Degree / Course">
                  <input
                    value={educationForm.degree_or_course}
                    onChange={(event) =>
                      setEducationForm((current) => ({
                        ...current,
                        degree_or_course: event.target.value,
                      }))
                    }
                    placeholder="B.Tech, B.Com, MBA, Science..."
                    className={inputClassName}
                  />
                </FormField>

                <FormField label="Specialization">
                  <input
                    value={educationForm.specialization}
                    onChange={(event) =>
                      setEducationForm((current) => ({
                        ...current,
                        specialization: event.target.value,
                      }))
                    }
                    placeholder="Computer Science, Finance, Marketing..."
                    className={inputClassName}
                  />
                </FormField>

                <FormField label="Location">
                  <input
                    value={educationForm.location}
                    onChange={(event) =>
                      setEducationForm((current) => ({
                        ...current,
                        location: event.target.value,
                      }))
                    }
                    placeholder="Chandigarh, Bareilly..."
                    className={inputClassName}
                  />
                </FormField>

                <FormField label="Start Year">
                  <input
                    type="number"
                    min="1950"
                    max="2100"
                    value={educationForm.start_year}
                    onChange={(event) =>
                      setEducationForm((current) => ({
                        ...current,
                        start_year: event.target.value,
                      }))
                    }
                    placeholder="2021"
                    className={inputClassName}
                  />
                </FormField>

                <FormField label="End Year">
                  <input
                    type="number"
                    min="1950"
                    max="2100"
                    disabled={educationForm.is_current}
                    value={educationForm.end_year}
                    onChange={(event) =>
                      setEducationForm((current) => ({
                        ...current,
                        end_year: event.target.value,
                      }))
                    }
                    placeholder="2025"
                    className={`${inputClassName} disabled:bg-slate-100 disabled:text-slate-400`}
                  />
                </FormField>

                <FormField label="Score Type">
                  <select
                    value={educationForm.score_type}
                    onChange={(event) =>
                      setEducationForm((current) => ({
                        ...current,
                        score_type:
                          event.target.value as EducationForm["score_type"],
                      }))
                    }
                    className={inputClassName}
                  >
                    <option value="">Select score type</option>
                    <option value="percentage">Percentage</option>
                    <option value="cgpa_10">CGPA out of 10</option>
                    <option value="cgpa_4">CGPA out of 4</option>
                    <option value="other">Other numeric score</option>
                  </select>
                </FormField>

                <FormField label="Score">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={educationForm.score_value}
                    onChange={(event) =>
                      setEducationForm((current) => ({
                        ...current,
                        score_value: event.target.value,
                      }))
                    }
                    placeholder="90.4 or 8.2"
                    className={inputClassName}
                  />
                </FormField>

                <div className="sm:col-span-2">
                  <label className="flex w-fit cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={educationForm.is_current}
                      onChange={(event) =>
                        setEducationForm((current) => ({
                          ...current,
                          is_current: event.target.checked,
                          end_year: event.target.checked
                            ? ""
                            : current.end_year,
                        }))
                      }
                      className="h-4 w-4"
                    />
                    I am currently studying here
                  </label>
                </div>
              </div>

              {educationMessage && (
                <p
                  className={`mt-4 text-sm font-medium ${
                    educationMessage.includes("successfully")
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  {educationMessage}
                </p>
              )}

              <button
                type="button"
                onClick={saveEducation}
                disabled={educationSaving}
                className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {educationSaving
                  ? "Saving..."
                  : educationEditingId
                  ? "Update Education"
                  : "Save Education"}
              </button>
            </div>
          )}

          {education.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="font-medium text-slate-900">
                No education details added yet
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Add your college plus Class XII and Class X details to give
                recruiters a complete academic profile.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {education.map((item) => {
                const score = scoreLabel(item);

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
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

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => openEditEducationForm(item)}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteEducation(item.id)}
                          className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

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
                Upload your latest resume so hiring companies can review it
                alongside your education, experience, skills, assessments and
                work samples.
              </p>

              <p className="mt-1 text-xs text-slate-400">
                PDF only • Maximum 5 MB
              </p>
            </div>

            {resumeSignedUrl && (
              <a
                href={resumeSignedUrl}
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
                    {profile?.resume_url ? "Resume uploaded" : "Add your resume"}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {profile?.resume_url
                      ? "You can replace it anytime with a newer version."
                      : "Upload your latest resume so company accounts can review it."}
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
                  onChange={uploadResume}
                  disabled={resumeUploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {resumeMessage && (
            <div
              className={`mt-4 rounded-xl border p-4 text-sm ${
                resumeMessage.includes("successfully")
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {resumeMessage}
            </div>
          )}

          {profile?.resume_url && (
            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-green-700">
              <span>✓</span>
              <span>Resume uploaded successfully.</span>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
                Evidence
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                Verified Skills & Assessments
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                Role-relevant assessment results that help recruiters evaluate what you know.
              </p>

              {bestAssessmentResults.length > 0 && (
                <p className="mt-2 text-xs font-medium text-slate-500">
                  {verifiedAssessmentCount} verified out of{" "}
                  {bestAssessmentResults.length} assessment
                  {bestAssessmentResults.length !== 1 ? "s" : ""} attempted
                </p>
              )}
            </div>

            <Link
              href="/assessments"
              className="w-fit rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Take Assessment →
            </Link>
          </div>

          {bestAssessmentResults.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="font-medium text-slate-900">
                No assessments completed yet
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Take a technical or non-technical assessment relevant to your preferred role.
              </p>

              <Link
                href="/assessments"
                className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Explore assessments →
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bestAssessmentResults.map((assessment) => (
                <div
                  key={assessment.skill_name}
                  className={`rounded-xl border p-5 ${
                    assessment.percentage >= 75
                      ? "border-green-200 bg-green-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {assessment.skill_name}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Best recorded result
                      </p>
                    </div>

                    {assessment.percentage >= 75 ? (
                      <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                        ✓ Verified
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        Attempted
                      </span>
                    )}
                  </div>

                  <div className="mt-5">
                    <div className="flex items-end justify-between">
                      <span className="text-3xl font-bold text-slate-950">
                        {assessment.percentage}%
                      </span>

                      <span className="text-xs text-slate-500">
                        {assessment.score}/{assessment.total_questions}
                      </span>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full ${
                          assessment.percentage >= 75
                            ? "bg-green-600"
                            : "bg-blue-600"
                        }`}
                        style={{
                          width: `${Math.min(
                            Math.max(assessment.percentage, 0),
                            100
                          )}%`,
                        }}
                      />
                    </div>

                    <p className="mt-3 text-xs text-slate-500">
                      {assessment.percentage >= 75
                        ? "Passed the 75% verification threshold."
                        : "Score 75% or higher to earn verification."}
                    </p>
                  </div>
                </div>
              ))}
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

              <p className="mt-2 text-sm text-slate-500">
                Add technical, business, communication or role-specific skills.
              </p>
            </div>

            <Link
              href="/skills"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              + Add Skill
            </Link>
          </div>

          {skills.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="font-medium text-slate-900">No skills added yet</p>

              <p className="mt-2 text-sm text-slate-500">
                Add skills relevant to your preferred role.
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
              {skills.map((skill) => (
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
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
                Portfolio & Evidence
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                Projects & Work Samples
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {projects.length} item{projects.length !== 1 ? "s" : ""} added
              </p>
            </div>

            <Link
              href="/projects"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              + Add Work
            </Link>
          </div>

          <div className="mt-6">
            <Link
              href="/projects"
              className="inline-block rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Manage Work Samples →
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
                Find jobs matched to your profile
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                FresherHire compares your preferred role, skills, assessments
                and profile evidence against entry-level opportunities.
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
            description="Add technical, business and role-specific skills."
            href="/skills"
          />

          <DashboardCard
            title="Add Work Samples"
            description="Show projects, case studies, portfolios or practical work."
            href="/projects"
          />

          <DashboardCard
            title="Take Assessments"
            description="Prove role-relevant skills through verified assessments."
            href="/assessments"
          />
        </section>
      </section>
    </main>
  );
}

const inputClassName =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

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
        {value || "Not provided"}
      </p>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      {children}
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
      <h3 className="text-lg font-semibold text-slate-950">{title}</h3>

      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>

      <Link
        href={href}
        className="mt-5 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
      >
        Get Started →
      </Link>
    </div>
  );
}
