"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [sessionReady, setSessionReady] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (
        session &&
        mounted
      ) {
        setSessionReady(true);
      }
    }

    checkSession();

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (event, session) => {
          if (
            !mounted
          ) {
            return;
          }

          if (
            event ===
              "PASSWORD_RECOVERY" ||
            session
          ) {
            setSessionReady(true);
          }
        }
      );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function updatePassword(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setMessage("");

    if (
      password.length < 8
    ) {
      setError(
        "Password must be at least 8 characters."
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );

      return;
    }

    setLoading(true);

    const {
      error: updateError,
    } =
      await supabase.auth.updateUser({
        password,
      });

    if (updateError) {
      console.error(
        "Password update error:",
        updateError
      );

      setError(
        updateError.message
      );

      setLoading(false);

      return;
    }

    setMessage(
      "Password updated successfully."
    );

    setLoading(false);

    window.setTimeout(() => {
      router.replace("/login");
    }, 1500);
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
            Choose a new password.
          </p>

        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-xl text-blue-600">
            🔐
          </div>

          <div className="mt-5 text-center">

            <h1 className="text-2xl font-bold text-slate-950">
              Reset Password
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Create a new password for your FresherHire account.
            </p>

          </div>

          {!sessionReady ? (

            <div className="mt-7 rounded-xl border border-amber-200 bg-amber-50 p-4">

              <p className="text-sm font-semibold text-amber-800">
                Waiting for reset session...
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-600">
                Open this page using the password reset link sent to your email.
              </p>

              <Link
                href="/forgot-password"
                className="mt-3 inline-block text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Request a new reset link
              </Link>

            </div>

          ) : (

            <form
              onSubmit={updatePassword}
              className="mt-7 space-y-5"
            >

              <div>

                <label
                  htmlFor="password"
                  className="text-sm font-semibold text-slate-700"
                >
                  New Password
                </label>

                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Use at least 8 characters.
                </p>

              </div>

              <div>

                <label
                  htmlFor="confirm-password"
                  className="text-sm font-semibold text-slate-700"
                >
                  Confirm Password
                </label>

                <input
                  id="confirm-password"
                  type="password"
                  required
                  minLength={8}
                  value={
                    confirmPassword
                  }
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  placeholder="Enter password again"
                  autoComplete="new-password"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Updating..."
                  : "Update Password →"}
              </button>

            </form>

          )}

          <div className="mt-7 border-t border-slate-200 pt-6 text-center">

            <Link
              href="/login"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              ← Back to Login
            </Link>

          </div>

        </div>

      </div>

    </main>
  );
}
