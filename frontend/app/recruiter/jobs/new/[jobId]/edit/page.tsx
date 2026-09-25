"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";


type EmploymentType =
  | "Full-time"
  | "Internship"
  | "Contract";


type WorkplaceType =
  | "On-site"
  | "Hybrid"
  | "Remote";


type Experience =
  | "Fresher"
  | "0-1 years"
  | "0-2 years"
  | "1-2 years";


type JobStatus =
  | "published"
  | "closed";


type Job = {
  id: number;
  title: string;
  description: string;
  skills: string;
  location: string;
  employment_type: EmploymentType;
  workplace_type: WorkplaceType;
  openings: number;
  experience: Experience;
  salary: string | null;
  eligibility: string | null;
  status: JobStatus;
  application_count: number;
  created_at: string | null;
};


type FormData = {
  title: string;
  description: string;
  skills: string;
  location: string;
  employmentType:
    EmploymentType;
  workplaceType:
    WorkplaceType;
  openings: string;
  experience:
    Experience;
  salary: string;
  eligibility: string;
};


const emptyForm:
  FormData = {
    title: "",
    description: "",
    skills: "",
    location: "",
    employmentType:
      "Full-time",
    workplaceType:
      "On-site",
    openings: "1",
    experience:
      "Fresher",
    salary: "",
    eligibility: "",
  };


export default function EditRecruiterJobPage() {
  const router =
    useRouter();


  const params =
    useParams();


  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";


  const rawJobId =
    Array.isArray(
      params.jobId
    )
      ? params.jobId[0]
      : params.jobId;


  const jobId =
    Number(
      rawJobId
    );


  const [
    job,
    setJob,
  ] =
    useState<Job | null>(
      null
    );


  const [
    form,
    setForm,
  ] =
    useState<FormData>(
      emptyForm
    );


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    saving,
    setSaving,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState("");


  const [
    success,
    setSuccess,
  ] =
    useState("");


  // =========================================================
  // LOAD
  // =========================================================

  useEffect(() => {
    if (
      !Number.isInteger(
        jobId
      ) ||
      jobId <= 0
    ) {
      setError(
        "Invalid job."
      );

      setLoading(
        false
      );

      return;
    }


    loadJob();

  }, [
    jobId,
  ]);


  async function loadJob() {
    try {
      setLoading(
        true
      );

      setError("");


      const response =
        await fetch(
          `${apiUrl}/api/recruiter/jobs/${jobId}`,
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
        await response.json();


      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to load job."
        );
      }


      const loadedJob:
        Job =
        data;


      setJob(
        loadedJob
      );


      setForm({
        title:
          loadedJob.title,

        description:
          loadedJob.description,

        skills:
          loadedJob.skills,

        location:
          loadedJob.location,

        employmentType:
          loadedJob.employment_type,

        workplaceType:
          loadedJob.workplace_type,

        openings:
          String(
            loadedJob.openings
          ),

        experience:
          loadedJob.experience,

        salary:
          loadedJob.salary ||
          "",

        eligibility:
          loadedJob.eligibility ||
          "",
      });

    } catch (err) {
      console.error(
        "Load job error:",
        err
      );


      setError(
        err instanceof Error
          ? err.message
          : "Unable to load job."
      );

    } finally {
      setLoading(
        false
      );
    }
  }


  // =========================================================
  // INPUT
  // =========================================================

  function updateField<
    K extends keyof FormData
  >(
    field: K,
    value: FormData[K]
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]:
          value,
      })
    );
  }


  // =========================================================
  // SUBMIT
  // =========================================================

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();


    const title =
      form.title.trim();

    const description =
      form.description.trim();

    const skills =
      form.skills.trim();

    const location =
      form.location.trim();

    const openings =
      Number(
        form.openings
      );


    if (
      title.length < 2
    ) {
      setError(
        "Job title is required."
      );

      return;
    }


    if (
      description.length < 20
    ) {
      setError(
        "Job description must be at least 20 characters."
      );

      return;
    }


    if (
      skills.length < 2
    ) {
      setError(
        "Add at least one required skill."
      );

      return;
    }


    if (
      location.length < 2
    ) {
      setError(
        "Location is required."
      );

      return;
    }


    if (
      !Number.isInteger(
        openings
      ) ||
      openings < 1
    ) {
      setError(
        "Openings must be at least 1."
      );

      return;
    }


    try {
      setSaving(
        true
      );

      setError("");
      setSuccess("");


      const response =
        await fetch(
          `${apiUrl}/api/recruiter/jobs/${jobId}`,
          {
            method:
              "PATCH",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                title:
                  title,

                description:
                  description,

                skills:
                  skills,

                location:
                  location,

                employment_type:
                  form.employmentType,

                workplace_type:
                  form.workplaceType,

                openings:
                  openings,

                experience:
                  form.experience,

                salary:
                  form.salary.trim()
                    ? form.salary.trim()
                    : null,

                eligibility:
                  form.eligibility.trim()
                    ? form.eligibility.trim()
                    : null,
              }),
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
        await response.json();


      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to update job."
        );
      }


      setSuccess(
        "Job updated successfully."
      );


      setTimeout(() => {
        router.push(
          "/recruiter/dashboard"
        );
      }, 900);

    } catch (err) {
      console.error(
        "Update job error:",
        err
      );


      setError(
        err instanceof Error
          ? err.message
          : "Unable to update job."
      );

    } finally {
      setSaving(
        false
      );
    }
  }


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="text-center">

          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />


          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading job...
          </p>

        </div>

      </main>
    );
  }


  // =========================================================
  // NOT FOUND
  // =========================================================

  if (
    !job
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">

        <div className="max-w-md text-center">

          <h1 className="text-3xl font-bold text-slate-950">
            Job unavailable
          </h1>


          <p className="mt-3 text-sm leading-6 text-slate-500">
            {error ||
              "This job could not be loaded."}
          </p>


          <Link
            href="/recruiter/dashboard"
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Back to Dashboard
          </Link>

        </div>

      </main>
    );
  }


  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* =====================================================
          NAV
      ===================================================== */}

      <nav className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">

          <Link
            href="/"
            className="text-2xl font-bold tracking-tight text-slate-950"
          >
            Fresher

            <span className="text-blue-600">
              Hire
            </span>
          </Link>


          <Link
            href="/recruiter/dashboard"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            Dashboard
          </Link>

        </div>

      </nav>


      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">

        <Link
          href="/recruiter/dashboard"
          className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          ← Back to Dashboard
        </Link>


        <div className="mt-6">

          <div className="flex flex-wrap items-center gap-3">

            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              Edit Job
            </p>


            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                job.status ===
                "published"
                  ? "bg-green-50 text-green-700"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {job.status ===
              "published"
                ? "Published"
                : "Closed"}
            </span>

          </div>


          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
            Update job listing
          </h1>


          <p className="mt-3 text-sm text-slate-500">
            {job.application_count}{" "}
            {job.application_count === 1
              ? "candidate has"
              : "candidates have"}{" "}
            applied to this role.
          </p>

        </div>


        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}


        {success && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
            ✓ {success}
          </div>
        )}


        <form
          onSubmit={
            handleSubmit
          }
          className="mt-8 space-y-6"
        >

          {/* BASIC */}

          <FormSection
            title="Job Information"
            description="Main information candidates will see."
          >

            <Field
              label="Job Title"
              required
            >

              <input
                type="text"
                value={
                  form.title
                }
                onChange={
                  (event) =>
                    updateField(
                      "title",
                      event.target.value
                    )
                }
                placeholder="AI Engineer"
                className={inputClass}
              />

            </Field>


            <Field
              label="Job Description"
              required
            >

              <textarea
                rows={8}
                value={
                  form.description
                }
                onChange={
                  (event) =>
                    updateField(
                      "description",
                      event.target.value
                    )
                }
                placeholder="Describe the role, responsibilities and what the candidate will work on..."
                className={textareaClass}
              />

            </Field>


            <Field
              label="Required Skills"
              required
              help="Separate skills using commas."
            >

              <input
                type="text"
                value={
                  form.skills
                }
                onChange={
                  (event) =>
                    updateField(
                      "skills",
                      event.target.value
                    )
                }
                placeholder="Python, FastAPI, SQL, RAG"
                className={inputClass}
              />

            </Field>

          </FormSection>


          {/* ROLE */}

          <FormSection
            title="Role Details"
            description="Employment, workplace and experience requirements."
          >

            <div className="grid gap-5 sm:grid-cols-2">

              <Field
                label="Employment Type"
                required
              >

                <select
                  value={
                    form.employmentType
                  }
                  onChange={
                    (event) =>
                      updateField(
                        "employmentType",
                        event.target.value
                        as EmploymentType
                      )
                  }
                  className={inputClass}
                >
                  <option value="Full-time">
                    Full-time
                  </option>

                  <option value="Internship">
                    Internship
                  </option>

                  <option value="Contract">
                    Contract
                  </option>
                </select>

              </Field>


              <Field
                label="Workplace Type"
                required
              >

                <select
                  value={
                    form.workplaceType
                  }
                  onChange={
                    (event) =>
                      updateField(
                        "workplaceType",
                        event.target.value
                        as WorkplaceType
                      )
                  }
                  className={inputClass}
                >
                  <option value="On-site">
                    On-site
                  </option>

                  <option value="Hybrid">
                    Hybrid
                  </option>

                  <option value="Remote">
                    Remote
                  </option>
                </select>

              </Field>


              <Field
                label="Experience"
                required
              >

                <select
                  value={
                    form.experience
                  }
                  onChange={
                    (event) =>
                      updateField(
                        "experience",
                        event.target.value
                        as Experience
                      )
                  }
                  className={inputClass}
                >
                  <option value="Fresher">
                    Fresher
                  </option>

                  <option value="0-1 years">
                    0-1 years
                  </option>

                  <option value="0-2 years">
                    0-2 years
                  </option>

                  <option value="1-2 years">
                    1-2 years
                  </option>
                </select>

              </Field>


              <Field
                label="Number of Openings"
                required
              >

                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={
                    form.openings
                  }
                  onChange={
                    (event) =>
                      updateField(
                        "openings",
                        event.target.value
                      )
                  }
                  className={inputClass}
                />

              </Field>

            </div>


            <Field
              label="Location"
              required
            >

              <input
                type="text"
                value={
                  form.location
                }
                onChange={
                  (event) =>
                    updateField(
                      "location",
                      event.target.value
                    )
                }
                placeholder="Noida, Uttar Pradesh"
                className={inputClass}
              />

            </Field>


            <Field
              label="Salary"
              help="Optional. Example: ₹4–6 LPA"
            >

              <input
                type="text"
                value={
                  form.salary
                }
                onChange={
                  (event) =>
                    updateField(
                      "salary",
                      event.target.value
                    )
                }
                placeholder="₹4–6 LPA"
                className={inputClass}
              />

            </Field>

          </FormSection>


          {/* ELIGIBILITY */}

          <FormSection
            title="Eligibility"
            description="Optional education or other candidate requirements."
          >

            <Field
              label="Eligibility Requirements"
            >

              <textarea
                rows={6}
                value={
                  form.eligibility
                }
                onChange={
                  (event) =>
                    updateField(
                      "eligibility",
                      event.target.value
                    )
                }
                placeholder="B.Tech/B.E./BCA/MCA graduates, 2025 or 2026 batch..."
                className={textareaClass}
              />

            </Field>

          </FormSection>


          {/* ACTION */}

          <div className="sticky bottom-4 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <p className="text-sm text-slate-500">
                Saving changes does not change the
                job&apos;s published/closed status.
              </p>


              <div className="flex gap-3">

                <Link
                  href="/recruiter/dashboard"
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </Link>


                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </div>

          </div>

        </form>

      </section>

    </main>
  );
}


// =========================================================
// FORM SECTION
// =========================================================

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children:
    React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

      <h2 className="text-xl font-bold text-slate-950">
        {title}
      </h2>


      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>


      <div className="mt-6 space-y-5">
        {children}
      </div>

    </section>
  );
}


// =========================================================
// FIELD
// =========================================================

function Field({
  label,
  help,
  required,
  children,
}: {
  label: string;
  help?: string;
  required?: boolean;
  children:
    React.ReactNode;
}) {
  return (
    <div>

      <label className="text-sm font-semibold text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}

      </label>


      {help && (
        <p className="mt-1 text-xs text-slate-400">
          {help}
        </p>
      )}


      <div className="mt-2">
        {children}
      </div>

    </div>
  );
}


// =========================================================
// CLASSES
// =========================================================

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";


const textareaClass =
  "w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";