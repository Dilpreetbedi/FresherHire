"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { requireCompany } from "../../lib/auth";
import NotificationBell from "../../components/NotificationBell";

const MAX_COMPANY_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_WEBSITE_LENGTH = 300;
const MAX_LOCATION_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 3000;

export default function CompanyProfile() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [formData, setFormData] =
    useState({
      company_name: "",
      email: "",
      website: "",
      location: "",
      description: "",
    });

  useEffect(() => {
    loadCompany();
  }, []);

  async function loadCompany() {
    setLoading(true);
    setError("");
    setSuccess("");

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

      setFormData((prev) => ({
        ...prev,
        email:
          user.email || "",
      }));

      const {
        data,
        error: profileError,
      } = await supabase
        .from("companies")
        .select(`
          company_name,
          email,
          website,
          location,
          description
        `)
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error(
          "Company profile error:",
          profileError
        );

        setError(
          profileError.message ||
            "Could not load your company profile."
        );

        setLoading(false);
        return;
      }

      if (data) {
        setFormData({
          company_name:
            data.company_name || "",

          email:
            data.email ||
            user.email ||
            "",

          website:
            data.website || "",

          location:
            data.location || "",

          description:
            data.description || "",
        });
      }

      setLoading(false);
    } catch (err) {
      console.error(
        "Load company profile error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading your company profile."
      );

      setLoading(false);
    }
  }

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement
    >
  ) {
    const {
      name,
      value,
    } = e.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
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
      value.startsWith(
        "http://"
      ) ||
      value.startsWith(
        "https://"
      )
    ) {
      return value;
    }

    return `https://${value}`;
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (saving) {
      return;
    }

    setError("");
    setSuccess("");

    const companyName =
      formData.company_name.trim();

    const companyEmail =
      formData.email.trim();

    const companyLocation =
      formData.location.trim();

    const companyDescription =
      formData.description.trim();

    const website =
      normalizeWebsite(
        formData.website
      );

    if (!companyName) {
      setError(
        "Company name is required."
      );
      return;
    }

    if (
      companyName.length >
      MAX_COMPANY_NAME_LENGTH
    ) {
      setError(
        `Company name must be ${MAX_COMPANY_NAME_LENGTH} characters or fewer.`
      );
      return;
    }

    if (
      companyEmail.length >
      MAX_EMAIL_LENGTH
    ) {
      setError(
        "Company email is too long."
      );
      return;
    }

    if (
      website &&
      website.length >
        MAX_WEBSITE_LENGTH
    ) {
      setError(
        `Website must be ${MAX_WEBSITE_LENGTH} characters or fewer.`
      );
      return;
    }

    if (
      companyLocation.length >
      MAX_LOCATION_LENGTH
    ) {
      setError(
        `Location must be ${MAX_LOCATION_LENGTH} characters or fewer.`
      );
      return;
    }

    if (
      companyDescription.length >
      MAX_DESCRIPTION_LENGTH
    ) {
      setError(
        `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`
      );
      return;
    }

    setSaving(true);

    try {
      const auth =
        await requireCompany();

      if (!auth.allowed) {
        setSaving(false);

        router.replace(
          auth.redirectTo!
        );

        return;
      }

      const user = auth.user;

      if (!user) {
        setSaving(false);

        router.replace(
          "/login"
        );

        return;
      }

      const {
        data: savedCompany,
        error: saveError,
      } = await supabase
        .from("companies")
        .upsert(
          {
            id: user.id,

            company_name:
              companyName,

            email:
              companyEmail ||
              user.email ||
              "",

            website,

            location:
              companyLocation ||
              null,

            description:
              companyDescription ||
              null,
          },
          {
            onConflict: "id",
          }
        )
        .select("id")
        .maybeSingle();

      if (saveError) {
        console.error(
          "Save company error:",
          saveError
        );

        setError(
          saveError.message ||
            "Could not save company profile."
        );

        setSaving(false);
        return;
      }

      if (!savedCompany) {
        setError(
          "Could not confirm that your company profile was saved."
        );

        setSaving(false);
        return;
      }

      setSuccess(
        "Company profile saved successfully."
      );

      setSaving(false);

      window.setTimeout(
        () => {
          router.push(
            "/company/dashboard"
          );
        },
        800
      );
    } catch (err) {
      console.error(
        "Company profile save error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while saving your company profile."
      );

      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">

        <div className="text-center">
          <p className="font-semibold">
            Loading profile...
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Checking your company account
          </p>
        </div>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">

          <Link
            href="/company/dashboard"
            className="text-2xl font-bold tracking-tight text-slate-950"
          >
            Fresher
            <span className="text-blue-600">
              Hire
            </span>
          </Link>

          <div className="flex items-center gap-4">

            <Link
              href="/company/dashboard"
              className="hidden text-sm font-semibold text-slate-600 hover:text-slate-950 sm:block"
            >
              ← Dashboard
            </Link>

            <NotificationBell />

          </div>

        </div>

      </nav>

      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">

        <div>

          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
            Company Profile
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Tell us about your company
          </h1>

          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            Complete your company profile so you can start posting jobs and finding freshers.
          </p>

        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
        >

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                <span>
                  {error}
                </span>

                <button
                  type="button"
                  onClick={
                    loadCompany
                  }
                  className="w-fit rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                >
                  Reload
                </button>

              </div>

            </div>
          )}

          {success && (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
              {success}
            </div>
          )}

          <div>

            <label
              htmlFor="company_name"
              className="text-sm font-semibold text-slate-700"
            >
              Company Name *
            </label>

            <input
              id="company_name"
              type="text"
              name="company_name"
              value={
                formData.company_name
              }
              onChange={
                handleChange
              }
              maxLength={
                MAX_COMPANY_NAME_LENGTH
              }
              placeholder="e.g. ABC Technologies"
              required
              autoComplete="organization"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

            <p className="mt-2 text-right text-xs text-slate-400">
              {formData.company_name.length}/
              {MAX_COMPANY_NAME_LENGTH}
            </p>

          </div>

          <div className="mt-6">

            <label
              htmlFor="email"
              className="text-sm font-semibold text-slate-700"
            >
              Company Email
            </label>

            <input
              id="email"
              type="email"
              name="email"
              value={
                formData.email
              }
              onChange={
                handleChange
              }
              maxLength={
                MAX_EMAIL_LENGTH
              }
              placeholder="hr@company.com"
              autoComplete="email"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

          </div>

          <div className="mt-6">

            <label
              htmlFor="website"
              className="text-sm font-semibold text-slate-700"
            >
              Website
            </label>

            <input
              id="website"
              type="text"
              name="website"
              value={
                formData.website
              }
              onChange={
                handleChange
              }
              maxLength={
                MAX_WEBSITE_LENGTH
              }
              inputMode="url"
              placeholder="company.com"
              autoComplete="url"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

            <p className="mt-2 text-xs text-slate-500">
              You can enter company.com or a full https:// URL.
            </p>

          </div>

          <div className="mt-6">

            <label
              htmlFor="location"
              className="text-sm font-semibold text-slate-700"
            >
              Location
            </label>

            <input
              id="location"
              type="text"
              name="location"
              value={
                formData.location
              }
              onChange={
                handleChange
              }
              maxLength={
                MAX_LOCATION_LENGTH
              }
              placeholder="Bangalore, India"
              autoComplete="address-level2"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

          </div>

          <div className="mt-6">

            <label
              htmlFor="description"
              className="text-sm font-semibold text-slate-700"
            >
              Company Description
            </label>

            <textarea
              id="description"
              name="description"
              value={
                formData.description
              }
              onChange={
                handleChange
              }
              rows={6}
              maxLength={
                MAX_DESCRIPTION_LENGTH
              }
              placeholder="Tell freshers about your company..."
              className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

            <p className="mt-2 text-right text-xs text-slate-400">
              {formData.description.length}/
              {MAX_DESCRIPTION_LENGTH}
            </p>

          </div>

          <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50 p-4">

            <p className="text-sm font-semibold text-blue-800">
              Your company profile supports recruiter trust
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-600">
              Keep your company name, location, website, and description accurate so candidates can understand who is hiring them.
            </p>

          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row">

            <button
              type="submit"
              disabled={
                saving
              }
              className="flex-1 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Save Company Profile →"}
            </button>

            <Link
              href="/company/dashboard"
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-center font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Cancel
            </Link>

          </div>

        </form>

      </section>

    </main>
  );
}
