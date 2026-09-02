"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type RedirectState =
  | "idle"
  | "checking"
  | "fresher"
  | "company";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [redirectState, setRedirectState] =
    useState<RedirectState>("idle");
  const [error, setError] = useState("");

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setLoading(true);
    setRedirectState("checking");

    const {
      data,
      error: loginError,
    } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (loginError) {
      console.error(
        "Login error:",
        loginError
      );

      setError(loginError.message);
      setRedirectState("idle");
      setLoading(false);
      return;
    }

    const user = data.user;

    if (!user) {
      setError(
        "Could not sign in. Please try again."
      );

      setRedirectState("idle");
      setLoading(false);
      return;
    }

    const {
      data: companyData,
      error: companyError,
    } = await supabase
      .from("companies")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (companyError) {
      console.error(
        "Company check error:",
        companyError
      );
    }

    if (companyData) {
      setRedirectState("company");

      window.setTimeout(() => {
        router.replace(
          "/company/dashboard"
        );
      }, 450);

      return;
    }

    const {
      data: profileData,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select(`
        id,
        user_type
      `)
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error(
        "Profile check error:",
        profileError
      );
    }

    if (
      profileData?.user_type ===
      "fresher"
    ) {
      setRedirectState("fresher");

      window.setTimeout(() => {
        router.replace(
          "/dashboard"
        );
      }, 450);

      return;
    }

    await supabase.auth.signOut();

    setError(
      "Your account does not have a valid FresherHire profile. Please sign up again or contact support."
    );

    setRedirectState("idle");
    setLoading(false);
  }

  if (
    redirectState === "checking" ||
    redirectState === "fresher" ||
    redirectState === "company"
  ) {
    const isFresher =
      redirectState === "fresher";

    const isCompany =
      redirectState === "company";

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 text-slate-900 sm:px-6">

        <div className="w-full max-w-md text-center">

          <Link
            href="/"
            className="text-3xl font-bold tracking-tight text-slate-950"
          >
            Fresher
            <span className="text-blue-600">
              Hire
            </span>
          </Link>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">

              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />

            </div>

            <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-blue-600">
              {isFresher
                ? "Fresher Account"
                : isCompany
                ? "Recruiter Account"
                : "Signing You In"}
            </p>

            <h1 className="mt-3 text-2xl font-bold text-slate-950">
              {isFresher
                ? "Loading your Fresher Dashboard..."
                : isCompany
                ? "Loading your Recruiter Dashboard..."
                : "Checking your account..."}
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              {isFresher
                ? "Preparing your skills, projects, assessments, jobs, and applications."
                : isCompany
                ? "Preparing your jobs, applicants, shortlisted candidates, and hiring activity."
                : "We’re identifying your account type and taking you to the correct dashboard."}
            </p>

          </div>

        </div>

      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12 sm:px-6">

      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/3 top-0 h-72 w-72 rounded-full bg-blue-100 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-cyan-100 blur-3xl" />
      </div>

      <div className="w-full max-w-md">

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

          <p className="mt-3 text-sm text-slate-500">
            Sign in to continue to your account.
          </p>

        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">

          <div>

            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              Welcome Back
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Sign in to FresherHire
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Enter your email and password to access your fresher or company dashboard.
            </p>

          </div>

          <form
            onSubmit={handleLogin}
            className="mt-7 space-y-5"
          >

            <div>

              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-700"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                placeholder="you@example.com"
                autoComplete="email"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

            </div>

            <div>

              <div className="flex items-center justify-between">

                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-700"
                >
                  Password
                </label>

                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Forgot password?
                </Link>

              </div>

              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Signing in..."
                : "Sign In →"}
            </button>

          </form>

          <div className="mt-7 border-t border-slate-200 pt-6 text-center">

            <p className="text-sm text-slate-500">
              Don&apos;t have an account?
            </p>

            <Link
              href="/signup"
              className="mt-2 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Create an account →
            </Link>

          </div>

        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">

          <p className="text-center text-xs leading-5 text-slate-500">
            FresherHire automatically detects whether you are signing in as a fresher or company and takes you to the right dashboard.
          </p>

        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Secure access for candidates and hiring teams.
        </p>

      </div>

    </main>
  );
}
