"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { requireCompany } from "../../lib/auth";
import NotificationBell from "../../components/NotificationBell";

type Candidate = {
  id: string;
  full_name: string;
  degree: string | null;
  graduation_year: number | null;
  location: string | null;
  preferred_role: string | null;
  has_resume: boolean;
};

type Shortlist = {
  id: number;
  candidate_id: string;
  created_at: string;
};

export default function ShortlistedPage() {
  const router = useRouter();

  const [candidates, setCandidates] =
    useState<Candidate[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [removingId, setRemovingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const [actionError, setActionError] =
    useState("");

  useEffect(() => {
    loadShortlisted();
  }, []);

  async function loadShortlisted() {
    setLoading(true);
    setError("");
    setActionError("");

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

      const user = auth.user;

      if (!user) {
        setLoading(false);

        router.replace(
          "/login"
        );

        return;
      }

      const {
        data: shortlistData,
        error: shortlistError,
      } = await supabase
        .from("shortlists")
        .select(`
          id,
          candidate_id,
          created_at
        `)
        .eq(
          "company_id",
          user.id
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (shortlistError) {
        console.error(
          "Shortlist load error:",
          shortlistError
        );

        setError(
          shortlistError.message ||
            "Could not load shortlisted candidates."
        );

        setLoading(false);
        return;
      }

      const loadedShortlists =
        (shortlistData ||
          []) as Shortlist[];

      if (
        loadedShortlists.length ===
        0
      ) {
        setCandidates([]);
        setLoading(false);
        return;
      }

      const candidateIds =
        Array.from(
          new Set(
            loadedShortlists.map(
              (item) =>
                item.candidate_id
            )
          )
        );

      const {
        data: candidateData,
        error: candidateError,
      } = await supabase
        .from("recruiter_profiles")
        .select(`
          id,
          full_name,
          degree,
          graduation_year,
          location,
          preferred_role,
          has_resume
        `)
        .in(
          "id",
          candidateIds
        );

      if (candidateError) {
        console.error(
          "Candidate load error:",
          candidateError
        );

        setError(
          candidateError.message ||
            "Could not load shortlisted candidate profiles."
        );

        setLoading(false);
        return;
      }

      const candidateMap =
        new Map(
          (candidateData || []).map(
            (candidate) => [
              candidate.id,
              candidate,
            ]
          )
        );

      const orderedCandidates =
        loadedShortlists
          .map(
            (item) =>
              candidateMap.get(
                item.candidate_id
              )
          )
          .filter(
            (candidate):
              candidate is Candidate =>
                Boolean(candidate)
          );

      setCandidates(
        orderedCandidates
      );

      setLoading(false);
    } catch (err) {
      console.error(
        "Unexpected shortlisted candidates error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading shortlisted candidates."
      );

      setLoading(false);
    }
  }

  async function removeCandidate(
    candidateId: string
  ) {
    if (removingId) {
      return;
    }

    const candidate =
      candidates.find(
        (item) =>
          item.id ===
          candidateId
      );

    const confirmed =
      window.confirm(
        `Remove ${
          candidate?.full_name ||
          "this candidate"
        } from your shortlist?`
      );

    if (!confirmed) {
      return;
    }

    setRemovingId(
      candidateId
    );

    setActionError("");

    try {
      const auth =
        await requireCompany();

      if (!auth.allowed) {
        setRemovingId(null);

        router.replace(
          auth.redirectTo!
        );

        return;
      }

      const user = auth.user;

      if (!user) {
        setRemovingId(null);

        router.replace(
          "/login"
        );

        return;
      }

      const {
        data: deletedShortlist,
        error: deleteError,
      } = await supabase
        .from("shortlists")
        .delete()
        .eq(
          "company_id",
          user.id
        )
        .eq(
          "candidate_id",
          candidateId
        )
        .select(
          "candidate_id"
        )
        .maybeSingle();

      if (deleteError) {
        console.error(
          "Remove shortlist error:",
          deleteError
        );

        setActionError(
          deleteError.message ||
            "Could not remove candidate from shortlist."
        );

        setRemovingId(null);
        return;
      }

      if (!deletedShortlist) {
        setActionError(
          "Candidate was not found in your shortlist."
        );

        setRemovingId(null);
        return;
      }

      setCandidates(
        (current) =>
          current.filter(
            (candidate) =>
              candidate.id !==
              candidateId
          )
      );
    } catch (err) {
      console.error(
        "Unexpected remove shortlist error:",
        err
      );

      setActionError(
        err instanceof Error
          ? err.message
          : "Could not remove candidate from shortlist."
      );
    }

    setRemovingId(null);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">

        <div className="text-center">

          <p className="font-semibold">
            Loading shortlisted candidates...
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Checking your saved candidates
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

          <div className="flex items-center gap-3 sm:gap-5">

            <Link
              href="/company/candidates"
              className="text-sm font-semibold text-slate-600 hover:text-slate-950"
            >
              Find Freshers
            </Link>

            <Link
              href="/company/dashboard"
              className="hidden text-sm font-medium text-slate-600 hover:text-slate-950 sm:block"
            >
              Dashboard
            </Link>

            <NotificationBell />

          </div>

        </div>

      </nav>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">

        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

          <div>

            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              Hiring
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Shortlisted Freshers
            </h1>

            <p className="mt-3 leading-7 text-slate-600">
              Candidates you&apos;ve saved for further consideration.
            </p>

          </div>

          {candidates.length > 0 && (
            <Link
              href="/company/candidates"
              className="w-fit rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              + Find More Freshers
            </Link>
          )}

        </div>

        {error && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

              <span>
                {error}
              </span>

              <button
                onClick={
                  loadShortlisted
                }
                className="w-fit rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
              >
                Retry
              </button>

            </div>

          </div>
        )}

        {actionError && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {actionError}
          </div>
        )}

        {!error &&
          candidates.length >
            0 && (

            <div className="mt-8 grid gap-4 sm:grid-cols-3">

              <StatCard
                label="Total Shortlisted"
                value={candidates.length}
              />

              <StatCard
                label="Resume Available"
                value={
                  candidates.filter(
                    (candidate) =>
                      candidate.has_resume
                  ).length
                }
              />

              <StatCard
                label="Ready to Review"
                value={candidates.length}
              />

            </div>

          )}

        {!error &&
        candidates.length === 0 ? (

          <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm sm:p-12">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl text-blue-600">
              ☆
            </div>

            <h2 className="mt-5 text-xl font-semibold text-slate-950">
              No shortlisted candidates
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
              Browse freshers and shortlist candidates that match your hiring requirements.
            </p>

            <Link
              href="/company/candidates"
              className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Find Freshers →
            </Link>

          </div>

        ) : !error ? (

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">

            {candidates.map(
              (candidate) => (

                <article
                  key={
                    candidate.id
                  }
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:p-6"
                >

                  <div className="flex items-start justify-between gap-4">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">

                      {(candidate.full_name ||
                        "C")
                        .charAt(0)
                        .toUpperCase()}

                    </div>

                    <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                      Shortlisted
                    </span>

                  </div>

                  <h2 className="mt-5 break-words text-xl font-semibold text-slate-950">
                    {candidate.full_name}
                  </h2>

                  <p className="mt-1 text-sm font-medium text-blue-600">
                    {candidate.preferred_role ||
                      "Entry-Level Candidate"}
                  </p>

                  <div className="mt-5 space-y-2 text-sm text-slate-600">

                    <p>
                      🎓{" "}
                      {candidate.degree ||
                        "Degree not provided"}
                    </p>

                    <p>
                      📍{" "}
                      {candidate.location ||
                        "Location not provided"}
                    </p>

                    <p>
                      📅{" "}
                      {candidate.graduation_year
                        ? `Class of ${candidate.graduation_year}`
                        : "Graduation year not provided"}
                    </p>

                    <p
                      className={
                        candidate.has_resume
                          ? "font-medium text-green-700"
                          : "text-slate-500"
                      }
                    >
                      📄{" "}
                      {candidate.has_resume
                        ? "Resume available"
                        : "No resume uploaded"}
                    </p>

                  </div>

                  {candidate.has_resume && (
                    <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-3">

                      <p className="text-xs font-semibold text-green-800">
                        ✓ Resume and contact access eligible
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        Open the candidate profile to securely access eligible private details.
                      </p>

                    </div>
                  )}

                  <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row">

                    <Link
                      href={`/company/candidates/${candidate.id}`}
                      className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                    >
                      View Profile
                    </Link>

                    <button
                      onClick={() =>
                        removeCandidate(
                          candidate.id
                        )
                      }
                      disabled={
                        removingId !==
                        null
                      }
                      className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {removingId ===
                      candidate.id
                        ? "Removing..."
                        : "Remove"}
                    </button>

                  </div>

                </article>

              )
            )}

          </div>

        ) : null}

      </section>

    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-950">
        {value}
      </p>

    </div>
  );
}
