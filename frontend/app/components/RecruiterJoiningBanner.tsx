"use client";

import Link from "next/link";

export default function RecruiterJoiningBanner() {
  return (
    <section className="border-b border-blue-200 bg-gradient-to-r from-blue-50 via-white to-indigo-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-lg">
            🚀
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold text-slate-950">
                Recruiters are joining FresherHire
              </p>

              <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-green-700">
                Early Candidate Access
              </span>
            </div>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
              Register now and complete your profile with your resume, education,
              internships, projects, skills and assessments so recruiters can
              evaluate you when they start discovering candidates.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Link
            href="/signup/fresher"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Register as Fresher →
          </Link>

          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-center text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Complete My Profile
          </Link>
        </div>
      </div>
    </section>
  );
}
