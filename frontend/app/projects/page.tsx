"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { requireFresher } from "../lib/auth";
import { useRouter } from "next/navigation";

type Project = {
  id: number;
  title: string;
  description: string | null;
  technologies: string | null;
  github_url: string | null;
  live_url: string | null;
};

export default function ProjectsPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [technologies, setTechnologies] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    setLoading(true);

    try {
      const auth = await requireFresher();

      if (!auth.allowed) {
        router.replace(auth.redirectTo!);
        return;
      }

      const user = auth.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Error loading projects:",
          error
        );

        setLoading(false);
        return;
      }

      setProjects(data || []);
      setLoading(false);
    } catch (err) {
      console.error(
        "Unexpected project load error:",
        err
      );

      setLoading(false);
    }
  }

  async function addProject() {
    if (!title.trim() || adding) {
      if (!title.trim()) {
        alert("Please enter a project title.");
      }
      return;
    }

    setAdding(true);

    try {
      const auth = await requireFresher();

      if (!auth.allowed) {
        setAdding(false);

        router.replace(
          auth.redirectTo!
        );

        return;
      }

      const user = auth.user;

      if (!user) {
        setAdding(false);

        router.replace("/login");

        return;
      }

      const { error } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          title: title.trim(),
          description:
            description.trim() || null,
          technologies:
            technologies.trim() || null,
          github_url:
            githubUrl.trim() || null,
          live_url:
            liveUrl.trim() || null,
        });

      if (error) {
        console.error(
          "Error adding project:",
          error
        );

        alert(error.message);

        setAdding(false);

        return;
      }

      setTitle("");
      setDescription("");
      setTechnologies("");
      setGithubUrl("");
      setLiveUrl("");

      await loadProjects();

      setAdding(false);
    } catch (err) {
      console.error(
        "Unexpected add project error:",
        err
      );

      setAdding(false);

      alert(
        err instanceof Error
          ? err.message
          : "Could not add project."
      );
    }
  }

  async function deleteProject(
    id: number
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this project?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const auth = await requireFresher();

      if (!auth.allowed) {
        router.replace(
          auth.redirectTo!
        );

        return;
      }

      const user = auth.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error(
          "Error deleting project:",
          error
        );

        alert(error.message);

        return;
      }

      setProjects(
        (currentProjects) =>
          currentProjects.filter(
            (project) =>
              project.id !== id
          )
      );
    } catch (err) {
      console.error(
        "Unexpected delete project error:",
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : "Could not delete project."
      );
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <div className="text-center">
          <p className="font-semibold">
            Loading projects...
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Preparing your portfolio
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">

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
            href="/dashboard"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            ← Dashboard
          </Link>

        </div>

      </nav>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">

        <div>

          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
            Project Portfolio
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl md:text-5xl">
            Show what you&apos;ve built.
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-slate-600">
            Add projects that demonstrate your skills. Companies can review your actual work instead of relying only on your resume.
          </p>

        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              Add a Project
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Highlight the problem, your contribution, the technologies used and links to your work.
            </p>
          </div>

          <div className="mt-6 space-y-5">

            <div>

              <label className="text-sm font-medium text-slate-700">
                Project Title *
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
                placeholder="e.g. AI Resume Analyzer"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

            </div>

            <div>

              <label className="text-sm font-medium text-slate-700">
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                placeholder="Explain what you built, the problem it solves, and your contribution."
                rows={5}
                className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

            </div>

            <div>

              <label className="text-sm font-medium text-slate-700">
                Technologies
              </label>

              <input
                type="text"
                value={technologies}
                onChange={(e) =>
                  setTechnologies(
                    e.target.value
                  )
                }
                placeholder="e.g. Python, FastAPI, Qdrant, React"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              <p className="mt-2 text-xs text-slate-500">
                Separate technologies with commas.
              </p>

            </div>

            <div className="grid gap-5 md:grid-cols-2">

              <div>

                <label className="text-sm font-medium text-slate-700">
                  GitHub URL
                </label>

                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) =>
                    setGithubUrl(
                      e.target.value
                    )
                  }
                  placeholder="https://github.com/username/project"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

              </div>

              <div>

                <label className="text-sm font-medium text-slate-700">
                  Live Demo URL
                </label>

                <input
                  type="url"
                  value={liveUrl}
                  onChange={(e) =>
                    setLiveUrl(
                      e.target.value
                    )
                  }
                  placeholder="https://your-project.com"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

              </div>

            </div>

            <button
              onClick={addProject}
              disabled={
                adding ||
                !title.trim()
              }
              className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {adding
                ? "Adding Project..."
                : "Add Project +"}
            </button>

          </div>

        </div>

        <div className="mt-8">

          <div className="flex items-center justify-between gap-4">

            <div>
              <h2 className="text-2xl font-semibold text-slate-950">
                Your Projects
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {projects.length} project
                {projects.length !== 1
                  ? "s"
                  : ""}{" "}
                added
              </p>
            </div>

            {projects.length > 0 && (
              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Portfolio active
              </span>
            )}

          </div>

          {projects.length === 0 ? (

            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl">
                🧩
              </div>

              <p className="mt-5 text-lg font-medium text-slate-950">
                No projects added yet
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Add your first project above.
              </p>

            </div>

          ) : (

            <div className="mt-5 space-y-5">

              {projects.map(
                (project) => (

                  <div
                    key={project.id}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                  >

                    <div className="flex flex-col justify-between gap-4 md:flex-row">

                      <div className="min-w-0">

                        <h3 className="break-words text-xl font-semibold text-slate-950">
                          {project.title}
                        </h3>

                        {project.description && (
                          <p className="mt-3 whitespace-pre-wrap break-words leading-7 text-slate-600">
                            {project.description}
                          </p>
                        )}

                      </div>

                      <button
                        onClick={() =>
                          deleteProject(
                            project.id
                          )
                        }
                        className="self-start rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700"
                      >
                        Delete
                      </button>

                    </div>

                    {project.technologies && (

                      <div className="mt-5">

                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Technologies
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">

                          {project.technologies
                            .split(",")
                            .map(
                              (
                                technology
                              ) => {
                                const trimmedTechnology =
                                  technology.trim();

                                if (!trimmedTechnology) {
                                  return null;
                                }

                                return (
                                  <span
                                    key={
                                      trimmedTechnology
                                    }
                                    className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                                  >
                                    {trimmedTechnology}
                                  </span>
                                );
                              }
                            )}

                        </div>

                      </div>

                    )}

                    {(project.github_url ||
                      project.live_url) && (

                      <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-200 pt-5">

                        {project.github_url && (

                          <a
                            href={
                              project.github_url
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                          >
                            GitHub ↗
                          </a>

                        )}

                        {project.live_url && (

                          <a
                            href={
                              project.live_url
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                          >
                            Live Demo ↗
                          </a>

                        )}

                      </div>

                    )}

                  </div>

                )
              )}

            </div>

          )}

        </div>

        {projects.length > 0 && (

          <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6">

            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              Next Step
            </p>

            <h2 className="mt-2 text-xl font-semibold text-slate-950">
              Verify your skills
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Complete practical assessments to turn your skills into verified scores that companies can trust.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">

              <Link
                href="/assessments"
                className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Take Assessment →
              </Link>

              <Link
                href="/skills"
                className="rounded-xl border border-blue-200 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-blue-50"
              >
                Manage Skills
              </Link>

            </div>

          </div>

        )}

      </section>

    </main>
  );
}
