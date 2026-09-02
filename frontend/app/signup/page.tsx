"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-12 text-slate-900 sm:px-6 sm:py-16">

      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-blue-100 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-cyan-100 blur-3xl" />
      </div>

      <div className="mx-auto max-w-5xl">

        <div className="text-center">

          <Link
            href="/"
            className="text-3xl font-bold tracking-tight text-slate-950"
          >
            Fresher
            <span className="text-blue-600">
              Hire
            </span>
          </Link>

          <div className="mx-auto mt-10 max-w-3xl">

            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              Get Started
            </p>

            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
              How do you want to use FresherHire?
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600">
              Choose the account type that matches what you want to do.
            </p>

          </div>

        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">

          <button
            type="button"
            onClick={() =>
              router.push(
                "/signup/fresher"
              )
            }
            className="group rounded-3xl border border-slate-200 bg-white p-7 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg sm:p-9"
          >

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
              👨‍💻
            </div>

            <p className="mt-7 text-sm font-semibold uppercase tracking-wide text-blue-600">
              Candidate
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              I&apos;m a Fresher
            </h2>

            <p className="mt-4 leading-7 text-slate-600">
              Create your profile, prove your skills, discover entry-level opportunities and get noticed by companies.
            </p>

            <div className="mt-8 inline-flex items-center gap-2 font-semibold text-blue-600 transition group-hover:gap-3">
              Create Fresher Profile
              <span>→</span>
            </div>

          </button>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/signup/company"
              )
            }
            className="group rounded-3xl border border-slate-200 bg-white p-7 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg sm:p-9"
          >

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
              🏢
            </div>

            <p className="mt-7 text-sm font-semibold uppercase tracking-wide text-blue-600">
              Employer
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              I&apos;m Hiring
            </h2>

            <p className="mt-4 leading-7 text-slate-600">
              Post jobs, discover verified fresher talent and evaluate candidates using skills, assessments and projects.
            </p>

            <div className="mt-8 inline-flex items-center gap-2 font-semibold text-blue-600 transition group-hover:gap-3">
              Create Company Account
              <span>→</span>
            </div>

          </button>

        </div>

        <div className="mt-10 text-center">

          <p className="text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Sign in
            </Link>
          </p>

        </div>

      </div>

    </main>
  );
}
