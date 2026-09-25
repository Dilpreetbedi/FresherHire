"use client";

import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  useState,
} from "react";

type CompanyLeadForm = {
  fullName: string;
  workEmail: string;
  phone: string;
  designation: string;

  companyName: string;
  companyWebsite: string;
  companySize: string;
  companyType: string;

  roles: string;
  openings: string;
  location: string;
  jobType: string;
  experience: string;

  skills: string;
  requirements: string;
};

const initialForm: CompanyLeadForm = {
  fullName: "",
  workEmail: "",
  phone: "",
  designation: "",

  companyName: "",
  companyWebsite: "",
  companySize: "",
  companyType: "",

  roles: "",
  openings: "1",
  location: "",
  jobType: "",
  experience: "",

  skills: "",
  requirements: "",
};

export default function CompanySignupPage() {
  const [formData, setFormData] =
    useState<CompanyLeadForm>(initialForm);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [submitted, setSubmitted] =
    useState(false);

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";

  function handleChange(
    event: ChangeEvent<
      HTMLInputElement |
      HTMLSelectElement |
      HTMLTextAreaElement
    >
  ) {
    const { name, value } =
      event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  }

  function normalizeWebsite(
    website: string
  ) {
    const value = website.trim();

    if (!value) {
      return null;
    }

    if (
      value.startsWith("http://") ||
      value.startsWith("https://")
    ) {
      return value;
    }

    return `https://${value}`;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const openings =
        Number(formData.openings);

      if (
        !Number.isInteger(openings) ||
        openings < 1
      ) {
        throw new Error(
          "Openings must be at least 1."
        );
      }

      const payload = {
        full_name:
          formData.fullName.trim(),

        work_email:
          formData.workEmail
            .trim()
            .toLowerCase(),

        phone:
          formData.phone.trim(),

        designation:
          formData.designation.trim(),

        company_name:
          formData.companyName.trim(),

        company_website:
          normalizeWebsite(
            formData.companyWebsite
          ),

        company_size:
          formData.companySize.trim(),

        company_type:
          formData.companyType.trim(),

        roles:
          formData.roles.trim(),

        openings,

        location:
          formData.location.trim(),

        job_type:
          formData.jobType.trim(),

        experience:
          formData.experience.trim(),

        skills:
          formData.skills.trim()
            ? formData.skills.trim()
            : null,

        requirements:
          formData.requirements.trim()
            ? formData.requirements.trim()
            : null,
      };

      const response = await fetch(
        `${apiUrl}/api/recruiter-leads`,
        {
          method: "POST",

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
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        if (
          response.status === 422
        ) {
          console.error(
            "Recruiter lead validation error:",
            data
          );

          throw new Error(
            "Some information is invalid or missing. Please check the form and try again."
          );
        }

        throw new Error(
          data?.detail ||
            "Unable to submit your hiring request."
        );
      }

      console.log(
        "Recruiter lead submitted:",
        data
      );

      setSubmitted(true);
      setFormData(initialForm);
    } catch (err) {
      console.error(
        "Hiring request error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-blue-100 blur-3xl" />

          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-cyan-100 blur-3xl" />
        </div>

        <nav className="border-b border-slate-200 bg-white/90 backdrop-blur">
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

            <Link
              href="/"
              className="text-sm font-semibold text-slate-500 transition hover:text-slate-950"
            >
              Home
            </Link>
          </div>
        </nav>

        <section className="mx-auto flex max-w-2xl items-center px-4 py-20 sm:px-6">
          <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50 sm:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-3xl font-black text-green-600">
              ✓
            </div>

            <p className="mt-7 text-xs font-black uppercase tracking-[0.22em] text-green-600">
              Request Submitted
            </p>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Your hiring request is
              under review
            </h1>

            <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-slate-600">
              We have received your
              company and hiring details.
              FresherHire will review the
              request before recruiter
              access is enabled.
            </p>

            <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
              <StepCard
                number="01"
                title="Request received"
                description="Your hiring requirement has been submitted."
              />

              <StepCard
                number="02"
                title="Admin review"
                description="FresherHire reviews the company and requirement."
              />

              <StepCard
                number="03"
                title="Recruiter access"
                description="Approved recruiters receive login credentials."
              />
            </div>

            <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-left">
              <p className="font-bold text-blue-950">
                What happens next?
              </p>

              <p className="mt-2 text-sm leading-6 text-blue-800">
                If your request is
                approved, a recruiter
                account can be created
                for the work email you
                submitted. You can then
                sign in and manage jobs,
                applicants and hiring
                activity.
              </p>
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  setSubmitted(false)
                }
                className="rounded-xl bg-slate-950 px-6 py-3.5 font-bold text-white transition hover:bg-blue-600"
              >
                Submit Another Request
              </button>

              <Link
                href="/recruiter/login"
                className="rounded-xl border border-slate-200 bg-white px-6 py-3.5 font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Recruiter Login
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-blue-100 blur-3xl" />

        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-cyan-100 blur-3xl" />
      </div>

      <nav className="border-b border-slate-200 bg-white/90 backdrop-blur">
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

          <div className="flex items-center gap-5">
            <Link
              href="/recruiter/login"
              className="hidden text-sm font-semibold text-slate-600 transition hover:text-blue-600 sm:block"
            >
              Recruiter Login
            </Link>

            <Link
              href="/signup"
              className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
            >
              ← Back
            </Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
            Hire Fresh Talent
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Tell us who you&apos;re
            looking for.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-600">
            Submit your company and hiring
            requirement. FresherHire reviews
            recruiter requests before
            providing platform access.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/50"
        >
          <FormSection
            number="01"
            eyebrow="Recruiter"
            title="Tell us about you"
            description="Who should FresherHire contact regarding this hiring requirement?"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Full Name"
                required
              >
                <input
                  name="fullName"
                  value={
                    formData.fullName
                  }
                  onChange={handleChange}
                  required
                  autoComplete="name"
                  placeholder="e.g. Rahul Sharma"
                  className={inputClass}
                />
              </Field>

              <Field
                label="Work Email"
                required
              >
                <input
                  type="email"
                  name="workEmail"
                  value={
                    formData.workEmail
                  }
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  placeholder="rahul@company.com"
                  className={inputClass}
                />
              </Field>

              <Field
                label="Phone Number"
                required
              >
                <input
                  type="tel"
                  name="phone"
                  value={
                    formData.phone
                  }
                  onChange={handleChange}
                  required
                  autoComplete="tel"
                  placeholder="+91 98765 43210"
                  className={inputClass}
                />
              </Field>

              <Field
                label="Designation"
                required
              >
                <input
                  name="designation"
                  value={
                    formData.designation
                  }
                  onChange={handleChange}
                  required
                  placeholder="e.g. HR Manager"
                  className={inputClass}
                />
              </Field>
            </div>
          </FormSection>

          <FormSection
            number="02"
            eyebrow="Company"
            title="Company details"
            description="This helps us review and verify the hiring organisation."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Company Name"
                required
              >
                <input
                  name="companyName"
                  value={
                    formData.companyName
                  }
                  onChange={handleChange}
                  required
                  autoComplete="organization"
                  placeholder="e.g. Acme Technologies"
                  className={inputClass}
                />
              </Field>

              <Field label="Company Website">
                <input
                  name="companyWebsite"
                  value={
                    formData.companyWebsite
                  }
                  onChange={handleChange}
                  inputMode="url"
                  placeholder="company.com"
                  className={inputClass}
                />
              </Field>

              <Field
                label="Company Size"
                required
              >
                <select
                  name="companySize"
                  value={
                    formData.companySize
                  }
                  onChange={handleChange}
                  required
                  className={inputClass}
                >
                  <option value="">
                    Select company size
                  </option>

                  <option value="1-10">
                    1-10 employees
                  </option>

                  <option value="11-50">
                    11-50 employees
                  </option>

                  <option value="51-200">
                    51-200 employees
                  </option>

                  <option value="201-500">
                    201-500 employees
                  </option>

                  <option value="501-1000">
                    501-1000 employees
                  </option>

                  <option value="1000+">
                    1000+ employees
                  </option>
                </select>
              </Field>

              <Field
                label="Company Type"
                required
              >
                <select
                  name="companyType"
                  value={
                    formData.companyType
                  }
                  onChange={handleChange}
                  required
                  className={inputClass}
                >
                  <option value="">
                    Select company type
                  </option>

                  <option value="Startup">
                    Startup
                  </option>

                  <option value="Private">
                    Private Company
                  </option>

                  <option value="Public">
                    Public Company
                  </option>

                  <option value="Agency">
                    Recruitment Agency
                  </option>

                  <option value="Consulting">
                    Consulting
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>
              </Field>
            </div>
          </FormSection>

          <FormSection
            number="03"
            eyebrow="Hiring"
            title="What are you hiring for?"
            description="Share the role and hiring requirement so we can understand what you need."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Role(s) Hiring For"
                required
              >
                <input
                  name="roles"
                  value={
                    formData.roles
                  }
                  onChange={handleChange}
                  required
                  placeholder="e.g. AI Engineer, Backend Developer"
                  className={inputClass}
                />
              </Field>

              <Field
                label="Number of Openings"
                required
              >
                <input
                  type="number"
                  name="openings"
                  value={
                    formData.openings
                  }
                  onChange={handleChange}
                  required
                  min={1}
                  step={1}
                  className={inputClass}
                />
              </Field>

              <Field
                label="Hiring Location"
                required
              >
                <input
                  name="location"
                  value={
                    formData.location
                  }
                  onChange={handleChange}
                  required
                  placeholder="e.g. Noida / Remote"
                  className={inputClass}
                />
              </Field>

              <Field
                label="Job Type"
                required
              >
                <select
                  name="jobType"
                  value={
                    formData.jobType
                  }
                  onChange={handleChange}
                  required
                  className={inputClass}
                >
                  <option value="">
                    Select job type
                  </option>

                  <option value="Full-time">
                    Full-time
                  </option>

                  <option value="Internship">
                    Internship
                  </option>

                  <option value="Part-time">
                    Part-time
                  </option>

                  <option value="Contract">
                    Contract
                  </option>
                </select>
              </Field>

              <Field
                label="Experience Required"
                required
              >
                <select
                  name="experience"
                  value={
                    formData.experience
                  }
                  onChange={handleChange}
                  required
                  className={inputClass}
                >
                  <option value="">
                    Select experience
                  </option>

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

              <Field label="Preferred Skills">
                <input
                  name="skills"
                  value={
                    formData.skills
                  }
                  onChange={handleChange}
                  placeholder="e.g. Python, React, SQL"
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="mt-5">
              <Field label="Additional Requirements">
                <textarea
                  name="requirements"
                  value={
                    formData.requirements
                  }
                  onChange={handleChange}
                  rows={5}
                  placeholder="Tell us about eligibility, role expectations, preferred qualifications or anything else that would help us understand your hiring requirement."
                  className={`${inputClass} resize-none`}
                />
              </Field>
            </div>
          </FormSection>

          <div className="border-t border-slate-100 bg-slate-50/70 p-6 sm:p-8">
            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-950 px-6 py-4 font-black text-white shadow-sm transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Submitting Request..."
                : "Submit Hiring Request →"}
            </button>

            <p className="mt-4 text-center text-xs leading-5 text-slate-500">
              Submitting a request does not
              automatically create recruiter
              access. FresherHire reviews
              company requests before account
              activation.
            </p>

            <p className="mt-3 text-center text-xs text-slate-400">
              By submitting this form, you
              agree to FresherHire&apos;s{" "}
              <Link
                href="/terms"
                className="font-semibold text-blue-600"
              >
                Terms
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="font-semibold text-blue-600"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </form>

        <p className="mt-7 text-center text-sm text-slate-500">
          Already approved?{" "}
          <Link
            href="/recruiter/login"
            className="font-bold text-blue-600 transition hover:text-blue-700"
          >
            Recruiter Sign In
          </Link>
        </p>
      </section>
    </main>
  );
}

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-bold text-slate-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      {children}
    </div>
  );
}

function FormSection({
  number,
  eyebrow,
  title,
  description,
  children,
}: {
  number: string;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-slate-100 p-6 last:border-b-0 sm:p-8">
      <div className="mb-7 flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-black text-blue-600">
          {number}
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
            {eyebrow}
          </p>

          <h2 className="mt-1 text-xl font-black text-slate-950">
            {title}
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black text-blue-600">
        {number}
      </p>

      <p className="mt-2 font-black text-slate-900">
        {title}
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}