"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";

type SkillItem = {
  id: number;
  skill_name: string;
  skill_level: string | null;
};

type AssessmentItem = {
  id: number;
  skill_name: string;
  score: number | null;
  total_questions: number | null;
  percentage: number | null;
  created_at: string | null;
};

type EducationItem = {
  id: number;
  education_level?: string | null;
  degree_or_course?: string | null;
  institution_name?: string | null;
  field_of_study?: string | null;
  start_year?: number | null;
  end_year?: number | null;
  score?: string | null;
  description?: string | null;
};

type EmploymentItem = {
  id: number;
  employment_type?: string | null;
  role_title?: string | null;
  company_name?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_current?: boolean | null;
  description?: string | null;
};

type ProjectItem = {
  id: number;
  title?: string | null;
  description?: string | null;
  technologies?: string | null;
  project_url?: string | null;
  github_url?: string | null;
  demo_url?: string | null;
  created_at?: string | null;
};

type Candidate = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  headline: string | null;
  location: string | null;
  graduation_year: number | null;
  degree: string | null;
  skills: string | null;
  education: string | null;
  internships: string | null;
  projects: string | null;
  experience: string | null;
  skill_items: SkillItem[];
  education_items: EducationItem[];
  employment_items: EmploymentItem[];
  experience_items: EmploymentItem[];
  internship_items: EmploymentItem[];
  project_items: ProjectItem[];
  assessment_items: AssessmentItem[];
  best_assessment_items: AssessmentItem[];
  bio: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  resume_url: string | null;
  resume_available: boolean;
  contact_access: boolean;
  subscription_plan: string;
  subscription_status: string;
  subscription_expires_at: string | null;
  profile_completion: number;
  created_at: string | null;
};

export default function RecruiterCandidateProfilePage() {
  const router =
    useRouter();

  const params =
    useParams();

  const rawCandidateId =
    params?.id;

  const candidateId =
    Array.isArray(
      rawCandidateId
    )
      ? rawCandidateId[0]
      : rawCandidateId;

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";

  const [candidate, setCandidate] =
    useState<Candidate | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadedCandidateId =
    useRef<string | undefined>(
      undefined
    );

  useEffect(() => {
    if (!candidateId) {
      setError(
        "Candidate ID is missing."
      );
      setLoading(false);
      return;
    }

    if (
      loadedCandidateId.current ===
      candidateId
    ) {
      return;
    }

    loadedCandidateId.current =
      candidateId;

    void loadCandidate();
  }, [candidateId]);

  async function readJsonSafely(
    response: Response
  ) {
    return response
      .json()
      .catch(() => null);
  }

  async function loadCandidate() {
    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          `${apiUrl}/api/recruiter/candidates/${candidateId}`,
          {
            credentials:
              "include",
            cache:
              "no-store",
          }
        );

      if (
        response.status === 401
      ) {
        router.replace(
          "/recruiter/login"
        );
        return;
      }

      if (
        response.status === 403
      ) {
        router.replace(
          "/recruiter/change-password"
        );
        return;
      }

      const data =
        await readJsonSafely(
          response
        );

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Unable to load candidate profile."
        );
      }

      setCandidate(
        data as Candidate
      );
    } catch (err) {
      console.error(
        "Recruiter candidate profile error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load candidate profile."
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

          <p className="mt-4 text-sm font-semibold text-slate-500">
            Loading candidate profile...
          </p>
        </div>
      </main>
    );
  }

  if (
    error ||
    !candidate
  ) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-20 text-slate-900 sm:px-6">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="text-4xl">
            👤
          </div>

          <h1 className="mt-5 text-3xl font-black text-slate-950">
            Candidate unavailable
          </h1>

          <p className="mt-4 text-sm leading-6 text-slate-500">
            {error ||
              "This candidate profile could not be loaded."}
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/recruiter/candidates"
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-600"
            >
              ← Back to Candidates
            </Link>

            <button
              type="button"
              onClick={loadCandidate}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  const verifiedAssessments =
    candidate.best_assessment_items.filter(
      (assessment) =>
        Number(
          assessment.percentage ||
            0
        ) >= 75
    );

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-slate-900">
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/recruiter/dashboard"
            className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-950"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm text-white">
              F
            </span>

            <span>
              Fresher
              <span className="text-blue-600">
                Hire
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/recruiter/candidates"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              ← Candidates
            </Link>

            <Link
              href="/recruiter/jobs/new"
              className="hidden rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 sm:inline-flex"
            >
              + Post Job
            </Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] bg-slate-950 p-7 text-white shadow-xl sm:p-9">
            <div className="flex items-start gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-xl font-black text-white">
                {initials(
                  candidate.full_name
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                    {candidate.full_name ||
                      "Candidate"}
                  </h1>

                  {verifiedAssessments.length >
                    0 && (
                    <span className="rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-xs font-bold text-green-300">
                      ✓ Verified Skills
                    </span>
                  )}
                </div>

                <p className="mt-2 text-base font-semibold text-cyan-300">
                  {candidate.headline ||
                    "Fresher Candidate"}
                </p>

                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
                  <span>
                    📍{" "}
                    {candidate.location ||
                      "Location not added"}
                  </span>

                  <span>
                    🎓{" "}
                    {candidate.degree ||
                      "Degree not added"}
                  </span>

                  {candidate
                    .graduation_year && (
                    <span>
                      🗓{" "}
                      {
                        candidate.graduation_year
                      }
                    </span>
                  )}
                </div>
              </div>
            </div>

            {candidate.bio && (
              <p className="mt-7 max-w-3xl text-sm leading-7 text-slate-300">
                {candidate.bio}
              </p>
            )}

            <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.06] p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold text-white">
                  Profile Strength
                </p>

                <p className="font-black text-cyan-300">
                  {
                    candidate.profile_completion
                  }
                  %
                </p>
              </div>

              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        candidate.profile_completion
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
              Recruiter Access
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Contact & Resume
            </h2>

            {candidate.contact_access ? (
              <>
                <div className="mt-4 inline-flex rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-black text-green-700">
                  ✓ {candidate.subscription_plan === "pro" ? "Pro" : "Starter"} access active
                </div>

                <div className="mt-5 space-y-3">
                  <InfoRow
                    label="Email"
                    value={
                      candidate.email ||
                      "Not provided"
                    }
                  />

                  <InfoRow
                    label="Phone"
                    value={
                      candidate.phone ||
                      "Not provided"
                    }
                  />

                  <InfoRow
                    label="Location"
                    value={
                      candidate.location ||
                      "Not provided"
                    }
                  />
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  {candidate.resume_url ? (
                    <a
                      href={
                        candidate.resume_url
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl bg-blue-600 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-blue-700"
                    >
                      View Resume ↗
                    </a>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-3 text-center text-sm font-semibold text-slate-500">
                      Resume not uploaded
                    </div>
                  )}

                  <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                    <ExternalLink
                      href={
                        candidate.linkedin_url
                      }
                      label="LinkedIn"
                    />

                    <ExternalLink
                      href={
                        candidate.github_url
                      }
                      label="GitHub"
                    />

                    <ExternalLink
                      href={
                        candidate.portfolio_url
                      }
                      label="Portfolio"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="mt-5 space-y-3">
                  <LockedInfoRow
                    label="Email"
                  />

                  <LockedInfoRow
                    label="Phone"
                  />

                  <InfoRow
                    label="Location"
                    value={
                      candidate.location ||
                      "Not provided"
                    }
                  />

                  <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Resume
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {candidate.resume_available
                          ? "🔒 Resume available"
                          : "Resume not uploaded"}
                      </p>
                    </div>

                    {candidate.resume_available && (
                      <span className="text-xs font-black text-amber-600">
                        Locked
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                  <p className="text-sm font-black text-blue-900">
                    Unlock candidate contact details
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Activate a Starter or Pro recruiter plan to view candidate email, phone number and available resumes.
                  </p>

                  <Link
                    href="/recruiter/pricing"
                    className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
                  >
                    View Recruiter Plans →
                  </Link>
                </div>

                <div className="mt-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                  <ExternalLink
                    href={
                      candidate.linkedin_url
                    }
                    label="LinkedIn"
                  />

                  <ExternalLink
                    href={
                      candidate.github_url
                    }
                    label="GitHub"
                  />

                  <ExternalLink
                    href={
                      candidate.portfolio_url
                    }
                    label="Portfolio"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <ProfileSection
            eyebrow="Skills"
            title="Skills & assessments"
            empty={
              candidate.skill_items.length ===
                0 &&
              candidate.best_assessment_items
                .length === 0
            }
            emptyText="No skills or assessment evidence has been added yet."
          >
            {candidate.skill_items.length >
              0 && (
              <div className="flex flex-wrap gap-2">
                {candidate.skill_items.map(
                  (skill) => (
                    <span
                      key={
                        skill.id
                      }
                      className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700"
                    >
                      {
                        skill.skill_name
                      }
                      {skill.skill_level
                        ? ` • ${skill.skill_level}`
                        : ""}
                    </span>
                  )
                )}
              </div>
            )}

            {candidate
              .best_assessment_items
              .length > 0 && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {candidate.best_assessment_items.map(
                  (
                    assessment
                  ) => (
                    <div
                      key={
                        assessment.id
                      }
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <p className="font-black text-slate-950">
                        {
                          assessment.skill_name
                        }
                      </p>

                      <p className="mt-2 text-2xl font-black text-blue-600">
                        {Math.round(
                          Number(
                            assessment.percentage ||
                              0
                          )
                        )}
                        %
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {Number(
                          assessment.percentage ||
                            0
                        ) >= 75
                          ? "Verified assessment"
                          : "Assessment result"}
                      </p>
                    </div>
                  )
                )}
              </div>
            )}
          </ProfileSection>

          <ProfileSection
            eyebrow="Projects"
            title="Project evidence"
            empty={
              candidate.project_items
                .length === 0
            }
            emptyText="No projects have been added yet."
          >
            <div className="space-y-4">
              {candidate.project_items.map(
                (project) => (
                  <div
                    key={
                      project.id
                    }
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <h3 className="font-black text-slate-950">
                      {project.title ||
                        "Project"}
                    </h3>

                    {project.description && (
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {
                          project.description
                        }
                      </p>
                    )}

                    {project.technologies && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {parseTechnologies(
                          project.technologies
                        ).map(
                          (
                            technology
                          ) => (
                            <span
                              key={
                                technology
                              }
                              className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600"
                            >
                              {
                                technology
                              }
                            </span>
                          )
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-3">
                      {project.project_url && (
                        <a
                          href={
                            project.project_url
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-black text-blue-600 hover:text-blue-700"
                        >
                          Project ↗
                        </a>
                      )}

                      {project.github_url && (
                        <a
                          href={
                            project.github_url
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-black text-blue-600 hover:text-blue-700"
                        >
                          GitHub ↗
                        </a>
                      )}

                      {project.demo_url && (
                        <a
                          href={
                            project.demo_url
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-black text-blue-600 hover:text-blue-700"
                        >
                          Demo ↗
                        </a>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </ProfileSection>

          <ProfileSection
            eyebrow="Education"
            title="Academic background"
            empty={
              candidate.education_items
                .length === 0
            }
            emptyText="No structured education details have been added yet."
          >
            <div className="space-y-4">
              {candidate.education_items.map(
                (education) => (
                  <TimelineCard
                    key={
                      education.id
                    }
                    title={
                      education.degree_or_course ||
                      education.education_level ||
                      "Education"
                    }
                    subtitle={
                      education.institution_name ||
                      "Institution not added"
                    }
                    meta={
                      [
                        education.field_of_study,
                        yearRange(
                          education.start_year,
                          education.end_year
                        ),
                        education.score,
                      ]
                        .filter(Boolean)
                        .join(
                          " • "
                        ) ||
                      null
                    }
                    description={
                      education.description ||
                      null
                    }
                  />
                )
              )}
            </div>
          </ProfileSection>

          <ProfileSection
            eyebrow="Experience"
            title="Experience & internships"
            empty={
              candidate.employment_items
                .length === 0
            }
            emptyText="No experience or internship entries have been added yet."
          >
            <div className="space-y-4">
              {candidate.employment_items.map(
                (employment) => (
                  <TimelineCard
                    key={
                      employment.id
                    }
                    title={
                      employment.role_title ||
                      "Role"
                    }
                    subtitle={
                      employment.company_name ||
                      "Company not added"
                    }
                    meta={
                      [
                        employment.employment_type
                          ? capitalize(
                              employment.employment_type
                            )
                          : null,
                        dateRange(
                          employment.start_date,
                          employment.end_date,
                          Boolean(
                            employment.is_current
                          )
                        ),
                      ]
                        .filter(Boolean)
                        .join(
                          " • "
                        ) ||
                      null
                    }
                    description={
                      employment.description ||
                      null
                    }
                  />
                )
              )}
            </div>
          </ProfileSection>
        </div>
      </section>
    </main>
  );
}

function ProfileSection({
  eyebrow,
  title,
  empty,
  emptyText,
  children,
}: {
  eyebrow: string;
  title: string;
  empty: boolean;
  emptyText: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-2xl font-black text-slate-950">
        {title}
      </h2>

      {empty ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
          {emptyText}
        </div>
      ) : (
        <div className="mt-5">
          {children}
        </div>
      )}
    </section>
  );
}

function TimelineCard({
  title,
  subtitle,
  meta,
  description,
}: {
  title: string;
  subtitle: string;
  meta: string | null;
  description: string | null;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="font-black text-slate-950">
        {title}
      </h3>

      <p className="mt-1 text-sm font-semibold text-slate-700">
        {subtitle}
      </p>

      {meta && (
        <p className="mt-2 text-xs text-slate-500">
          {meta}
        </p>
      )}

      {description && (
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {description}
        </p>
      )}
    </div>
  );
}

function LockedInfoRow({
  label,
}: {
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>

        <p className="mt-1 text-sm font-semibold text-slate-700">
          🔒 Upgrade to view
        </p>
      </div>

      <span className="text-xs font-black text-amber-600">
        Locked
      </span>
    </div>
  );
}


function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="max-w-[65%] break-words text-right text-sm font-bold text-slate-900">
        {value}
      </span>
    </div>
  );
}

function ExternalLink({
  href,
  label,
}: {
  href: string | null;
  label: string;
}) {
  if (!href) {
    return (
      <span className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center text-xs font-semibold text-slate-400">
        {label}
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
    >
      {label} ↗
    </a>
  );
}

function parseTechnologies(
  value: string | null
) {
  if (!value) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .replace(/\n/g, ",")
        .split(",")
        .map(
          (item) =>
            item.trim()
        )
        .filter(Boolean)
    )
  );
}

function initials(
  value: string | null
) {
  if (!value) {
    return "C";
  }

  const parts =
    value
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);

  if (
    parts.length === 0
  ) {
    return "C";
  }

  return parts
    .map(
      (part) =>
        part[0]
          ?.toUpperCase() ||
        ""
    )
    .join("");
}

function yearRange(
  start?: number | null,
  end?: number | null
) {
  if (!start && !end) {
    return null;
  }

  if (
    start &&
    end
  ) {
    return `${start} - ${end}`;
  }

  if (start) {
    return `${start} - Present`;
  }

  return String(end);
}

function dateRange(
  start: string | null | undefined,
  end: string | null | undefined,
  current: boolean
) {
  if (!start && !end) {
    return current
      ? "Present"
      : null;
  }

  const startText =
    start
      ? formatMonthYear(
          start
        )
      : "";

  const endText =
    current
      ? "Present"
      : end
      ? formatMonthYear(
          end
        )
      : "";

  if (
    startText &&
    endText
  ) {
    return `${startText} - ${endText}`;
  }

  return (
    startText ||
    endText ||
    null
  );
}

function formatMonthYear(
  value: string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      month: "short",
      year: "numeric",
    }
  );
}

function capitalize(
  value: string
) {
  if (!value) {
    return value;
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}
