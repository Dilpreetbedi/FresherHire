"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";


type AccountType =
  | "candidate"
  | "recruiter";


export default function ForgotPasswordPage() {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";

  const [
    accountType,
    setAccountType,
  ] =
    useState<AccountType>(
      "candidate"
    );

  const [
    email,
    setEmail,
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

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    devResetUrl,
    setDevResetUrl,
  ] =
    useState("");


  useEffect(() => {
    const search =
      new URLSearchParams(
        window.location.search
      );

    if (
      search.get("type")
      === "recruiter"
    ) {
      setAccountType(
        "recruiter"
      );
    }
  }, []);


  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      setMessage("");
      setDevResetUrl("");

      const response =
        await fetch(
          `${apiUrl}/api/auth/forgot-password`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                email:
                  email.trim(),

                account_type:
                  accountType,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to process request."
        );
      }

      setMessage(
        data.message
      );

      if (
        data.dev_reset_url
      ) {
        setDevResetUrl(
          data.dev_reset_url
        );
      }

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to process request."
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
            Password Recovery
          </p>


          <h1 className="mt-3 text-3xl font-bold">
            Forgot password?
          </h1>


          <p className="mt-2 text-sm leading-6 text-slate-500">
            Enter your registered email
            and we&apos;ll create a secure
            password reset link.
          </p>


          <div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">

            <button
              type="button"
              onClick={() =>
                setAccountType(
                  "candidate"
                )
              }
              className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${
                accountType ===
                "candidate"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Candidate
            </button>


            <button
              type="button"
              onClick={() =>
                setAccountType(
                  "recruiter"
                )
              }
              className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${
                accountType ===
                "recruiter"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Recruiter
            </button>

          </div>


          {error && (
            <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}


          {message && (
            <div className="mt-5 rounded-xl bg-green-50 p-4 text-sm leading-6 text-green-700">
              ✓ {message}
            </div>
          )}


          {devResetUrl && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">

              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                Local Development
              </p>


              <p className="mt-2 text-sm text-slate-600">
                Email is not configured,
                so use this local reset link.
              </p>


              <a
                href={
                  devResetUrl
                }
                className="mt-3 inline-flex text-sm font-semibold text-blue-600"
              >
                Reset Password →
              </a>

            </div>
          )}


          <form
            onSubmit={
              handleSubmit
            }
            className="mt-6"
          >

            <label className="text-sm font-semibold text-slate-700">
              Email Address
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
              placeholder="you@example.com"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />


            <button
              type="submit"
              disabled={
                loading
              }
              className="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              {loading
                ? "Sending..."
                : "Send Reset Link"}
            </button>

          </form>


          <div className="mt-6 text-center">

            <Link
              href={
                accountType ===
                "candidate"
                  ? "/login"
                  : "/recruiter/login"
              }
              className="text-sm font-semibold text-slate-600"
            >
              ← Back to Login
            </Link>

          </div>

        </div>

      </div>

    </main>
  );
}