"use client";

import Link from "next/link";

const SUPPORT_EMAIL = "bedidilpreet20@gmail.com";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight text-slate-950"
          >
            Fresher<span className="text-blue-600">Hire</span>
          </Link>

          <Link
            href="/"
            className="text-sm font-semibold text-slate-600 hover:text-slate-950"
          >
            ← Back to Home
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
            Support
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Contact Us
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            Need help with your FresherHire account, recruiter plan, payment,
            privacy request, or hiring workflow? Contact us and we&apos;ll review
            your request.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-semibold text-blue-600">
                General Support
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-950">
                Email FresherHire
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                For account support, recruiter questions, billing, refunds,
                privacy requests, or general enquiries.
              </p>

              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                {SUPPORT_EMAIL}
              </a>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-semibold text-blue-600">
                Response Information
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-950">
                What to include
              </h2>

              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
                <li>Your registered email address</li>
                <li>Your name or company name</li>
                <li>A short description of the issue</li>
                <li>Order or transaction reference for payment issues</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-950">
              Candidate Support
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-600">
              Candidates can contact FresherHire regarding account access,
              profile information, assessments, applications, resumes, privacy,
              or account deletion requests. FresherHire does not charge
              candidates for job placement and does not guarantee employment,
              interviews, or job offers.
            </p>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-950">
              Recruiter & Company Support
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-600">
              Companies and recruiters can contact FresherHire regarding job
              posting, candidate discovery, assessments, shortlisting,
              subscription access, billing, payments, refunds, and recruiter
              account issues.
            </p>
          </div>

          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-semibold text-amber-900">
              Important before publishing
            </p>

            <p className="mt-2 text-sm leading-6 text-amber-800">
              Replace the placeholder support email in this file with your real
              business support email before deploying this page or submitting
              FresherHire for payment-provider review.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
          <Link
            href="/terms"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Terms & Conditions
          </Link>

          <Link
            href="/privacy"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Privacy Policy
          </Link>

          <Link
            href="/refund-policy"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Refund & Cancellation
          </Link>

          <Link
            href="/"
            className="font-semibold text-slate-600 hover:text-slate-950"
          >
            Home
          </Link>
        </div>
      </section>
    </main>
  );
}