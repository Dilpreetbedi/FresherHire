"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { supabase } from "../lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleReset(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setMessage("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    const redirectTo =
      `${window.location.origin}/reset-password`;

    const {
      error: resetError,
    } = await supabase.auth.resetPasswordForEmail(
      cleanEmail,
      {
        redirectTo,
      }
    );

    if (resetError) {
      console.error(
        "Password reset error:",
        resetError
      );

      setError(
        resetError.message
      );

      setLoading(false);

      return;
    }

    setMessage(
      "Password reset link sent. Please check your email."
    );

    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 text-slate-900 sm:px-6">

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
            Reset your account password.
          </p>

        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-xl text-blue-600">
            ✉
          </div>

          <div className="mt-5 text-center">

            <h1 className="text-2xl font-bold text-slate-950">
              Forgot your password?
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Enter the email associated with your account. We&apos;ll send you a secure password reset link.
            </p>

          </div>

          <form
            onSubmit={handleReset}
            className="mt-7 space-y-5"
          >

            <div>

              <label
                htmlFor="email"
                className="text-sm font-semibold text-slate-700"
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

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Sending..."
                : "Send Reset Link →"}
            </button>

          </form>

          <div className="mt-7 border-t border-slate-200 pt-6 text-center">

            <Link
              href="/login"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              ← Back to Login
            </Link>

          </div>

        </div>

        <p className="mt-5 text-center text-xs leading-5 text-slate-400">
          The reset link will only work for the account associated with the email you enter.
        </p>

      </div>

    </main>
  );
}
