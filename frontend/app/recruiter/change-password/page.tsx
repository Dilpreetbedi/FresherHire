"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RecruiterChangePasswordPage() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [checkingSession, setCheckingSession] =
    useState(true);

  const [error, setError] =
    useState("");

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";

  useEffect(() => {
    async function checkRecruiter() {
      try {
        const response = await fetch(
          `${apiUrl}/api/recruiter/me`,
          {
            credentials: "include",
          }
        );

        if (response.status === 401) {
          router.replace(
            "/recruiter/login"
          );

          return;
        }

        if (!response.ok) {
          throw new Error(
            "Unable to verify recruiter session."
          );
        }

        const data =
          await response.json();

        if (!data.must_change_password) {
          router.replace(
            "/recruiter/dashboard"
          );
        }
      } catch {
        setError(
          "Unable to verify your account."
        );
      } finally {
        setCheckingSession(false);
      }
    }

    checkRecruiter();
  }, [apiUrl, router]);

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");

    if (newPassword.length < 8) {
      setError(
        "New password must be at least 8 characters."
      );

      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setError(
        "New passwords do not match."
      );

      return;
    }

    if (
      currentPassword ===
      newPassword
    ) {
      setError(
        "New password must be different from your temporary password."
      );

      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${apiUrl}/api/recruiter/change-password`,
        {
          method: "POST",

          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            current_password:
              currentPassword,

            new_password:
              newPassword,
          }),
        }
      );

      const data =
        await response.json();

      if (response.status === 401) {
        router.replace(
          "/recruiter/login"
        );

        return;
      }

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to change password."
        );
      }

      router.replace(
        "/recruiter/dashboard"
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to change password."
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f9fd]">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-4 text-sm font-semibold text-slate-500">
            Checking account...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f9fd] px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl sm:p-10">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-xl">
            🔐
          </div>

          <h1 className="mt-5 text-3xl font-black">
            Create your password
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            For security, replace your
            temporary password before accessing
            the recruiter dashboard.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >
          <PasswordInput
            label="Temporary Password"
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder="Enter temporary password"
          />

          <PasswordInput
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="Minimum 8 characters"
          />

          <PasswordInput
            label="Confirm New Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Enter new password again"
          />

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-6 py-4 font-black text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {loading
              ? "Updating password..."
              : "Set Password & Continue →"}
          </button>
        </form>
      </div>
    </main>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <input
        type="password"
        required
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}