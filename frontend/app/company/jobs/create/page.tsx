"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { requireCompany } from "../../../lib/auth";
import NotificationBell from "../../../components/NotificationBell";

const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_LOCATION_LENGTH = 120;
const MAX_SKILLS = 20;
const MAX_SKILL_LENGTH = 50;

export default function CreateJobPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("Full-time");
  const [experienceLevel, setExperienceLevel] =
    useState("Fresher");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    protectPage();
  }, []);

  async function protectPage() {
    try {
      const auth =
        await requireCompany();

      if (!auth.allowed) {
        setCheckingAuth(false);

        router.replace(
          auth.redirectTo!
        );

        return;
      }

      if (!auth.user) {
        setCheckingAuth(false);
        router.replace("/login");
        return;
      }

      setCheckingAuth(false);
    } catch (err) {
      console.error(
        "Create job auth error:",
        err
      );

      router.replace("/login");
    }
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    const cleanTitle =
      title.trim();

    const cleanDescription =
      description.trim();

    const cleanLocation =
      location.trim();

    if (!cleanTitle) {
      setError(
        "Please enter a job title."
      );
      return;
    }

    if (
      cleanTitle.length >
      MAX_TITLE_LENGTH
    ) {
      setError(
        `Job title must be ${MAX_TITLE_LENGTH} characters or fewer.`
      );
      return;
    }

    if (!cleanDescription) {
      setError(
        "Please enter a job description."
      );
      return;
    }

    if (
      cleanDescription.length >
      MAX_DESCRIPTION_LENGTH
    ) {
      setError(
        `Job description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`
      );
      return;
    }

    if (
      cleanLocation.length >
      MAX_LOCATION_LENGTH
    ) {
      setError(
        `Location must be ${MAX_LOCATION_LENGTH} characters or fewer.`
      );
      return;
    }

    const requiredSkills =
      Array.from(
        new Map(
          skills
            .split(",")
            .map((skill) =>
              skill.trim()
            )
            .filter(Boolean)
            .map((skill) => [
              skill.toLowerCase(),
              skill,
            ])
        ).values()
      );

    if (
      requiredSkills.length === 0
    ) {
      setError(
        "Please add at least one required skill."
      );
      return;
    }

    if (
      requiredSkills.length >
      MAX_SKILLS
    ) {
      setError(
        `Please add no more than ${MAX_SKILLS} required skills.`
      );
      return;
    }

    if (
      requiredSkills.some(
        (skill) =>
          skill.length >
          MAX_SKILL_LENGTH
      )
    ) {
      setError(
        `Each skill must be ${MAX_SKILL_LENGTH} characters or fewer.`
      );
      return;
    }

    const minSalary =
      salaryMin.trim()
        ? Number(salaryMin)
        : null;

    const maxSalary =
      salaryMax.trim()
        ? Number(salaryMax)
        : null;

    if (
      minSalary !== null &&
      (!Number.isFinite(minSalary) ||
        minSalary < 0)
    ) {
      setError(
        "Please enter a valid minimum salary."
      );
      return;
    }

    if (
      maxSalary !== null &&
      (!Number.isFinite(maxSalary) ||
        maxSalary < 0)
    ) {
      setError(
        "Please enter a valid maximum salary."
      );
      return;
    }

    if (
      minSalary !== null &&
      maxSalary !== null &&
      minSalary > maxSalary
    ) {
      setError(
        "Minimum salary cannot be greater than maximum salary."
      );
      return;
    }

    setLoading(true);

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

      const user =
        auth.user;

      if (!user) {
        setLoading(false);

        router.replace("/login");

        return;
      }

      const {
        data: company,
        error: companyError,
      } = await supabase
        .from("companies")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (companyError) {
        console.error(
          "Company verification error:",
          companyError
        );

        setError(
          "Could not verify your company account. Please try again."
        );

        setLoading(false);
        return;
      }

      if (!company) {
        setError(
          "Complete your company profile before posting a job."
        );

        setLoading(false);
        return;
      }

      const {
        error: insertError,
      } = await supabase
        .from("jobs")
        .insert({
          company_id:
            user.id,

          title:
            cleanTitle,

          description:
            cleanDescription,

          required_skills:
            requiredSkills,

          location:
            cleanLocation || null,

          job_type:
            jobType,

          experience_level:
            experienceLevel,

          salary_min:
            minSalary,

          salary_max:
            maxSalary,

          is_active:
            true,
        });

      if (insertError) {
        console.error(
          "Create job error:",
          insertError
        );

        setError(
          insertError.message ||
            "Could not publish the job."
        );

        setLoading(false);

        return;
      }

      router.push(
        "/company/jobs"
      );
    } catch (err) {
      console.error(
        "Unexpected create job error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );

      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">

        <div className="text-center">

          <p className="font-semibold">
            Loading job form...
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Checking your company account
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

          <div className="flex items-center gap-3">

            <Link
              href="/company/jobs"
              className="text-sm font-semibold text-slate-600 hover:text-slate-950"
            >
              ← My Jobs
            </Link>

            <NotificationBell />

          </div>

        </div>

      </nav>

      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">

        <div>

          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
            Company Hiring
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Post a Job
          </h1>

          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            Create an entry-level opportunity and match with candidates using skills, assessments, and practical project evidence.
          </p>

        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >

          <div className="space-y-6">

            <div>

              <label className="text-sm font-semibold text-slate-700">
                Job Title
              </label>

              <input
                type="text"
                value={title}
                maxLength={MAX_TITLE_LENGTH}
                onChange={(e) =>
                  setTitle(
                    e.target.value
                  )
                }
                placeholder="e.g. Junior AI Engineer"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              <p className="mt-2 text-right text-xs text-slate-400">
                {title.length}/{MAX_TITLE_LENGTH}
              </p>

            </div>

            <div>

              <label className="text-sm font-semibold text-slate-700">
                Job Description
              </label>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                placeholder="Describe the role, responsibilities, and what the candidate will work on..."
                rows={7}
                maxLength={MAX_DESCRIPTION_LENGTH}
                className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              <p className="mt-2 text-right text-xs text-slate-400">
                {description.length}/{MAX_DESCRIPTION_LENGTH}
              </p>

            </div>

            <div>

              <label className="text-sm font-semibold text-slate-700">
                Required Skills
              </label>

              <input
                type="text"
                value={skills}
                onChange={(e) =>
                  setSkills(
                    e.target.value
                  )
                }
                placeholder="Python, FastAPI, SQL, React"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Separate skills using commas. Duplicate skills are removed automatically.
              </p>

              {skills.trim() && (
                <div className="mt-3 flex flex-wrap gap-2">

                  {Array.from(
                    new Map(
                      skills
                        .split(",")
                        .map(
                          (skill) =>
                            skill.trim()
                        )
                        .filter(Boolean)
                        .map((skill) => [
                          skill.toLowerCase(),
                          skill,
                        ])
                    ).values()
                  )
                    .slice(0, MAX_SKILLS)
                    .map((skill) => (

                      <span
                        key={skill.toLowerCase()}
                        className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                      >
                        {skill}
                      </span>

                    ))}

                </div>
              )}

            </div>

            <div>

              <label className="text-sm font-semibold text-slate-700">
                Location
              </label>

              <input
                type="text"
                value={location}
                maxLength={MAX_LOCATION_LENGTH}
                onChange={(e) =>
                  setLocation(
                    e.target.value
                  )
                }
                placeholder="e.g. Bangalore / Remote"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

            </div>

            <div className="grid gap-6 md:grid-cols-2">

              <div>

                <label className="text-sm font-semibold text-slate-700">
                  Job Type
                </label>

                <select
                  value={jobType}
                  onChange={(e) =>
                    setJobType(
                      e.target.value
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >

                  <option>
                    Full-time
                  </option>

                  <option>
                    Internship
                  </option>

                  <option>
                    Part-time
                  </option>

                  <option>
                    Contract
                  </option>

                </select>

              </div>

              <div>

                <label className="text-sm font-semibold text-slate-700">
                  Experience
                </label>

                <select
                  value={
                    experienceLevel
                  }
                  onChange={(e) =>
                    setExperienceLevel(
                      e.target.value
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >

                  <option>
                    Fresher
                  </option>

                  <option>
                    0–1 years
                  </option>

                  <option>
                    0–2 years
                  </option>

                </select>

              </div>

            </div>

            <div>

              <label className="text-sm font-semibold text-slate-700">
                Salary Range
              </label>

              <div className="mt-2 grid gap-4 md:grid-cols-2">

                <input
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={salaryMin}
                  onChange={(e) =>
                    setSalaryMin(
                      e.target.value
                    )
                  }
                  placeholder="Minimum (₹)"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

                <input
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={salaryMax}
                  onChange={(e) =>
                    setSalaryMax(
                      e.target.value
                    )
                  }
                  placeholder="Maximum (₹)"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

              </div>

              <p className="mt-2 text-xs text-slate-500">
                Optional. Enter annual salary in INR.
              </p>

            </div>

            {error && (

              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>

            )}

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">

              <p className="text-sm font-semibold text-blue-800">
                Job will be published as active
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-600">
                Candidates will be able to discover and apply to the job immediately after publishing. You can close or reactivate it later from My Jobs.
              </p>

            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row">

              <Link
                href="/company/jobs"
                className="rounded-xl border border-slate-300 bg-white px-6 py-4 text-center font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-blue-600 px-6 py-4 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Publishing Job..."
                  : "Publish Job →"}
              </button>

            </div>

          </div>

        </form>

      </section>

    </main>
  );
}
