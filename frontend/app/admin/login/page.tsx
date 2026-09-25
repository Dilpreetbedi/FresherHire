"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";


export default function AdminLoginPage() {

  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  async function handleLogin(
    e: FormEvent<HTMLFormElement>
  ) {

    e.preventDefault();

    setLoading(true);

    setError("");


    try {

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:8000";


      const response = await fetch(
        `${apiUrl}/api/admin/login`,
        {
          method: "POST",

          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email,
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


      router.push(
        "/admin/leads"
      );

      router.refresh();


    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );

    } finally {

      setLoading(false);

    }
  }


  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f9fd] px-4">

      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl sm:p-10">

        <Link
          href="/"
          className="flex items-center justify-center gap-2 text-xl font-black"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-sm text-white">
            F
          </span>

          <span>
            Fresher
            <span className="text-blue-600">
              Hire
            </span>
          </span>
        </Link>


        <div className="mt-8 text-center">

          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
            Admin
          </p>

          <h1 className="mt-3 text-3xl font-black text-slate-950">
            Admin Login
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Sign in to manage recruiter
            enquiries and company leads.
          </p>

        </div>


        <form
          onSubmit={handleLogin}
          className="mt-8 space-y-5"
        >

          <div>

            <label
              htmlFor="email"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Admin Email
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
              placeholder="admin@example.com"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />

          </div>


          <div>

            <label
              htmlFor="password"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Password
            </label>

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
              placeholder="Enter password"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />

          </div>


          {error && (

            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
              {error}
            </div>

          )}


          <button
            disabled={loading}
            type="submit"
            className="w-full rounded-xl bg-slate-950 px-6 py-4 font-black text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          >

            {loading
              ? "Signing in..."
              : "Sign In to Admin"}

          </button>

        </form>


        <p className="mt-6 text-center text-xs text-slate-400">
          FresherHire Administration
        </p>

      </div>

    </main>
  );
}