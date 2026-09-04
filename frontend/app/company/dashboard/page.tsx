"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { requireCompany } from "../../lib/auth";
import NotificationBell from "../../components/NotificationBell";

type Company = {
  id: string;
  company_name: string;
  email: string;
  website: string | null;
  location: string | null;
  description?: string | null;
};

type Job = {
  id: number;
  company_id: string;
  title: string;
  is_active: boolean;
  created_at: string;
};

type Application = {
  id: number;
  job_id: number;
  candidate_id: string;
  status: "applied" | "shortlisted" | "rejected" | "hired";
  created_at: string;
};

type CandidateProfile = {
  id: string;
  full_name: string;
  preferred_role: string | null;
  location: string | null;
};

type RecentApplicant = Application & {
  candidate: CandidateProfile | null;
  job: Job | null;
};

type JobPerformance = Job & {
  applicants: number;
  shortlisted: number;
  hired: number;
};

export default function CompanyDashboard() {
  const router = useRouter();

  const [company, setCompany] = useState<Company | null>(null);

  const [jobs, setJobs] = useState<Job[]>([]);

  const [applications, setApplications] = useState<Application[]>([]);

  const [candidateProfiles, setCandidateProfiles] = useState<
    CandidateProfile[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const auth = await requireCompany();

      if (!auth.allowed) {
        router.replace(auth.redirectTo!);
        return;
      }

      const user = auth.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (companyError) {
        console.error("Company error:", companyError);

        setError(
          companyError.message ||
            "Could not load company information."
        );

        setLoading(false);
        return;
      }

      if (!companyData) {
        setCompany(null);
        setLoading(false);
        return;
      }

      setCompany(companyData);

      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select(`
          id,
          company_id,
          title,
          is_active,
          created_at
        `)
        .eq("company_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (jobsError) {
        console.error("Jobs error:", jobsError);

        setError(jobsError.message);
        setLoading(false);
        return;
      }

      const companyJobs = jobsData || [];

      setJobs(companyJobs);

      if (companyJobs.length === 0) {
        setApplications([]);
        setCandidateProfiles([]);
        setLoading(false);
        return;
      }

      const jobIds = companyJobs.map((job) => job.id);

      const { data: applicationsData, error: applicationsError } =
        await supabase
          .from("applications")
          .select(`
            id,
            job_id,
            candidate_id,
            status,
            created_at
          `)
          .in("job_id", jobIds)
          .order("created_at", {
            ascending: false,
          });

      if (applicationsError) {
        console.error("Applications error:", applicationsError);

        setError(applicationsError.message);
        setLoading(false);
        return;
      }

      const companyApplications =
        (applicationsData || []) as Application[];

      setApplications(companyApplications);

      const candidateIds = Array.from(
        new Set(
          companyApplications.map(
            (application) =>
              application.candidate_id
          )
        )
      );

      if (candidateIds.length > 0) {
        const { data: profilesData, error: profilesError } =
          await supabase
            .from("recruiter_profiles")
            .select(`
              id,
              full_name,
              preferred_role,
              location
            `)
            .in("id", candidateIds);

        if (profilesError) {
          console.error(
            "Applicant profiles error:",
            profilesError
          );
        } else {
          setCandidateProfiles(
            profilesData || []
          );
        }
      } else {
        setCandidateProfiles([]);
      }

      setLoading(false);
    } catch (err) {
      console.error(
        "Unexpected dashboard error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );

      setLoading(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const totalJobs = jobs.length;

  const activeJobs = jobs.filter(
    (job) => job.is_active
  ).length;

  const totalApplicants = applications.length;

  const shortlistedCount =
    applications.filter(
      (application) =>
        application.status === "shortlisted"
    ).length;

  const hiredCount =
    applications.filter(
      (application) =>
        application.status === "hired"
    ).length;

  const rejectedCount =
    applications.filter(
      (application) =>
        application.status === "rejected"
    ).length;

  const currentlyAppliedCount =
    applications.filter(
      (application) =>
        application.status === "applied"
    ).length;

  const jobPerformance =
    useMemo<JobPerformance[]>(() => {
      return jobs
        .map((job) => {
          const jobApplications =
            applications.filter(
              (application) =>
                application.job_id === job.id
            );

          return {
            ...job,
            applicants:
              jobApplications.length,
            shortlisted:
              jobApplications.filter(
                (application) =>
                  application.status ===
                  "shortlisted"
              ).length,
            hired:
              jobApplications.filter(
                (application) =>
                  application.status === "hired"
              ).length,
          };
        })
        .sort(
          (a, b) =>
            b.applicants -
            a.applicants
        );
    }, [jobs, applications]);

  const topJob =
    jobPerformance.length > 0
      ? jobPerformance[0]
      : null;

  const recentApplicants =
    useMemo<RecentApplicant[]>(() => {
      return applications
        .slice(0, 5)
        .map((application) => ({
          ...application,
          candidate:
            candidateProfiles.find(
              (candidate) =>
                candidate.id ===
                application.candidate_id
            ) || null,
          job:
            jobs.find(
              (job) =>
                job.id ===
                application.job_id
            ) || null,
        }));
    }, [
      applications,
      candidateProfiles,
      jobs,
    ]);

  const applicantPercent =
    totalApplicants > 0
      ? 100
      : 0;

  const shortlistPercent =
    totalApplicants > 0
      ? Math.round(
          (shortlistedCount /
            totalApplicants) *
            100
        )
      : 0;

  const hiredPercent =
    totalApplicants > 0
      ? Math.round(
          (hiredCount /
            totalApplicants) *
            100
        )
      : 0;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <div className="text-center">
          <div className="text-lg font-semibold">
            Loading dashboard...
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Loading company analytics
          </p>
        </div>
      </main>
    );
  }

  if (!company) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">

        <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
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

            <div className="flex items-center gap-3">

              <NotificationBell />

              <button
                onClick={logout}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Sign Out
              </button>

            </div>

          </div>
        </nav>

        <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-20">

          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-2xl">
              🏢
            </div>

            <h1 className="mt-6 text-3xl font-bold text-slate-950">
              Complete Your Company Profile
            </h1>

            <p className="mt-4 leading-7 text-slate-600">
              We couldn&apos;t find a company profile for your account. Create your company profile to start posting jobs and discovering entry-level candidates.
            </p>

            {error && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-left text-sm text-red-700">
                <p className="font-semibold">
                  Error
                </p>

                <p className="mt-1">
                  {error}
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">

              <Link
                href="/company/profile"
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Create Company Profile →
              </Link>

              <Link
                href="/"
                className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Back
              </Link>

            </div>

          </div>

        </section>

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

          <div className="flex items-center gap-3 sm:gap-5">

            <Link
              href="/company/candidates"
              className="hidden text-sm font-medium text-slate-600 hover:text-slate-950 md:block"
            >
              Find Freshers
            </Link>

            <Link
              href="/company/jobs"
              className="hidden text-sm font-medium text-slate-600 hover:text-slate-950 md:block"
            >
              My Jobs
            </Link>

            <Link
              href="/company/shortlisted"
              className="hidden text-sm font-medium text-slate-600 hover:text-slate-950 lg:block"
            >
              Shortlisted
            </Link>

            <Link
              href="/company/pricing"
              className="hidden text-sm font-medium text-slate-600 hover:text-slate-950 lg:block"
            >
              Plans
            </Link>

            <NotificationBell />

            <button
              onClick={logout}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Sign Out
            </button>

          </div>

        </div>

      </nav>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">

        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">

          <div>

            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              Company Dashboard
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Welcome,{" "}
              {company.company_name ||
                "Company"}{" "}
              👋
            </h1>

            <p className="mt-3 max-w-3xl leading-7 text-slate-600">
              Track your hiring pipeline, review applicants and discover freshers across technical and non-technical roles using skills, verified assessments and work evidence.
            </p>

          </div>

          <Link
            href="/company/jobs/create"
            className="w-fit rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            + Post New Job
          </Link>

        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="mt-8">

          <div>

            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
              Hiring Analytics
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              Recruitment Overview
            </h2>

          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

            <AnalyticsCard
              label="Total Jobs"
              value={totalJobs}
              icon="💼"
            />

            <AnalyticsCard
              label="Active Jobs"
              value={activeJobs}
              icon="🟢"
            />

            <AnalyticsCard
              label="Applicants"
              value={totalApplicants}
              icon="👥"
            />

            <AnalyticsCard
              label="Shortlisted"
              value={shortlistedCount}
              icon="⭐"
            />

            <AnalyticsCard
              label="Hired"
              value={hiredCount}
              icon="🎉"
              highlight
            />

          </div>

        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7 lg:col-span-2">

            <div>

              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                Recruitment Funnel
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                Applicant Pipeline
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Track candidates as they move through your hiring process.
              </p>

            </div>

            <div className="mt-7 space-y-6">

              <FunnelRow
                label="Total Applicants"
                value={totalApplicants}
                percentage={applicantPercent}
              />

              <FunnelRow
                label="Currently Applied"
                value={currentlyAppliedCount}
                percentage={
                  totalApplicants > 0
                    ? Math.round(
                        (currentlyAppliedCount /
                          totalApplicants) *
                          100
                      )
                    : 0
                }
              />

              <FunnelRow
                label="Shortlisted"
                value={shortlistedCount}
                percentage={shortlistPercent}
              />

              <FunnelRow
                label="Hired"
                value={hiredCount}
                percentage={hiredPercent}
              />

            </div>

            {totalApplicants > 0 && (
              <div className="mt-7 grid gap-3 sm:grid-cols-3">

                <MiniStat
                  label="Shortlist Rate"
                  value={`${shortlistPercent}%`}
                />

                <MiniStat
                  label="Hire Rate"
                  value={`${hiredPercent}%`}
                />

                <MiniStat
                  label="Rejected"
                  value={rejectedCount}
                />

              </div>
            )}

          </section>

          <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 sm:p-7">

            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
              Top Performing Job
            </p>

            {topJob && topJob.applicants > 0 ? (
              <>

                <h2 className="mt-4 text-xl font-bold text-slate-950">
                  {topJob.title}
                </h2>

                <div className="mt-6 text-4xl font-bold text-slate-950">
                  {topJob.applicants}
                </div>

                <p className="mt-1 text-sm text-slate-600">
                  total applicants
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">

                  <MiniStat
                    label="Shortlisted"
                    value={topJob.shortlisted}
                  />

                  <MiniStat
                    label="Hired"
                    value={topJob.hired}
                  />

                </div>

                <Link
                  href={`/company/jobs/${topJob.id}/applicants`}
                  className="mt-6 block rounded-xl bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  View Applicants →
                </Link>

              </>
            ) : (

              <div className="mt-6">

                <div className="text-3xl">
                  📊
                </div>

                <h3 className="mt-4 font-semibold text-slate-950">
                  No applicant data yet
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Applicant analytics will appear once candidates start applying to your jobs.
                </p>

                <Link
                  href="/company/jobs/create"
                  className="mt-5 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Post a Job →
                </Link>

              </div>
            )}

          </section>

        </div>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div>

              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                Job Performance
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                Applications by Job
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                See which opportunities are attracting the most candidates.
              </p>

            </div>

            <Link
              href="/company/jobs"
              className="w-fit rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Manage Jobs →
            </Link>

          </div>

          {jobPerformance.length === 0 ? (

            <div className="mt-7 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">

              <p className="font-semibold text-slate-950">
                No jobs posted yet
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Post your first opportunity to start receiving applications.
              </p>

              <Link
                href="/company/jobs/create"
                className="mt-5 inline-block rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Post First Job
              </Link>

            </div>

          ) : (

            <div className="mt-7 overflow-x-auto">

              <table className="w-full min-w-[700px] text-left">

                <thead>

                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">

                    <th className="pb-4 font-medium">
                      Job
                    </th>

                    <th className="pb-4 font-medium">
                      Status
                    </th>

                    <th className="pb-4 text-center font-medium">
                      Applicants
                    </th>

                    <th className="pb-4 text-center font-medium">
                      Shortlisted
                    </th>

                    <th className="pb-4 text-center font-medium">
                      Hired
                    </th>

                    <th className="pb-4 text-right font-medium">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {jobPerformance.map((job) => (

                    <tr
                      key={job.id}
                      className="border-b border-slate-100"
                    >

                      <td className="py-5">
                        <p className="font-semibold text-slate-950">
                          {job.title}
                        </p>
                      </td>

                      <td className="py-5">

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-medium ${
                            job.is_active
                              ? "border-green-200 bg-green-50 text-green-700"
                              : "border-slate-200 bg-slate-100 text-slate-600"
                          }`}
                        >
                          {job.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>

                      </td>

                      <td className="py-5 text-center font-semibold text-slate-900">
                        {job.applicants}
                      </td>

                      <td className="py-5 text-center text-slate-700">
                        {job.shortlisted}
                      </td>

                      <td className="py-5 text-center font-semibold text-green-700">
                        {job.hired}
                      </td>

                      <td className="py-5 text-right">

                        <Link
                          href={`/company/jobs/${job.id}/applicants`}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                          Applicants →
                        </Link>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">

          <div>

            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
              Recent Activity
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              Recent Applicants
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Open a candidate profile to review their role, skills, verified assessments and work samples.
            </p>

          </div>

          {recentApplicants.length === 0 ? (

            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">

              <div className="text-3xl">
                👥
              </div>

              <p className="mt-4 font-semibold text-slate-950">
                No applications yet
              </p>

              <p className="mt-2 text-sm text-slate-500">
                New candidate applications will appear here.
              </p>

            </div>

          ) : (

            <div className="mt-6 space-y-3">

              {recentApplicants.map((application) => (

                <div
                  key={application.id}
                  className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center"
                >

                  <div className="flex items-center gap-4">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                      {application.candidate?.full_name
                        ?.charAt(0)
                        .toUpperCase() || "?"}
                    </div>

                    <div>

                      <p className="font-semibold text-slate-950">
                        {application.candidate?.full_name ||
                          "Candidate"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Applied for{" "}
                        <span className="font-medium text-slate-700">
                          {application.job?.title ||
                            "Job"}
                        </span>
                      </p>

                      {application.candidate?.preferred_role && (
                        <p className="mt-1 text-xs text-blue-600">
                          Preferred role:{" "}
                          {application.candidate.preferred_role}
                        </p>
                      )}

                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(
                          application.created_at
                        ).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </p>

                    </div>

                  </div>

                  <div className="flex items-center gap-3">

                    <ApplicationStatus
                      status={application.status}
                    />

                    <Link
                      href={`/company/candidates/${application.candidate_id}`}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      Review Evidence
                    </Link>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

        <div className="mt-6 grid gap-6 md:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">

            <div className="flex items-center justify-between gap-4">

              <h2 className="text-xl font-semibold text-slate-950">
                Company Profile
              </h2>

              <Link
                href="/company/profile"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Edit Profile
              </Link>

            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">

              <Info
                label="Company"
                value={company.company_name}
              />

              <Info
                label="Email"
                value={company.email}
              />

              <Info
                label="Location"
                value={company.location ||
                  "Not provided"}
              />

              <Info
                label="Website"
                value={company.website ||
                  "Not provided"}
              />

            </div>

          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">

            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              Evidence-Based Hiring
            </p>

            <h2 className="mt-4 text-2xl font-bold text-slate-950">
              Find Freshers
            </h2>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              Search candidates across software, AI, data, HR, sales, marketing and other roles using skills, verified assessments, location and work evidence.
            </p>

            <Link
              href="/company/candidates"
              className="mt-6 block w-full rounded-xl bg-blue-600 px-5 py-3 text-center font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Search Candidates →
            </Link>

          </div>

        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">

          <CompanyCard
            title="Find Freshers"
            description="Discover technical and non-technical candidates using role-relevant skills, verified assessments and work evidence."
            href="/company/candidates"
            button="Search Candidates →"
          />

          <CompanyCard
            title="Post a Job"
            description="Create an entry-level opportunity and start receiving applications from relevant freshers."
            href="/company/jobs/create"
            button="Post a Job →"
          />

          <CompanyCard
            title="My Jobs"
            description="Manage your opportunities and review applicants through the hiring pipeline."
            href="/company/jobs"
            button="Manage Jobs →"
          />

        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div>

              <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
                Candidate Management
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                Shortlisted Candidates
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                Revisit candidates you&apos;ve saved and compare their profiles, verified assessments and work samples before taking the next hiring step.
              </p>

            </div>

            <Link
              href="/company/shortlisted"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              View Shortlisted →
            </Link>

          </div>

        </div>

      </section>

    </main>
  );
}

function AnalyticsCard({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: number;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        highlight
          ? "border-green-200 bg-green-50"
          : "border-slate-200 bg-white"
      }`}
    >

      <div className="flex items-start justify-between">

        <div>

          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>

          <p className="mt-3 text-3xl font-bold text-slate-950">
            {value}
          </p>

        </div>

        <span className="text-xl">
          {icon}
        </span>

      </div>

    </div>
  );
}

function FunnelRow({
  label,
  value,
  percentage,
}: {
  label: string;
  value: number;
  percentage: number;
}) {
  return (
    <div>

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm font-semibold text-slate-900">
            {label}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {value} candidate
            {value !== 1
              ? "s"
              : ""}
          </p>

        </div>

        <span className="text-sm font-bold text-blue-600">
          {percentage}%
        </span>

      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">

        <div
          className="h-full rounded-full bg-blue-600"
          style={{
            width: `${Math.min(
              Math.max(
                percentage,
                0
              ),
              100
            )}%`,
          }}
        />

      </div>

    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold text-slate-950">
        {value}
      </p>

    </div>
  );
}

function ApplicationStatus({
  status,
}: {
  status: Application["status"];
}) {
  const styles = {
    applied:
      "border-blue-200 bg-blue-50 text-blue-700",
    shortlisted:
      "border-amber-200 bg-amber-50 text-amber-700",
    rejected:
      "border-red-200 bg-red-50 text-red-700",
    hired:
      "border-green-200 bg-green-50 text-green-700",
  };

  const labels = {
    applied: "Applied",
    shortlisted: "Shortlisted",
    rejected: "Rejected",
    hired: "Hired",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>

      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-slate-800">
        {value ||
          "Not provided"}
      </p>

    </div>
  );
}

function CompanyCard({
  title,
  description,
  href,
  button,
}: {
  title: string;
  description: string;
  href: string;
  button: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">

      <h3 className="text-lg font-semibold text-slate-950">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        {description}
      </p>

      <Link
        href={href}
        className="mt-5 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
      >
        {button}
      </Link>

    </div>
  );
}
