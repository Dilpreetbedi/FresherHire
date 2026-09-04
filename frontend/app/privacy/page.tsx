"use client";

import Link from "next/link";

export default function PrivacyPage() {
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
            Legal
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Privacy Policy
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            Last updated: 4 September 2026
          </p>

          <div className="mt-8 space-y-8 text-sm leading-7 text-slate-700">
            <section>
              <h2 className="text-xl font-bold text-slate-950">
                1. About This Privacy Policy
              </h2>

              <p className="mt-3">
                This Privacy Policy explains how FresherHire collects, uses,
                stores, shares, and protects personal information when
                candidates, recruiters, and companies use the FresherHire
                platform.
              </p>

              <p className="mt-3">
                FresherHire is a recruitment technology platform for
                entry-level hiring. Candidates may create profiles, add skills,
                complete assessments, upload resumes, add work samples, and
                apply to jobs. Recruiters and companies may post jobs, discover
                candidates, review profile evidence, shortlist applicants, and
                manage hiring activity.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-950">
                2. Information We May Collect
              </h2>

              <p className="mt-3">
                Depending on how you use FresherHire, we may collect the
                following categories of information:
              </p>

              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>
                  Account information such as name, email address, account
                  type, and authentication details.
                </li>
                <li>
                  Candidate profile information such as qualification,
                  graduation year, location, preferred role, phone number,
                  skills, skill levels, and resume availability.
                </li>
                <li>
                  Candidate content such as resumes, projects, portfolio links,
                  work samples, cover letters, and job applications.
                </li>
                <li>
                  Assessment information such as completed assessments,
                  scores, verification status, and attempt history.
                </li>
                <li>
                  Recruiter and company information such as company name,
                  website, location, email address, job postings, hiring
                  activity, shortlist activity, and subscription information.
                </li>
                <li>
                  Transaction-related information such as plan purchased,
                  payment status, order identifiers, and billing-related
                  metadata received from a payment provider. FresherHire does
                  not need to store full card or bank credentials when those
                  details are handled directly by the payment provider.
                </li>
                <li>
                  Technical and usage information that may be generated when
                  you use the service, such as browser information, device
                  information, timestamps, feature usage, and service logs.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-950">
                3. How We Use Information
              </h2>

              <p className="mt-3">
                FresherHire may use personal information to:
              </p>

              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Create and manage user accounts.</li>
                <li>
                  Display candidate profiles and profile evidence to eligible
                  recruiters.
                </li>
                <li>
                  Enable job discovery, applications, shortlisting, hiring
                  workflows, and notifications.
                </li>
                <li>
                  Run assessments, calculate results, and display verification
                  indicators.
                </li>
                <li>
                  Provide recruiter search, applicant review, and hiring
                  analytics.
                </li>
                <li>
                  Manage recruiter plans, payments, and access to paid
                  features.
                </li>
                <li>
                  Protect the platform against abuse, fraud, unauthorized
                  access, and security threats.
                </li>
                <li>
                  Maintain, troubleshoot, improve, and develop FresherHire
                  services.
                </li>
                <li>
                  Respond to support, privacy, billing, or account-related
                  requests.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-950">
                4. Candidate Profile Visibility
              </h2>

              <p className="mt-3">
                Candidate profile information may be made visible to
                authenticated recruiters or companies where needed to support
                hiring and candidate discovery.
              </p>

              <p className="mt-3">
                Public or recruiter-visible profile information may include
                items such as name, qualification, graduation year, location,
                preferred role, skills, assessment results, project or work
                sample information, and whether a resume is available.
              </p>

              <p className="mt-3">
                Sensitive private details such as a candidate&apos;s direct
                contact information and private resume file may be subject to
                additional access controls and may only be disclosed when
                FresherHire&apos;s eligibility conditions for recruiter access
                are satisfied.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-950">
                5. Resume and Contact Information
              </h2>

              <p className="mt-3">
                Candidate resumes and contact details are intended to be
                treated as private hiring information. Recruiter access may
                depend on factors such as an eligible hiring relationship and
                an applicable recruiter plan.
              </p>

              <p className="mt-3">
                Where FresherHire provides temporary secure links to private
                resume files, those links may expire automatically and should
                not be shared beyond legitimate hiring purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-950">
                6. Assessments and Hiring Decisions
              </h2>

              <p className="mt-3">
                FresherHire may process assessment responses and scores to
                provide role-based assessment results and verification
                indicators.
              </p>

              <p className="mt-3">
                Assessment data and ranking or matching information are
                intended as decision-support information. Employers and
                recruiters remain responsible for their own hiring decisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-950">
                7. Sharing of Information
              </h2>

              <p className="mt-3">
                FresherHire may share information only as needed to operate the
                platform and provide requested services. This may include:
              </p>

              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>
                  Sharing candidate profile information with recruiters and
                  companies for legitimate recruitment purposes.
                </li>
                <li>
                  Sharing application information with the company associated
                  with the job a candidate applies to.
                </li>
                <li>
                  Using hosting, database, authentication, storage, payment,
                  analytics, email, or infrastructure service providers that
                  process information on FresherHire&apos;s behalf.
                </li>
                <li>
                  Disclosing information where required by law, regulation,
                  legal process, or a valid government request.
                </li>
                <li>
                  Disclosing information where reasonably necessary to protect
                  users, prevent fraud, investigate abuse, enforce platform
                  terms, or protect FresherHire&apos;s legal rights.
                </li>
              </ul>

              <p className="mt-3">
                FresherHire does not intend to sell candidate contact details
                as a standalone data product.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-950">
                8. Third-Party Service Providers
              </h2>

              <p className="mt-3">
                FresherHire may rely on third-party technology providers for
                services such as authentication, databases, file storage,
                cloud hosting, deployment, communications, analytics, and
                payments.
              </p>

              <p className="mt-3">
                These providers may process information according to their own
                privacy terms and the services they provide to FresherHire.
                Users should review relevant third-party policies where
                appropriate.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-950">
                9. Payment Information
              </h2>

              <p className="mt-3">
                Recruiter payments may be processed by an authorized payment
                gateway. Payment credentials such as card, UPI, or banking
                details may be collected directly by the payment provider
                rather than by FresherHire.
              </p>

              <p className="mt-3">
                FresherHire may retain transaction identifiers, plan details,
                payment status, and related records needed for account access,
                billing support, reconciliation, fraud prevention, and
                compliance.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-950">
                10. Data Storage and Security
              </h2>

              <p className="mt-3">
                FresherHire may use technical and organizational safeguards
                designed to protect personal information from unauthorized
                access, disclosure, alteration, or loss.
              </p>

              <p className="mt-3">
                No internet-based service can guarantee absolute security.
                Users should use strong credentials, keep account access
                private, and notify FresherHire if they believe their account
                has been compromised.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-950">
                11. Data Retention
              </h2>

              <p className="mt-3">
                FresherHire may retain information for as long as reasonably
                necessary to provide the service, maintain user accounts,
                preserve hiring records, resolve disputes, prevent fraud,
                enforce agreements, meet legal or accounting requirements, or
                protect legitimate business interests.
              </p>

              <p className="mt-3">
                Retention periods may vary depending on the type of
                information and the reason it is being processed.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-950">
                12. Your Choices and Requests
              </h2>

              <p className="mt-3">
                Subject to applicable law and platform capabilities, users may
                request access to, correction of, or deletion of certain
                personal information associated with their account.
              </p>

              <p className="mt-3">
                Some information may need to be retained where required for
                legal, security, fraud-prevention, billing, dispute-resolution,
                or record-keeping purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-950">
                13. Account Deletion
              </h2>

              <p className="mt-3">
                Users who want to request account deletion may contact
                FresherHire through the Contact Us page. FresherHire may need
                to verify the request before deleting or anonymizing eligible
                account information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-950">
                14. Cookies and Similar Technologies
              </h2>

              <p className="mt-3">
                FresherHire or its service providers may use cookies, browser
                storage, session technologies, or similar mechanisms where
                needed for authentication, security, preferences, platform
                functionality, and service improvement.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-950">
                15. Children&apos;s Privacy
              </h2>

              <p className="mt-3">
                FresherHire is intended for users participating in education,
                employment, recruitment, and hiring activities. Users should
                not provide personal information if they are not legally able
                to use the service or provide the required consent under
                applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-950">
                16. Changes to This Policy
              </h2>

              <p className="mt-3">
                FresherHire may update this Privacy Policy when platform
                features, business practices, technology, or legal requirements
                change. The revised policy will be posted on this page with an
                updated date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-950">
                17. Contact Us
              </h2>

              <p className="mt-3">
                For privacy questions, data requests, account deletion
                requests, or concerns about how information is handled, users
                may contact FresherHire through the Contact Us page available
                on the website.
              </p>
            </section>
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
            href="/"
            className="font-semibold text-slate-600 hover:text-slate-950"
          >
            Home
          </Link>
        </div>

        <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-5 text-slate-500">
          This page is a general operational privacy-policy draft for FresherHire.
          Review it against your actual data practices and final legal requirements
          before commercial launch.
        </p>
      </section>
    </main>
  );
}
