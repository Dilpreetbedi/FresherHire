"use client";

import Link from "next/link";
import { useState } from "react";

export default function RecruiterPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // We will connect this to the database next.
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f9fd] px-4">
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-2xl font-black text-green-600">
            ✓
          </div>

          <h1 className="mt-6 text-3xl font-black text-slate-950">
            We&apos;ve received your request
          </h1>

          <p className="mt-4 leading-7 text-slate-600">
            Thank you for your interest in FresherHire. We&apos;ll review your
            company and hiring requirements before providing recruiter access.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="rounded-xl bg-slate-950 px-6 py-3 font-bold text-white transition hover:bg-blue-600"
            >
              Back to FresherHire
            </Link>

            <button
              onClick={() => setSubmitted(false)}
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f9fd] text-slate-900">
      {/* Navbar */}

      <nav className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-2xl font-black tracking-tight"
          >
            <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-slate-950 text-sm font-black text-white">
              F

              <span className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-violet-500" />
            </span>

            <span>
              Fresher<span className="text-blue-600">Hire</span>
            </span>
          </Link>

          <Link
            href="/"
            className="text-sm font-semibold text-slate-600 transition hover:text-blue-600"
          >
            ← Back to Home
          </Link>
        </div>
      </nav>

      <section className="relative overflow-hidden px-4 py-14 sm:px-6 md:py-20">
        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-blue-300/20 blur-[100px]" />

        <div className="absolute -right-40 top-40 h-96 w-96 rounded-full bg-violet-300/20 blur-[100px]" />

        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          {/* LEFT */}

          <div className="pt-4 lg:sticky lg:top-10">
            <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
              For Recruiters & Companies
            </span>

            <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
              Hire promising freshers
              <span className="block text-blue-600">
                with more confidence.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Tell us what you&apos;re hiring for. FresherHire helps companies
              discover 0–2 year candidates through richer profiles, projects,
              skills and assessments.
            </p>

            <div className="mt-10 space-y-5">
              <Benefit
                title="Fresher-focused talent"
                text="Discover candidates actively looking for internships and entry-level roles."
              />

              <Benefit
                title="More than a resume"
                text="Review education, projects, skills, experience and assessment information together."
              />

              <Benefit
                title="Better shortlisting"
                text="Compare candidates using structured profile information instead of manually reading every resume."
              />

              <Benefit
                title="Verified company access"
                text="Recruiter access is approved after company verification to keep FresherHire trustworthy."
              />
            </div>
          </div>

          {/* FORM */}

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_25px_70px_-30px_rgba(15,23,42,0.3)] sm:p-9">
            <div className="border-b border-slate-100 pb-7">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
                Contact Sales
              </p>

              <h2 className="mt-3 text-3xl font-black text-slate-950">
                Tell us about your hiring needs
              </h2>

              <p className="mt-3 leading-7 text-slate-600">
                Complete the form and we&apos;ll review your company details
                before enabling recruiter access.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-7">
              {/* Recruiter Details */}

              <FormSection
                number="01"
                title="Your Details"
                description="Tell us who we should contact."
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Full Name"
                  name="fullName"
                  placeholder="Your full name"
                  required
                />

                <Input
                  label="Work Email"
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  required
                />

                <Input
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  required
                />

                <Input
                  label="Designation"
                  name="designation"
                  placeholder="HR Manager / Founder"
                  required
                />
              </div>

              {/* Company */}

              <div className="border-t border-slate-100 pt-7">
                <FormSection
                  number="02"
                  title="Company Details"
                  description="Help us verify your organisation."
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Company Name"
                  name="companyName"
                  placeholder="Company name"
                  required
                />

                <Input
                  label="Company Website"
                  name="companyWebsite"
                  type="url"
                  placeholder="https://company.com"
                />

                <Select
                  label="Company Size"
                  name="companySize"
                  options={[
                    "1–10 employees",
                    "11–50 employees",
                    "51–200 employees",
                    "201–500 employees",
                    "501–1000 employees",
                    "1000+ employees",
                  ]}
                />

                <Select
                  label="Company Type"
                  name="companyType"
                  options={[
                    "Startup",
                    "Private Company",
                    "Public Company",
                    "Recruitment Agency",
                    "Consulting Company",
                    "Other",
                  ]}
                />
              </div>

              {/* Hiring */}

              <div className="border-t border-slate-100 pt-7">
                <FormSection
                  number="03"
                  title="Hiring Requirements"
                  description="Tell us the kind of freshers you're looking for."
                />
              </div>

              <Input
                label="Roles You're Hiring For"
                name="roles"
                placeholder="AI Engineer, Software Developer, Data Analyst..."
                required
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Number of Openings"
                  name="openings"
                  type="number"
                  placeholder="5"
                  required
                />

                <Input
                  label="Hiring Location"
                  name="location"
                  placeholder="Noida / Bangalore / Remote"
                  required
                />

                <Select
                  label="Job Type"
                  name="jobType"
                  options={[
                    "Full-time",
                    "Internship",
                    "Contract",
                    "Apprenticeship",
                    "Multiple",
                  ]}
                />

                <Select
                  label="Experience Requirement"
                  name="experience"
                  options={[
                    "Freshers only",
                    "0–1 year",
                    "0–2 years",
                    "Internship experience preferred",
                  ]}
                />
              </div>

              <Input
                label="Required Skills"
                name="skills"
                placeholder="Python, React, SQL, Communication..."
              />

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Additional Hiring Requirements
                </label>

                <textarea
                  name="requirements"
                  rows={5}
                  placeholder="Tell us about required skills, qualifications, salary range, joining timeline or any other requirements."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* Consent */}

              <label className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                <input
                  type="checkbox"
                  required
                  className="mt-1 h-4 w-4"
                />

                <span className="text-sm leading-6 text-slate-600">
                  I confirm that I represent the company mentioned above and
                  agree to be contacted by FresherHire regarding recruitment
                  services and recruiter access.
                </span>
              </label>

              <button
                type="submit"
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 font-black text-white shadow-xl shadow-blue-200 transition hover:-translate-y-0.5"
              >
                Submit Hiring Requirement
                <span className="transition group-hover:translate-x-1">
                  →
                </span>
              </button>

              <p className="text-center text-xs leading-5 text-slate-500">
                Recruiter accounts are currently approved after company
                verification.
              </p>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

function Benefit({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-green-100 text-sm font-black text-green-600">
        ✓
      </span>

      <div>
        <h3 className="font-black text-slate-900">
          {title}
        </h3>

        <p className="mt-1 text-sm leading-6 text-slate-600">
          {text}
        </p>
      </div>
    </div>
  );
}

function FormSection({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 flex gap-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-xs font-black text-white">
        {number}
      </span>

      <div>
        <h3 className="font-black text-slate-950">
          {title}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function Input({
  label,
  name,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-bold text-slate-700"
      >
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
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
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-bold text-slate-700"
      >
        {label}
      </label>

      <select
        id={name}
        name={name}
        defaultValue=""
        required
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
      >
        <option value="" disabled>
          Select an option
        </option>

        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}