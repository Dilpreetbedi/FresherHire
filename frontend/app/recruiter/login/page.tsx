"use client";

import Link from "next/link";
import {
  FormEvent,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";


export default function RecruiterLoginPage() {
  const router =
    useRouter();

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");


  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          `${apiUrl}/api/recruiter/login`,
          {
            method:
              "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                email:
                  email.trim(),

                password,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to login."
        );
      }

      if (
        data.must_change_password
      ) {
        router.push(
          "/recruiter/change-password"
        );

      } else {
        router.push(
          "/recruiter/dashboard"
        );
      }

      router.refresh();

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to login."
      );

    } finally {
      setLoading(false);
    }
  }


  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">

      <div className="w-full max-w-md">

        <Link
          href="/"
          className="block text-center text-3xl font-bold"
        >
          Fresher
          <span className="text-blue-600">
            Hire
          </span>
        </Link>


        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">

          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
            Recruiter Login
          </p>


          <h1 className="mt-3 text-3xl font-bold">
            Hiring dashboard
          </h1>


          <p className="mt-2 text-sm text-slate-500">
            Access your verified company
            hiring workspace.
          </p>


          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}


          <form
            onSubmit={
              handleSubmit
            }
            className="mt-6 space-y-5"
          >

            <div>

              <label className="text-sm font-semibold text-slate-700">
                Work Email
              </label>


              <input
                type="email"
                required
                value={
                  email
                }
                onChange={
                  (event) =>
                    setEmail(
                      event.target.value
                    )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

            </div>


            <div>

              <div className="flex items-center justify-between">

                <label className="text-sm font-semibold text-slate-700">
                  Password
                </label>


                <Link
                  href="/forgot-password?type=recruiter"
                  className="text-xs font-semibold text-blue-600"
                >
                  Forgot password?
                </Link>

              </div>


              <input
                type="password"
                required
                value={
                  password
                }
                onChange={
                  (event) =>
                    setPassword(
                      event.target.value
                    )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

            </div>


            <button
              type="submit"
              disabled={
                loading
              }
              className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              {loading
                ? "Logging in..."
                : "Login"}
            </button>

          </form>


          <div className="mt-6 border-t border-slate-100 pt-6 text-center">

            <Link
              href="/login"
              className="text-sm font-semibold text-slate-600"
            >
              Candidate Login →
            </Link>

          </div>

        </div>

      </div>

    </main>
  );
}