"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function FresherSignup() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    graduationYear: "",
    degree: "",
    location: "",
    role: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const cleanEmail =
        formData.email.trim();

      const cleanName =
        formData.fullName.trim();

      const cleanLocation =
        formData.location.trim();

      if (!cleanName) {
        throw new Error(
          "Please enter your full name."
        );
      }

      if (!cleanEmail) {
        throw new Error(
          "Please enter your email address."
        );
      }

      if (
        formData.password.length < 8
      ) {
        throw new Error(
          "Password must be at least 8 characters."
        );
      }

      const graduationYear =
        Number(
          formData.graduationYear
        );

      if (
        !Number.isInteger(
          graduationYear
        )
      ) {
        throw new Error(
          "Please select a valid graduation year."
        );
      }

      const {
        data: authData,
        error: authError,
      } =
        await supabase.auth.signUp({
          email: cleanEmail,
          password: formData.password,
        });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error(
          "Account could not be created."
        );
      }

      const {
        error: profileError,
      } = await supabase
        .from("profiles")
        .insert({
          id: authData.user.id,
          full_name: cleanName,
          email: cleanEmail,
          user_type: "fresher",
          graduation_year:
            graduationYear,
          degree:
            formData.degree,
          location:
            cleanLocation,
          preferred_role:
            formData.role,
        });

      if (profileError) {
        throw profileError;
      }

      router.push(
        "/dashboard"
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
    <main className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-10 text-slate-900 sm:px-6 sm:py-12">

      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-blue-100 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-cyan-100 blur-3xl" />
      </div>

      <div className="mx-auto max-w-3xl">

        <div className="mb-8">

          <Link
            href="/signup"
            className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            ← Back
          </Link>

          <div className="mt-7">

            <Link
              href="/"
              className="text-2xl font-bold tracking-tight text-slate-950"
            >
              Fresher
              <span className="text-blue-600">
                Hire
              </span>
            </Link>

            <p className="mt-8 text-sm font-semibold uppercase tracking-widest text-blue-600">
              Candidate Signup
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
              Create your Fresher Profile
            </h1>

            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              Tell us a little about yourself so companies can discover you based on skills, projects and verified evidence.
            </p>

          </div>

        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8 md:p-10"
        >

          <div className="grid gap-6 md:grid-cols-2">

            <div className="md:col-span-2">

              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Full Name
              </label>

              <input
                id="fullName"
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
                autoComplete="name"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

            </div>

            <div className="md:col-span-2">

              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email Address
              </label>

              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

            </div>

            <div className="md:col-span-2">

              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                minLength={8}
                required
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              <p className="mt-2 text-xs text-slate-500">
                Minimum 8 characters.
              </p>

            </div>

            <div>

              <label
                htmlFor="graduationYear"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Graduation Year
              </label>

              <select
                id="graduationYear"
                name="graduationYear"
                value={formData.graduationYear}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">
                  Select graduation year
                </option>

                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
                <option value="2029">2029</option>

              </select>

            </div>

            <div>

              <label
                htmlFor="degree"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Degree
              </label>

              <select
                id="degree"
                name="degree"
                value={formData.degree}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >

                <option value="">
                  Select your degree
                </option>

                <option value="B.Tech">B.Tech</option>
                <option value="B.E">B.E</option>
                <option value="BCA">BCA</option>
                <option value="MCA">MCA</option>
                <option value="M.Tech">M.Tech</option>
                <option value="B.Sc">B.Sc</option>
                <option value="M.Sc">M.Sc</option>
                <option value="Other">Other</option>

              </select>

            </div>

            <div>

              <label
                htmlFor="location"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Location
              </label>

              <input
                id="location"
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Bangalore, Delhi, Mumbai"
                required
                autoComplete="address-level2"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

            </div>

            <div>

              <label
                htmlFor="role"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Preferred Role
              </label>

              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >

                <option value="">
                  Select preferred role
                </option>

                <option value="AI/ML Engineer">
                  AI/ML Engineer
                </option>

                <option value="Software Engineer">
                  Software Engineer
                </option>

                <option value="Data Analyst">
                  Data Analyst
                </option>

                <option value="Data Scientist">
                  Data Scientist
                </option>

                <option value="Frontend Developer">
                  Frontend Developer
                </option>

                <option value="Backend Developer">
                  Backend Developer
                </option>

                <option value="Full Stack Developer">
                  Full Stack Developer
                </option>

                <option value="Other">
                  Other
                </option>

              </select>

            </div>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-8 w-full rounded-xl bg-blue-600 px-6 py-4 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Creating your account..."
              : "Create Fresher Profile →"}
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

      </div>

    </main>
  );
}
