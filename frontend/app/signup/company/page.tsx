"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CompanySignup() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    password: "",
    website: "",
    location: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  }

  function normalizeWebsite(
    website: string
  ) {
    const value =
      website.trim();

    if (!value) {
      return null;
    }

    if (
      value.startsWith("http://") ||
      value.startsWith("https://")
    ) {
      return value;
    }

    return `https://${value}`;
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      const cleanCompanyName =
        formData.companyName.trim();

      const cleanEmail =
        formData.email.trim();

      const cleanLocation =
        formData.location.trim();

      const website =
        normalizeWebsite(
          formData.website
        );

      if (!cleanCompanyName) {
        throw new Error(
          "Company name is required."
        );
      }

      if (!cleanEmail) {
        throw new Error(
          "Work email is required."
        );
      }

      if (
        formData.password.length < 8
      ) {
        throw new Error(
          "Password must be at least 8 characters."
        );
      }

      const {
        data: authData,
        error: authError,
      } =
        await supabase.auth.signUp({
          email: cleanEmail,
          password: formData.password,
          options: {
            data: {
              user_type: "company",
              company_name:
                cleanCompanyName,
              full_name:
                cleanCompanyName,
            },
          },
        });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error(
          "Could not create account."
        );
      }

      /*
        Important:
        FresherHire may create a profiles row automatically
        when an auth user is created. Ensure a company account
        is never left with the default "fresher" role.
      */
      const {
        error: profileError,
      } = await supabase
        .from("profiles")
        .upsert(
          {
            id: authData.user.id,
            full_name:
              cleanCompanyName,
            email:
              cleanEmail,
            user_type:
              "company",
          },
          {
            onConflict: "id",
          }
        );

      if (profileError) {
        console.error(
          "Company profile role error:",
          profileError
        );

        throw new Error(
          profileError.message ||
            "Could not create the company account profile."
        );
      }

      const {
        error: companyError,
      } = await supabase
        .from("companies")
        .insert({
          id: authData.user.id,
          company_name:
            cleanCompanyName,
          email:
            cleanEmail,
          website,
          location:
            cleanLocation || null,
        });

      if (companyError) {
        throw companyError;
      }

      router.replace(
        "/company/dashboard"
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900">

      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-blue-100 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-cyan-100 blur-3xl" />
      </div>

      <nav className="border-b border-slate-200 bg-white/90 backdrop-blur">
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

          <Link
            href="/signup"
            className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            ← Back
          </Link>

        </div>
      </nav>

      <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">

        <div className="text-center">

          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
            Employer Signup
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">
            Find your next fresher
          </h1>

          <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-600">
            Create a company account to post jobs and discover entry-level talent using skills, assessments and project evidence.
          </p>

        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8"
        >

          <div className="space-y-6">

            <div>

              <label
                htmlFor="companyName"
                className="text-sm font-medium text-slate-700"
              >
                Company Name *
              </label>

              <input
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
                autoComplete="organization"
                placeholder="e.g. Acme Technologies"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

            </div>

            <div>

              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-700"
              >
                Work Email *
              </label>

              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                placeholder="hr@company.com"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

            </div>

            <div>

              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-700"
              >
                Password *
              </label>

              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Minimum 8 characters"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              <p className="mt-2 text-xs text-slate-500">
                Use at least 8 characters.
              </p>

            </div>

            <div>

              <label
                htmlFor="website"
                className="text-sm font-medium text-slate-700"
              >
                Company Website
              </label>

              <input
                id="website"
                type="text"
                name="website"
                value={formData.website}
                onChange={handleChange}
                inputMode="url"
                autoComplete="url"
                placeholder="company.com"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              <p className="mt-2 text-xs text-slate-500">
                You can enter company.com or a full https:// URL.
              </p>

            </div>

            <div>

              <label
                htmlFor="location"
                className="text-sm font-medium text-slate-700"
              >
                Location
              </label>

              <input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                autoComplete="address-level2"
                placeholder="e.g. Bangalore, India"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

            </div>

          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-8 w-full rounded-xl bg-blue-600 px-5 py-4 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Creating Account..."
              : "Create Company Account →"}
          </button>

          <p className="mt-5 text-center text-xs leading-5 text-slate-500">
            By creating an account, you agree to FresherHire&apos;s Terms of Service and Privacy Policy.
          </p>

        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already registered?{" "}
          <Link
            href="/login"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Sign in
          </Link>
        </p>

      </section>

    </main>
  );
}
