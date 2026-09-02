"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { requireFresher } from "../lib/auth";
import { useRouter } from "next/navigation";

type Skill = {
  id: number;
  skill_name: string;
  skill_level: string;
};

const availableSkills = [
  "Python",
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "FastAPI",
  "SQL",
  "PostgreSQL",
  "MongoDB",
  "AI / ML",
  "RAG",
  "LangChain",
  "Data Science",
  "Git",
];

const CUSTOM_SKILL_OPTION = "__custom__";
const MAX_CUSTOM_SKILL_LENGTH = 80;

export default function SkillsPage() {
  const router = useRouter();

  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillName, setSkillName] = useState("");
  const [customSkillName, setCustomSkillName] = useState("");
  const [skillLevel, setSkillLevel] = useState("Intermediate");

  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadSkills();
  }, []);

  async function loadSkills() {
    setLoading(true);

    try {
      const auth =
        await requireFresher();

      if (!auth.allowed) {
        router.replace(
          auth.redirectTo!
        );

        return;
      }

      const user =
        auth.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data, error } =
        await supabase
          .from("skills")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          });

      if (error) {
        console.error(
          "Error loading skills:",
          error
        );

        setLoading(false);

        return;
      }

      setSkills(data || []);
      setLoading(false);
    } catch (err) {
      console.error(
        "Unexpected skills load error:",
        err
      );

      setLoading(false);
    }
  }

  function getSelectedSkillName() {
    if (
      skillName ===
      CUSTOM_SKILL_OPTION
    ) {
      return customSkillName.trim();
    }

    return skillName.trim();
  }

  async function addSkill() {
    if (adding) {
      return;
    }

    const finalSkillName =
      getSelectedSkillName();

    if (!finalSkillName) {
      alert(
        "Please select or enter a skill."
      );
      return;
    }

    if (
      finalSkillName.length >
      MAX_CUSTOM_SKILL_LENGTH
    ) {
      alert(
        `Skill name must be ${MAX_CUSTOM_SKILL_LENGTH} characters or fewer.`
      );
      return;
    }

    setAdding(true);

    try {
      const auth =
        await requireFresher();

      if (!auth.allowed) {
        setAdding(false);

        router.replace(
          auth.redirectTo!
        );

        return;
      }

      const user =
        auth.user;

      if (!user) {
        setAdding(false);

        router.replace("/login");

        return;
      }

      const normalizedSkillName =
        finalSkillName.toLowerCase();

      const alreadyExists =
        skills.some(
          (skill) =>
            skill.skill_name
              .trim()
              .toLowerCase() ===
            normalizedSkillName
        );

      if (alreadyExists) {
        alert(
          "You have already added this skill."
        );

        setAdding(false);

        return;
      }

      const { error } =
        await supabase
          .from("skills")
          .insert({
            user_id:
              user.id,

            skill_name:
              finalSkillName,

            skill_level:
              skillLevel,
          });

      if (error) {
        console.error(
          "Error adding skill:",
          error
        );

        alert(
          error.message
        );

        setAdding(false);

        return;
      }

      setSkillName("");
      setCustomSkillName("");
      setSkillLevel(
        "Intermediate"
      );

      await loadSkills();

      setAdding(false);
    } catch (err) {
      console.error(
        "Unexpected add skill error:",
        err
      );

      setAdding(false);

      alert(
        err instanceof Error
          ? err.message
          : "Could not add skill."
      );
    }
  }

  async function deleteSkill(
    id: number
  ) {
    try {
      const auth =
        await requireFresher();

      if (!auth.allowed) {
        router.replace(
          auth.redirectTo!
        );

        return;
      }

      const user =
        auth.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      const { error } =
        await supabase
          .from("skills")
          .delete()
          .eq("id", id)
          .eq(
            "user_id",
            user.id
          );

      if (error) {
        console.error(
          "Error deleting skill:",
          error
        );

        alert(
          error.message
        );

        return;
      }

      setSkills(
        (currentSkills) =>
          currentSkills.filter(
            (skill) =>
              skill.id !== id
          )
      );
    } catch (err) {
      console.error(
        "Unexpected delete skill error:",
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : "Could not delete skill."
      );
    }
  }

  const canAddSkill =
    Boolean(
      getSelectedSkillName()
    ) &&
    !adding;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <div className="text-center">
          <p className="font-semibold">
            Loading skills...
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Preparing your skill profile
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
            Skill Profile
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl md:text-5xl">
            Show what you know.
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-slate-600">
            Add your technical skills and experience level. FresherHire uses these skills to improve job matching and assessment verification.
          </p>

        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                Add a Skill
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Choose a common skill or enter your own custom skill.
              </p>
            </div>

            <span className="w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {skills.length} added
            </span>

          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">

            <div>

              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Skill
              </label>

              <select
                value={skillName}
                onChange={(e) => {
                  const value =
                    e.target.value;

                  setSkillName(
                    value
                  );

                  if (
                    value !==
                    CUSTOM_SKILL_OPTION
                  ) {
                    setCustomSkillName("");
                  }
                }}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >

                <option value="">
                  Select a skill
                </option>

                {availableSkills.map(
                  (skill) => (
                    <option
                      key={skill}
                      value={skill}
                    >
                      {skill}
                    </option>
                  )
                )}

                <option
                  value={
                    CUSTOM_SKILL_OPTION
                  }
                >
                  Other / Custom Skill
                </option>

              </select>

            </div>

            <div>

              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Level
              </label>

              <select
                value={skillLevel}
                onChange={(e) =>
                  setSkillLevel(
                    e.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >

                <option value="Beginner">
                  Beginner
                </option>

                <option value="Intermediate">
                  Intermediate
                </option>

                <option value="Advanced">
                  Advanced
                </option>

              </select>

            </div>

            <div className="flex items-end">

              <button
                onClick={addSkill}
                disabled={
                  !canAddSkill
                }
                className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {adding
                  ? "Adding..."
                  : "Add Skill +"}
              </button>

            </div>

          </div>

          {skillName ===
            CUSTOM_SKILL_OPTION && (

            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">

              <label
                htmlFor="custom-skill"
                className="text-xs font-semibold uppercase tracking-wide text-blue-700"
              >
                Custom Skill
              </label>

              <input
                id="custom-skill"
                type="text"
                value={
                  customSkillName
                }
                maxLength={
                  MAX_CUSTOM_SKILL_LENGTH
                }
                onChange={(e) =>
                  setCustomSkillName(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (
                    e.key ===
                    "Enter"
                  ) {
                    e.preventDefault();

                    if (
                      canAddSkill
                    ) {
                      addSkill();
                    }
                  }
                }}
                placeholder="e.g. Docker, PyTorch, AWS, Figma, Power BI..."
                autoFocus
                className="mt-2 w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              <div className="mt-2 flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">

                <span>
                  Type any skill that is not in the list.
                </span>

                <span>
                  {customSkillName.length}/
                  {MAX_CUSTOM_SKILL_LENGTH}
                </span>

              </div>

            </div>

          )}

        </div>

        <div className="mt-8">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-2xl font-semibold text-slate-950">
                Your Skills
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {skills.length} skill
                {skills.length !== 1
                  ? "s"
                  : ""}{" "}
                added
              </p>

            </div>

          </div>

          {skills.length === 0 ? (

            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl">
                🧠
              </div>

              <p className="mt-5 text-lg font-medium text-slate-950">
                No skills added yet
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Add your first skill above.
              </p>

            </div>

          ) : (

            <div className="mt-5 grid gap-4 sm:grid-cols-2">

              {skills.map(
                (skill) => (

                  <div
                    key={skill.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                  >

                    <div>

                      <h3 className="font-semibold text-slate-950">
                        {skill.skill_name}
                      </h3>

                      <div className="mt-2 inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                        {skill.skill_level}
                      </div>

                    </div>

                    <button
                      onClick={() =>
                        deleteSkill(
                          skill.id
                        )
                      }
                      className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700"
                    >
                      Remove
                    </button>

                  </div>

                )
              )}

            </div>

          )}

        </div>

        {skills.length > 0 && (

          <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6">

            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              Next Step
            </p>

            <h2 className="mt-2 text-xl font-semibold text-slate-950">
              Add projects to prove your skills
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Projects give companies real evidence of what you can build.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">

              <Link
                href="/projects"
                className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Add Projects →
              </Link>

              <Link
                href="/assessments"
                className="rounded-xl border border-blue-200 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-blue-50"
              >
                Take Assessment
              </Link>

            </div>

          </div>

        )}

      </section>

    </main>
  );
}
