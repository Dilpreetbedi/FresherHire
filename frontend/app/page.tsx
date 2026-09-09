"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import RecruiterJoiningBanner from "./components/RecruiterJoiningBanner";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: "easeOut" as const },
  },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const features = [
  {
    icon: "⚡",
    title: "Build a recruiter-ready profile",
    description:
      "Bring your headline, education, internships, experience, projects, skills and resume into one structured profile.",
  },
  {
    icon: "🧠",
    title: "Show proof, not just claims",
    description:
      "Complete role-relevant assessments and place verified scores next to your skills and work samples.",
  },
  {
    icon: "🚀",
    title: "Be ready before recruiters search",
    description:
      "Complete your profile early so companies joining FresherHire can evaluate a stronger candidate profile.",
  },
];

const profileItems = [
  "Resume Headline",
  "Education",
  "Internships",
  "Experience",
  "Projects",
  "Skills",
  "Assessments",
  "Resume",
];

const skillCloud = [
  "Python",
  "AI / ML",
  "React",
  "JavaScript",
  "SQL",
  "Data",
  "Sales",
  "Marketing",
  "HR",
  "Communication",
  "FastAPI",
  "RAG",
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f9fd] text-slate-900">
      <nav className="sticky top-0 z-50 border-b border-white/70 bg-white/75 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-2xl font-black tracking-tight">
            <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-slate-950 text-sm font-black text-white shadow-lg shadow-blue-200">
              F
              <span className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-violet-500" />
            </span>
            <span>
              Fresher<span className="text-blue-600">Hire</span>
            </span>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
            <a href="#why" className="transition hover:text-slate-950">Why FresherHire</a>
            <a href="#profile" className="transition hover:text-slate-950">Your Profile</a>
            <a href="#how-it-works" className="transition hover:text-slate-950">How It Works</a>
            <a href="#companies" className="transition hover:text-slate-950">For Companies</a>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:block">
              Sign In
            </Link>
            <Link href="/signup/fresher" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-blue-600">
              Build My Profile
            </Link>
          </div>
        </div>
      </nav>

      <RecruiterJoiningBanner />

      <section className="relative isolate overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pt-20 md:pb-28 md:pt-24">
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_bottom,#f8fbff_0%,#f6f8fc_55%,#eef4ff_100%)]" />

        <motion.div
          animate={{ x: [0, 70, 10, 0], y: [0, 25, -15, 0], scale: [1, 1.08, 0.96, 1] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-32 top-8 -z-10 h-[28rem] w-[28rem] rounded-full bg-blue-300/25 blur-[110px]"
        />

        <motion.div
          animate={{ x: [0, -50, 10, 0], y: [0, 30, -10, 0], scale: [1, 0.94, 1.08, 1] }}
          transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-32 top-12 -z-10 h-[30rem] w-[30rem] rounded-full bg-violet-300/20 blur-[120px]"
        />

        <div
          className="absolute inset-0 -z-10 opacity-[0.22]"
          style={{
            backgroundImage:
              "linear-gradient(rgb(148 163 184 / 0.18) 1px, transparent 1px), linear-gradient(90deg, rgb(148 163 184 / 0.18) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
            maskImage: "linear-gradient(to bottom, black 0%, black 45%, transparent 100%)",
          }}
        />

        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/85 px-4 py-2 text-sm font-bold text-blue-700 shadow-sm backdrop-blur-xl">
              <motion.span
                animate={{ scale: [1, 1.35, 1], opacity: [0.65, 1, 0.65] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                className="h-2 w-2 rounded-full bg-green-500"
              />
              Fresher profiles are being built now
            </motion.div>

            <motion.h1 variants={fadeUp} className="mt-7 max-w-4xl text-5xl font-black tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-7xl xl:text-[5.25rem] xl:leading-[0.96]">
              Don&apos;t wait for the job.
              <span className="block bg-gradient-to-r from-blue-600 via-cyan-500 to-violet-600 bg-clip-text text-transparent">
                Build the profile first.
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              FresherHire helps 0–2 year candidates turn education, internships, projects, skills, assessments and a resume into one recruiter-ready profile.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <motion.div whileHover={{ y: -3, scale: 1.015 }} whileTap={{ scale: 0.985 }}>
                <Link href="/signup/fresher" className="group flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-4 text-base font-bold text-white shadow-2xl shadow-blue-200">
                  Create My Fresher Profile
                  <span className="transition group-hover:translate-x-1">→</span>
                </Link>
              </motion.div>

              <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.985 }}>
                <Link href="/login" className="flex items-center justify-center rounded-2xl border border-slate-300 bg-white/90 px-7 py-4 text-base font-bold text-slate-800 shadow-sm backdrop-blur transition hover:border-blue-300">
                  I Already Have an Account
                </Link>
              </motion.div>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
              {["Free for freshers", "0–2 years experience", "Technical + non-technical roles", "Skill-based profile"].map((item) => (
                <span key={item} className="rounded-full border border-slate-200 bg-white/80 px-3 py-2 shadow-sm">
                  ✓ {item}
                </span>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.85, delay: 0.15 }}
            className="relative mx-auto w-full max-w-2xl"
          >
            <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-r from-blue-500/20 via-cyan-400/10 to-violet-500/20 blur-2xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-slate-950 p-2 shadow-[0_35px_80px_-25px_rgba(15,23,42,0.45)]">
              <div className="rounded-[1.65rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,#1d4ed8_0%,#0f172a_35%,#020617_100%)] p-5 sm:p-7">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-lg font-black text-white shadow-lg">F</div>
                    <div>
                      <p className="font-bold text-white">Your Fresher Profile</p>
                      <p className="mt-1 text-xs text-slate-400">Recruiter-ready preview</p>
                    </div>
                  </div>

                  <span className="rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-xs font-semibold text-green-300">
                    Profile Active
                  </span>
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">Resume Headline</p>
                  <p className="mt-3 text-lg font-bold leading-7 text-white">
                    Entry-level professional ready to prove skills through projects, assessments and practical work.
                  </p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <DarkMiniCard label="Education" value="College + XII + X" icon="🎓" delay={0} />
                  <DarkMiniCard label="Experience" value="Internship / Full Time" icon="💼" delay={0.25} />
                  <DarkMiniCard label="Assessment" value="87% • Verified" icon="✓" delay={0.5} />
                  <DarkMiniCard label="Resume" value="Uploaded" icon="📄" delay={0.75} />
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">Profile Strength</p>
                    <p className="text-sm font-black text-cyan-300">86%</p>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "86%" }}
                      transition={{ duration: 1.4, delay: 0.7 }}
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-violet-500"
                    />
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-400">
                    Complete each section so recruiters get more context before they open your resume.
                  </p>
                </div>
              </div>
            </div>

            <motion.div
              animate={{ y: [0, -8, 0], rotate: [-1.2, 1.2, -1.2] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-5 top-24 hidden rounded-2xl border border-white/70 bg-white/90 p-4 shadow-xl backdrop-blur lg:block"
            >
              <p className="text-xs font-semibold text-slate-500">VERIFIED SKILL</p>
              <p className="mt-1 font-black text-slate-950">AI / ML • 87%</p>
            </motion.div>

            <motion.div
              animate={{ y: [0, 9, 0], rotate: [1.2, -1.2, 1.2] }}
              transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-4 bottom-20 hidden rounded-2xl border border-white/70 bg-white/90 p-4 shadow-xl backdrop-blur lg:block"
            >
              <p className="text-xs font-semibold text-slate-500">PROFILE STATUS</p>
              <p className="mt-1 font-black text-green-600">✓ Recruiter Ready</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-slate-200/80 bg-white/80 px-4 py-8 backdrop-blur sm:px-6">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Your profile can highlight</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {profileItems.map((item) => (
              <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="why" className="px-4 py-20 sm:px-6 md:py-28">
        <div className="mx-auto max-w-7xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} variants={stagger}>
            <motion.div variants={fadeUp} className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">Why build it now?</p>
              <h2 className="mt-5 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">A plain resume is easy to ignore.</h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                FresherHire gives you more ways to show what makes you worth a recruiter&apos;s attention before an interview even starts.
              </p>
            </motion.div>

            <motion.div variants={stagger} className="mt-12 grid gap-5 md:grid-cols-3">
              {features.map((feature) => (
                <motion.div
                  key={feature.title}
                  variants={fadeUp}
                  whileHover={{ y: -7 }}
                  className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:border-blue-200 hover:shadow-xl"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 text-xl">{feature.icon}</div>
                  <h3 className="mt-5 text-xl font-black leading-7 text-slate-950">{feature.title}</h3>
                  <p className="mt-3 leading-7 text-slate-600">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="profile" className="relative overflow-hidden border-y border-slate-200 bg-slate-950 px-4 py-20 text-white sm:px-6 md:py-28">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgb(59 130 246 / 0.35) 1px, transparent 0)", backgroundSize: "30px 30px" }} />

        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} variants={stagger}>
            <motion.p variants={fadeUp} className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">One profile. More proof.</motion.p>
            <motion.h2 variants={fadeUp} className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Give recruiters the full story, not just one PDF.</motion.h2>
            <motion.p variants={fadeUp} className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
              Combine academic background, internships, employment, projects, assessments and your resume in one recruiter-friendly profile.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8">
              <Link href="/signup/fresher" className="inline-flex rounded-2xl bg-white px-6 py-3.5 font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-50">
                Start Building My Profile →
              </Link>
            </motion.div>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} variants={stagger} className="grid gap-3 sm:grid-cols-2">
            {[
              ["01", "Resume Headline", "A strong one-line professional identity."],
              ["02", "Education", "College, Class XII, Class X and more."],
              ["03", "Experience", "Internships, full-time, freelance or apprenticeships."],
              ["04", "Projects", "Show practical work and portfolio evidence."],
              ["05", "Assessments", "Add verified role-relevant scores."],
              ["06", "Resume", "Keep your latest PDF attached to the profile."],
            ].map(([number, title, description]) => (
              <motion.div key={number} variants={fadeUp} className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
                <p className="text-xs font-black text-cyan-300">{number}</p>
                <h3 className="mt-3 font-bold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="how-it-works" className="px-4 py-20 sm:px-6 md:py-28">
        <div className="mx-auto max-w-7xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">From signup to recruiter-ready</p>
            <h2 className="mt-5 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Four steps. One stronger first impression.</h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={stagger} className="mt-14 grid gap-4 md:grid-cols-4">
            {[
              ["01", "Create Account", "Register as a fresher and complete your basic details."],
              ["02", "Build Your Story", "Add education, experience, headline, resume, skills and projects."],
              ["03", "Prove Your Skills", "Take role-relevant assessments and add verified evidence."],
              ["04", "Get Discovered", "Keep your profile ready for companies reviewing fresher talent."],
            ].map(([number, title, text]) => (
              <motion.div key={number} variants={fadeUp} whileHover={{ y: -6 }} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-xs font-black text-white">{number}</div>
                <h3 className="mt-5 text-lg font-black text-slate-950">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-4 py-20 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={stagger} className="mx-auto max-w-7xl text-center">
          <motion.p variants={fadeUp} className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">Technical + non-technical roles</motion.p>
          <motion.h2 variants={fadeUp} className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Build evidence around the role you want.</motion.h2>
          <motion.p variants={fadeUp} className="mx-auto mt-4 max-w-2xl text-slate-600">
            Present skills relevant to your target role, whether you&apos;re aiming for engineering, data, AI, sales, marketing, HR or other entry-level opportunities.
          </motion.p>
          <motion.div variants={stagger} className="mt-9 flex flex-wrap justify-center gap-3">
            {skillCloud.map((skill) => (
              <motion.span key={skill} variants={fadeUp} whileHover={{ y: -4, scale: 1.04 }} className="rounded-full border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-bold text-slate-700">
                {skill}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      </section>

      <section id="companies" className="px-4 py-20 sm:px-6 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.65 }}
            className="relative overflow-hidden rounded-[2rem] border border-blue-200 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white shadow-xl shadow-blue-100 sm:p-10"
          >
            <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-cyan-300/20 blur-3xl" />
            <div className="relative">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-100">For Freshers</p>
              <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">Your profile can be more than a resume.</h2>
              <p className="mt-5 max-w-xl leading-7 text-blue-100">
                Register, complete every relevant section and make it easier for recruiters to understand your skills and background quickly.
              </p>
              <Link href="/signup/fresher" className="mt-8 inline-flex rounded-2xl bg-white px-6 py-3.5 font-black text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50">
                Register as Fresher →
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.65 }}
            className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 p-8 text-white shadow-xl sm:p-10"
          >
            <div className="absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="relative">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">For Companies</p>
              <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">Discover fresher talent with more context.</h2>
              <p className="mt-5 max-w-xl leading-7 text-slate-300">
                Review candidate profiles with education, experience, skills, projects, assessments, activity and resume information in one place.
              </p>
              <Link href="/signup/company" className="mt-8 inline-flex rounded-2xl border border-white/15 bg-white/10 px-6 py-3.5 font-black text-white transition hover:bg-white/15">
                I&apos;m Hiring →
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 md:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.7 }}
          className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.25rem] border border-blue-200 bg-white p-8 text-center shadow-2xl shadow-blue-100 sm:p-12"
        >
          <div className="absolute left-1/2 top-0 h-40 w-3/4 -translate-x-1/2 rounded-full bg-blue-200/40 blur-[80px]" />
          <div className="relative">
            <span className="inline-flex rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-bold text-green-700">🚀 Recruiters are joining FresherHire</span>
            <h2 className="mx-auto mt-6 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Make your profile complete before someone searches for your role.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Add your resume headline, education, experience, skills, projects, assessments and resume today.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/signup/fresher" className="rounded-2xl bg-blue-600 px-7 py-4 font-black text-white shadow-xl shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700">
                Create My Profile →
              </Link>
              <Link href="/dashboard" className="rounded-2xl border border-slate-300 bg-white px-7 py-4 font-black text-slate-800 transition hover:bg-slate-50">
                Complete Existing Profile
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-4 py-9 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-7 md:flex-row md:items-center">
            <div>
              <Link href="/" className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-900">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-xs text-white">F</span>
                <span>Fresher<span className="text-blue-600">Hire</span></span>
              </Link>
              <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
                A recruitment technology platform helping freshers prove their skills and companies discover entry-level talent.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-slate-600">
              <Link href="/terms" className="transition hover:text-blue-600">Terms & Conditions</Link>
              <Link href="/privacy" className="transition hover:text-blue-600">Privacy Policy</Link>
              <Link href="/refund-policy" className="transition hover:text-blue-600">Refund & Cancellation</Link>
              <Link href="/contact" className="transition hover:text-blue-600">Contact Us</Link>
            </div>
          </div>

          <div className="mt-7 border-t border-slate-200 pt-5 text-sm text-slate-500">© 2026 FresherHire. All rights reserved.</div>
        </div>
      </footer>
    </main>
  );
}

function DarkMiniCard({
  label,
  value,
  icon,
  delay,
}: {
  label: string;
  value: string;
  icon: string;
  delay: number;
}) {
  return (
    <motion.div
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay }}
      className="rounded-2xl border border-white/10 bg-white/[0.06] p-4"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-sm">{icon}</span>
        <div>
          <p className="text-xs font-semibold text-slate-400">{label}</p>
          <p className="mt-1 text-sm font-bold text-white">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}
