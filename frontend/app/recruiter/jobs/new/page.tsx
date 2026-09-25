"use client";

import Link from "next/link";
import {
  FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";

export default function PostJobPage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const form =
      new FormData(e.currentTarget);

    const optional = (
      name: string
    ) => {
      const value =
        form
          .get(name)
          ?.toString()
          .trim();

      return value || null;
    };

    const payload = {
      title:
        form
          .get("title")
          ?.toString()
          .trim(),

      description:
        form
          .get("description")
          ?.toString()
          .trim(),

      skills:
        form
          .get("skills")
          ?.toString()
          .trim(),

      location:
        form
          .get("location")
          ?.toString()
          .trim(),

      employment_type:
        form
          .get("employmentType")
          ?.toString(),

      workplace_type:
        form
          .get("workplaceType")
          ?.toString(),

      openings: Number(
        form.get("openings")
      ),

      experience:
        form
          .get("experience")
          ?.toString(),

      salary:
        optional("salary"),

      eligibility:
        optional("eligibility"),
    };

    try {
      const response =
        await fetch(
          `${apiUrl}/api/recruiter/jobs`,
          {
            method: "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              payload
            ),
          }
        );

      const data =
        await response.json();

      if (
        response.status === 401
      ) {
        router.replace(
          "/recruiter/login"
        );

        return;
      }

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to publish job."
        );
      }

      router.push(
        "/recruiter/dashboard"
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to publish job."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f9fd]">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/recruiter/dashboard"
            className="text-xl font-black"
          >
            Fresher
            <span className="text-blue-600">
              Hire
            </span>
          </Link>

          <Link
            href="/recruiter/dashboard"
            className="text-sm font-bold text-slate-600"
          >
            ← Dashboard
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
            Recruiter
          </p>

          <h1 className="mt-3 text-4xl font-black">
            Post a new job
          </h1>

          <p className="mt-3 text-slate-600">
            Create an opportunity for
            fresher and early-career
            candidates.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-7 rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-9"
        >
          <Field
            label="Job Title"
            name="title"
            placeholder="AI Engineer"
          />

          <TextArea
            label="Job Description"
            name="description"
            placeholder="Describe the role, responsibilities and what the candidate will work on..."
          />

          <Field
            label="Required Skills"
            name="skills"
            placeholder="Python, FastAPI, LLMs, RAG"
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Location"
              name="location"
              placeholder="Noida"
            />

            <Field
              label="Openings"
              name="openings"
              type="number"
              placeholder="2"
              min="1"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Select
              label="Employment Type"
              name="employmentType"
              options={[
                "Full-time",
                "Internship",
                "Contract",
              ]}
            />

            <Select
              label="Workplace Type"
              name="workplaceType"
              options={[
                "On-site",
                "Hybrid",
                "Remote",
              ]}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Select
              label="Experience"
              name="experience"
              options={[
                "Fresher",
                "0-1 years",
                "0-2 years",
                "1-2 years",
              ]}
            />

            <Field
              label="Salary"
              name="salary"
              placeholder="₹4 - ₹6 LPA"
              required={false}
            />
          </div>

          <TextArea
            label="Eligibility"
            name="eligibility"
            placeholder="B.Tech/B.E./BCA/MCA, 2025 or 2026 graduates..."
            required={false}
          />

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
            <Link
              href="/recruiter/dashboard"
              className="rounded-xl border border-slate-200 px-6 py-3.5 text-center font-bold text-slate-700"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-7 py-3.5 font-black text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading
                ? "Publishing..."
                : "Publish Job →"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}


function Field({
  label,
  name,
  placeholder,
  type = "text",
  required = true,
  min,
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
  required?: boolean;
  min?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <input
        name={name}
        type={type}
        min={min}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}


function TextArea({
  label,
  name,
  placeholder,
  required = true,
}: {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <textarea
        name={name}
        required={required}
        rows={6}
        placeholder={placeholder}
        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}


function Select({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <select
        name={name}
        required
        defaultValue=""
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none focus:border-blue-400"
      >
        <option
          value=""
          disabled
        >
          Select
        </option>

        {options.map(
          (option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          )
        )}
      </select>
    </div>
  );
}