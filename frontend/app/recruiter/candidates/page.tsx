"use client";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type SkillItem = {
  id: number;
  user_id: string;
  skill_name: string;
  skill_level: string | null;
};

type AssessmentItem = {
  id: number;
  user_id: string;
  skill_name: string;
  score: number | null;
  total_questions: number | null;
  percentage: number | null;
  created_at: string | null;
};

type Candidate = {
  id: string;
  full_name: string | null;
  headline: string | null;
  location: string | null;
  graduation_year: number | null;
  degree: string | null;
  skills: string[];
  skill_items: SkillItem[];
  best_assessment_items: AssessmentItem[];
  profile_completion: number;
  resume_available: boolean;
  project_count: number;
  internship_count: number;
  experience_count: number;
  created_at: string | null;
};

type CandidateResponse = {
  total_candidates: number;
  filtered_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  candidates: Candidate[];
};

type SearchForm = {
  q: string;
  location: string;
  role: string;
  skill: string;
  graduationYear: string;
};

const PAGE_SIZE = 20;

const emptySearch: SearchForm = {
  q: "",
  location: "",
  role: "",
  skill: "",
  graduationYear: "",
};

export default function RecruiterCandidatesPage() {
  const router = useRouter();

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";

  const [searchForm, setSearchForm] =
    useState<SearchForm>(emptySearch);

  const [activeSearch, setActiveSearch] =
    useState<SearchForm>(emptySearch);

  const [candidates, setCandidates] =
    useState<Candidate[]>([]);

  const [totalCandidates, setTotalCandidates] =
    useState(0);

  const [filteredCount, setFilteredCount] =
    useState(0);

  const [page, setPage] =
    useState(1);

  const [totalPages, setTotalPages] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [loggingOut, setLoggingOut] =
    useState(false);

  const buildQuery = useCallback(
    (
      values: SearchForm,
      requestedPage: number
    ) => {
      const params =
        new URLSearchParams();

      const q =
        values.q.trim();

      const location =
        values.location.trim();

      const role =
        values.role.trim();

      const skill =
        values.skill.trim();

      const graduationYear =
        values.graduationYear.trim();

      if (q) {
        params.set("q", q);
      }

      if (location) {
        params.set(
          "location",
          location
        );
      }

      if (role) {
        params.set(
          "role",
          role
        );
      }

      if (skill) {
        params.set(
          "skill",
          skill
        );
      }

      if (graduationYear) {
        params.set(
          "graduation_year",
          graduationYear
        );
      }

      params.set(
        "page",
        String(requestedPage)
      );

      params.set(
        "page_size",
        String(PAGE_SIZE)
      );

      return `?${params.toString()}`;
    },
    []
  );

  const loadCandidates = useCallback(
    async (
      values: SearchForm,
      requestedPage: number
    ) => {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `${apiUrl}/api/recruiter/candidates${buildQuery(
              values,
              requestedPage
            )}`,
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
          (await response
            .json()
            .catch(
              () => null
            )) as
            | CandidateResponse
            | {
                detail?: string;
              }
            | null;

        if (!response.ok) {
          throw new Error(
            (
              data as {
                detail?: string;
              } | null
            )?.detail ||
              "Unable to load candidates."
          );
        }

        const result =
          data as CandidateResponse;

        setCandidates(
          Array.isArray(
            result.candidates
          )
            ? result.candidates
            : []
        );

        setTotalCandidates(
          Number(
            result.total_candidates ||
              0
          )
        );

        setFilteredCount(
          Number(
            result.filtered_count ||
              0
          )
        );

        setPage(
          Number(
            result.page ||
              requestedPage
          )
        );

        setTotalPages(
          Math.max(
            1,
            Number(
              result.total_pages ||
                1
            )
          )
        );
      } catch (err) {
        console.error(
          "Candidate search error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load candidates."
        );
      } finally {
        setLoading(false);
      }
    },
    [
      apiUrl,
      buildQuery,
      router,
    ]
  );

  useEffect(() => {
    void loadCandidates(
      activeSearch,
      page
    );
  }, [
    activeSearch,
    page,
    loadCandidates,
  ]);

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setPage(1);

    setActiveSearch({
      ...searchForm,
    });
  }

  function clearFilters() {
    setSearchForm(
      emptySearch
    );

    setPage(1);

    setActiveSearch(
      emptySearch
    );
  }

  function refreshCandidates() {
    void loadCandidates(
      activeSearch,
      page
    );
  }

  async function logout() {
    try {
      setLoggingOut(true);

      await fetch(
        `${apiUrl}/api/recruiter/logout`,
        {
          method: "POST",
          credentials:
            "include",
        }
      );
    } finally {
      router.replace(
        "/recruiter/login"
      );
      router.refresh();
      setLoggingOut(false);
    }
  }

  const verifiedOnPage =
    useMemo(
      () =>
        candidates.filter(
          (candidate) =>
            candidate
              .best_assessment_items
              .some(
                (
                  assessment
                ) =>
                  Number(
                    assessment.percentage ||
                      0
                  ) >= 75
              )
        ).length,
      [candidates]
    );

  const firstResult =
    filteredCount === 0
      ? 0
      : (page - 1) *
          PAGE_SIZE +
        1;

  const lastResult =
    Math.min(
      page * PAGE_SIZE,
      filteredCount
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
              href="/recruiter/dashboard"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Dashboard
            </Link>

            <Link
              href="/recruiter/jobs/new"
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              + Post Job
            </Link>

            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {loggingOut
                ? "Logging out..."
                : "Logout"}
            </button>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="rounded-[2rem] bg-slate-950 p-7 text-white shadow-xl sm:p-9">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
            Talent Pool
          </p>

          <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                Find Freshers
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Browse registered FresherHire candidates by role,
                location, skill, graduation year and profile evidence.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Metric
                label="Registered"
                value={
                  totalCandidates
                }
              />

              <Metric
                label="Results"
                value={
                  filteredCount
                }
              />

              <Metric
                label="Verified on page"
                value={
                  verifiedOnPage
                }
              />
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <SearchField
              label="Search"
              placeholder="Name, role, degree, location..."
              value={
                searchForm.q
              }
              onChange={(
                value
              ) =>
                setSearchForm(
                  (current) => ({
                    ...current,
                    q: value,
                  })
                )
              }
            />

            <SearchField
              label="Role"
              placeholder="e.g. AI Engineer"
              value={
                searchForm.role
              }
              onChange={(
                value
              ) =>
                setSearchForm(
                  (current) => ({
                    ...current,
                    role: value,
                  })
                )
              }
            />

            <SearchField
              label="Skill"
              placeholder="e.g. Python"
              value={
                searchForm.skill
              }
              onChange={(
                value
              ) =>
                setSearchForm(
                  (current) => ({
                    ...current,
                    skill: value,
                  })
                )
              }
            />

            <SearchField
              label="Location"
              placeholder="e.g. Noida"
              value={
                searchForm.location
              }
              onChange={(
                value
              ) =>
                setSearchForm(
                  (current) => ({
                    ...current,
                    location: value,
                  })
                )
              }
            />

            <SearchField
              label="Graduation Year"
              placeholder="e.g. 2026"
              value={
                searchForm.graduationYear
              }
              inputMode="numeric"
              onChange={(
                value
              ) =>
                setSearchForm(
                  (current) => ({
                    ...current,
                    graduationYear:
                      value.replace(
                        /\D/g,
                        ""
                      ),
                  })
                )
              }
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Search Candidates
            </button>

            <button
              type="button"
              onClick={clearFilters}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Clear Filters
            </button>

            <button
              type="button"
              onClick={refreshCandidates}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              ↻ Refresh Count
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
              Candidate Results
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              {filteredCount} candidate
              {filteredCount === 1
                ? ""
                : "s"}
            </h2>

            {filteredCount >
              0 && (
              <p className="mt-1 text-sm text-slate-500">
                Showing{" "}
                <span className="font-bold text-slate-900">
                  {firstResult}-
                  {lastResult}
                </span>{" "}
                of{" "}
                <span className="font-bold text-slate-900">
                  {filteredCount}
                </span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={
                loading ||
                page <= 1
              }
              onClick={() =>
                setPage(
                  (current) =>
                    Math.max(
                      1,
                      current - 1
                    )
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Previous
            </button>

            <span className="min-w-[110px] text-center text-sm font-bold text-slate-600">
              Page {page} of{" "}
              {totalPages}
            </span>

            <button
              type="button"
              disabled={
                loading ||
                page >= totalPages
              }
              onClick={() =>
                setPage(
                  (current) =>
                    Math.min(
                      totalPages,
                      current + 1
                    )
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>

        {loading ? (
          <CandidateGridSkeleton />
        ) : candidates.length ===
          0 ? (
          <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="text-4xl">
              🔎
            </div>

            <h3 className="mt-4 text-xl font-black text-slate-950">
              No matching candidates
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Try removing one or more filters.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {candidates.map(
              (candidate) => (
                <CandidateCard
                  key={
                    candidate.id
                  }
                  candidate={
                    candidate
                  }
                />
              )
            )}
          </div>
        )}

        {!loading &&
          filteredCount > 0 && (
          <div className="mt-8 flex justify-center gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() =>
                setPage(
                  (current) =>
                    Math.max(
                      1,
                      current - 1
                    )
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
            >
              ← Previous
            </button>

            <button
              type="button"
              disabled={
                page >= totalPages
              }
              onClick={() =>
                setPage(
                  (current) =>
                    Math.min(
                      totalPages,
                      current + 1
                    )
                )
              }
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-600 disabled:opacity-40"
            >
              Next Page →
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3">
      <p className="text-xs font-semibold text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function SearchField({
  label,
  value,
  placeholder,
  inputMode,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  inputMode?:
    | "text"
    | "numeric";
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label>
      <span className="text-sm font-bold text-slate-700">
        {label}
      </span>

      <input
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        inputMode={
          inputMode ||
          "text"
        }
        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function CandidateGridSkeleton() {
  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-2">
      {Array.from({
        length: 6,
      }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex gap-4">
            <div className="h-14 w-14 rounded-2xl bg-slate-200" />

            <div className="flex-1">
              <div className="h-5 w-1/2 rounded bg-slate-200" />
              <div className="mt-3 h-4 w-1/3 rounded bg-slate-100" />
              <div className="mt-4 h-4 w-2/3 rounded bg-slate-100" />
            </div>
          </div>

          <div className="mt-6 h-16 rounded-2xl bg-slate-100" />
          <div className="mt-4 h-10 rounded-xl bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function CandidateCard({
  candidate,
}: {
  candidate: Candidate;
}) {
  const topSkills =
    candidate.skills.slice(
      0,
      6
    );

  const verified =
    candidate.best_assessment_items.filter(
      (assessment) =>
        Number(
          assessment.percentage ||
            0
        ) >= 75
    );

  return (
    <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 text-lg font-black text-blue-700">
          {initials(
            candidate.full_name
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-xl font-black text-slate-950">
              {candidate.full_name ||
                "Candidate"}
            </h3>

            {verified.length >
              0 && (
              <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-black text-green-700">
                ✓ Verified Skills
              </span>
            )}
          </div>

          <p className="mt-1 text-sm font-semibold text-blue-600">
            {candidate.headline ||
              "Fresher Candidate"}
          </p>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
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

      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-slate-700">
            Profile Strength
          </span>

          <span className="text-sm font-black text-blue-600">
            {
              candidate.profile_completion
            }
            %
          </span>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-blue-600"
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

      {topSkills.length >
        0 && (
        <div className="mt-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            Skills
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {topSkills.map(
              (skill) => (
                <span
                  key={skill}
                  className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700"
                >
                  {skill}
                </span>
              )
            )}
          </div>
        </div>
      )}

      {verified.length >
        0 && (
        <div className="mt-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            Assessments
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {verified
              .slice(
                0,
                3
              )
              .map(
                (
                  assessment
                ) => (
                  <span
                    key={
                      assessment.id
                    }
                    className="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-black text-green-700"
                  >
                    {
                      assessment.skill_name
                    }{" "}
                    •{" "}
                    {Math.round(
                      Number(
                        assessment.percentage ||
                          0
                      )
                    )}
                    %
                  </span>
                )
              )}
          </div>
        </div>
      )}

      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <MiniMetric
          label="Projects"
          value={
            candidate.project_count
          }
        />

        <MiniMetric
          label="Internships"
          value={
            candidate.internship_count
          }
        />

        <MiniMetric
          label="Experience"
          value={
            candidate.experience_count
          }
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
        <p className="text-xs text-slate-400">
          {candidate.resume_available
            ? "✓ Resume available"
            : "Resume not uploaded"}
        </p>

        <Link
          href={`/recruiter/candidates/${candidate.id}`}
          className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-blue-600"
        >
          View Profile →
        </Link>
      </div>
    </article>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-lg font-black text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-[11px] font-semibold text-slate-500">
        {label}
      </p>
    </div>
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
