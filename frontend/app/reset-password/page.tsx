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


export default function ResetPasswordPage() {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";

  const [
    token,
    setToken,
  ] =
    useState("");

  const [
    accountType,
    setAccountType,
  ] =
    useState<AccountType | null>(
      null
    );

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
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
    success,
    setSuccess,
  ] =
    useState(false);


  useEffect(() => {
    const search =
      new URLSearchParams(
        window.location.search
      );

    const tokenValue =
      search.get("token") || "";

    const typeValue =
      search.get("type");

    setToken(
      tokenValue
    );

    if (
      typeValue ===
      "candidate"
      ||
      typeValue ===
      "recruiter"
    ) {
      setAccountType(
        typeValue
      );
    }
  }, []);


  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !token
      || !accountType
    ) {
      setError(
        "Invalid password reset link."
      );

      return;
    }

    if (
      password.length < 8
    ) {
      setError(
        "Password must contain at least 8 characters."
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

    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          `${apiUrl}/api/auth/reset-password`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                token,

                account_type:
                  accountType,

                new_password:
                  password,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to reset password."
        );
      }

      setSuccess(
        true
      );

      setPassword("");
      setConfirmPassword("");

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to reset password."
      );

    } finally {
      setLoading(false);
    }
  }


  const loginUrl =
    accountType ===
    "recruiter"
      ? "/recruiter/login"
      : "/login";


  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">

        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-2xl">
            ✓
          </div>


          <h1 className="mt-5 text-3xl font-bold">
            Password updated
          </h1>


          <p className="mt-3 text-sm leading-6 text-slate-500">
            Your FresherHire password
            has been reset successfully.
          </p>


          <Link
            href={
              loginUrl
            }
            className="mt-7 inline-flex rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white"
          >
            Login with New Password
          </Link>

        </div>

      </main>
    );
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
            Password Reset
          </p>


          <h1 className="mt-3 text-3xl font-bold">
            Create new password
          </h1>


          <p className="mt-2 text-sm text-slate-500">
            Choose a new password
            for your FresherHire account.
          </p>


          {error && (
            <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}


          {(
            !token
            || !accountType
          ) && (
            <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-700">
              This password reset link
              appears to be invalid.
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
                New Password
              </label>


              <input
                type="password"
                minLength={8}
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
                placeholder="Minimum 8 characters"
              />

            </div>


            <div>

              <label className="text-sm font-semibold text-slate-700">
                Confirm Password
              </label>


              <input
                type="password"
                minLength={8}
                required
                value={
                  confirmPassword
                }
                onChange={
                  (event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="Enter password again"
              />

            </div>


            <button
              type="submit"
              disabled={
                loading
                || !token
                || !accountType
              }
              className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              {loading
                ? "Resetting..."
                : "Reset Password"}
            </button>

          </form>

        </div>

      </div>

    </main>
  );
}